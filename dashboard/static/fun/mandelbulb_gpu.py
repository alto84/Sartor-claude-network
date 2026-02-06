"""
GPU-Accelerated 3D Mandelbulb Fractal Renderer
================================================
Ray-marches a 3D Mandelbulb fractal using PyTorch on CUDA (RTX 5090).
Features: distance estimation, ambient occlusion, specular highlights,
soft shadows, and rich coloring based on iteration count + surface normals.
"""

import torch
import numpy as np
import time
import os
import sys

# ─── Configuration ───────────────────────────────────────────────────────────

WIDTH = 1920
HEIGHT = 1080
DEVICE = 'cuda'
POWER = 8.0           # Mandelbulb power parameter
MAX_ITER = 12         # Fractal iterations for DE
MAX_STEPS = 200       # Ray march steps
MAX_DIST = 20.0       # Maximum ray distance
EPSILON = 0.0005      # Surface hit threshold
BAILOUT = 2.0         # Escape radius

OUTPUT_DIR = os.path.expanduser("~/Sartor-claude-network/dashboard/static/fun/mandelbulb")


# ─── Mandelbulb Distance Estimator ──────────────────────────────────────────

def mandelbulb_de(pos, power=POWER, max_iter=MAX_ITER, bailout=BAILOUT):
    """
    Compute distance estimate and iteration count for Mandelbulb.
    pos: (N, 3) tensor of 3D points
    Returns: (distance, iterations, trap_value) each (N,)
    """
    x = pos[:, 0]
    y = pos[:, 1]
    z = pos[:, 2]

    x0, y0, z0 = x.clone(), y.clone(), z.clone()

    dr = torch.ones_like(x)  # Running derivative
    r = torch.zeros_like(x)  # Radius

    iterations = torch.zeros_like(x)
    trap = torch.full_like(x, 1e10)  # Orbit trap for coloring

    for i in range(max_iter):
        r = torch.sqrt(x * x + y * y + z * z)
        trap = torch.min(trap, r)

        # Bail out
        active = r < bailout
        if not active.any():
            break

        iterations = iterations + active.float()

        # Convert to spherical
        theta = torch.acos(torch.clamp(z / (r + 1e-10), -1.0, 1.0))
        phi = torch.atan2(y, x)

        # Power the derivative
        dr = torch.where(active, r.pow(power - 1.0) * power * dr + 1.0, dr)

        # Scale and rotate
        zr = r.pow(power)
        theta = theta * power
        phi = phi * power

        # Convert back to cartesian
        sin_theta = torch.sin(theta)
        x_new = zr * sin_theta * torch.cos(phi) + x0
        y_new = zr * sin_theta * torch.sin(phi) + y0
        z_new = zr * torch.cos(theta) + z0

        x = torch.where(active, x_new, x)
        y = torch.where(active, y_new, y)
        z = torch.where(active, z_new, z)

    r = torch.sqrt(x * x + y * y + z * z)
    dist = 0.5 * torch.log(r + 1e-10) * r / (dr + 1e-10)

    return dist, iterations, trap


# ─── Surface Normal via Gradient ─────────────────────────────────────────────

def estimate_normal(pos, eps=0.0005):
    """
    Estimate surface normal using tetrahedron technique (4 samples).
    pos: (N, 3)
    Returns: (N, 3) normalized normals
    """
    e = eps

    # Tetrahedron offsets for fewer samples than central difference
    k = torch.tensor([
        [ 1, -1, -1],
        [-1, -1,  1],
        [-1,  1, -1],
        [ 1,  1,  1]
    ], device=pos.device, dtype=pos.dtype)

    normal = torch.zeros_like(pos)
    for i in range(4):
        offset = k[i] * e
        p = pos + offset.unsqueeze(0)
        d, _, _ = mandelbulb_de(p)
        normal += k[i].unsqueeze(0) * d.unsqueeze(1)

    return torch.nn.functional.normalize(normal, dim=1)


# ─── Ambient Occlusion ──────────────────────────────────────────────────────

def ambient_occlusion(pos, normal, steps=5):
    """
    Compute ambient occlusion by marching along the normal.
    """
    ao = torch.zeros(pos.shape[0], device=pos.device)
    scale = 1.0

    for i in range(steps):
        step_dist = 0.02 + 0.06 * float(i)
        sample_pos = pos + normal * step_dist
        d, _, _ = mandelbulb_de(sample_pos)
        ao += scale * (step_dist - d).clamp(min=0.0)
        scale *= 0.5

    return (1.0 - ao.clamp(0.0, 1.0)).clamp(0.0, 1.0)


# ─── Soft Shadow ─────────────────────────────────────────────────────────────

def soft_shadow(pos, light_dir, k=8.0, max_t=4.0, min_t=0.01):
    """
    Compute soft shadow factor by ray marching toward light.
    pos: (N, 3) surface points
    light_dir: (3,) direction to light
    Returns: (N,) shadow factor [0, 1]
    """
    N = pos.shape[0]
    t = torch.full((N,), min_t, device=pos.device)
    shadow = torch.ones(N, device=pos.device)
    ld = light_dir.unsqueeze(0).expand(N, 3)

    for _ in range(32):
        p = pos + ld * t.unsqueeze(1)
        d, _, _ = mandelbulb_de(p)

        shadow = torch.min(shadow, (k * d / t).clamp(0.0, 1.0))
        t = t + d.clamp(min=0.001)

        # Early exit mask
        done = (t > max_t) | (d < 0.0001)
        if done.all():
            break

    return shadow.clamp(0.1, 1.0)


# ─── Coloring ────────────────────────────────────────────────────────────────

def compute_color(iterations, trap, normal, view_dir, light_dir, ao_val, shadow_val):
    """
    Compute rich colors based on iteration count, orbit trap, normals, and lighting.
    Returns: (N, 3) RGB colors in [0, 1]
    """
    N = iterations.shape[0]

    # Normalize iteration count for color mapping
    t = iterations / float(MAX_ITER)
    trap_n = trap.clamp(0, 2) / 2.0

    # Rich palette from iteration count - deep purples, blues, golds, reds
    r = 0.5 + 0.5 * torch.cos(6.28318 * (t * 1.0 + 0.0) + trap_n * 2.0)
    g = 0.5 + 0.5 * torch.cos(6.28318 * (t * 1.0 + 0.33) + trap_n * 1.5)
    b = 0.5 + 0.5 * torch.cos(6.28318 * (t * 1.0 + 0.67) + trap_n * 1.0)

    # Mix with warmer tones based on orbit trap
    r2 = 0.6 + 0.4 * torch.cos(3.14159 * trap_n + 0.5)
    g2 = 0.3 + 0.3 * torch.cos(3.14159 * trap_n + 1.0)
    b2 = 0.2 + 0.5 * torch.cos(3.14159 * trap_n + 2.0)

    mix = (t * 0.6).clamp(0, 1)
    r = r * (1.0 - mix) + r2 * mix
    g = g * (1.0 - mix) + g2 * mix
    b = b * (1.0 - mix) + b2 * mix

    base_color = torch.stack([r, g, b], dim=1)  # (N, 3)

    # Diffuse lighting
    ndotl = (normal * light_dir.unsqueeze(0)).sum(dim=1).clamp(0.0, 1.0)

    # Specular (Blinn-Phong)
    half_dir = torch.nn.functional.normalize(light_dir.unsqueeze(0) - view_dir, dim=1)
    spec = (normal * half_dir).sum(dim=1).clamp(0.0, 1.0).pow(32.0)

    # Fresnel rim lighting
    fresnel = (1.0 - (-view_dir * normal).sum(dim=1).clamp(0.0, 1.0)).pow(3.0)

    # Combine lighting
    ambient = 0.15
    diffuse = ndotl * shadow_val * 0.7
    specular = spec * shadow_val * 0.5
    rim = fresnel * 0.2

    lighting = (ambient + diffuse + rim).unsqueeze(1)
    color = base_color * lighting * ao_val.unsqueeze(1) + specular.unsqueeze(1)

    return color.clamp(0.0, 1.0)


# ─── Background ──────────────────────────────────────────────────────────────

def background_color(ray_dir):
    """
    Gradient background based on ray direction.
    """
    t = 0.5 * (ray_dir[:, 1] + 1.0)
    # Dark space gradient
    r = 0.02 * (1.0 - t) + 0.05 * t
    g = 0.02 * (1.0 - t) + 0.03 * t
    b = 0.05 * (1.0 - t) + 0.12 * t
    return torch.stack([r, g, b], dim=1)


# ─── Camera Setup ────────────────────────────────────────────────────────────

def look_at(eye, target, up=None):
    """
    Create camera rotation matrix from eye, target, up.
    Returns: (3, 3) rotation matrix
    """
    if up is None:
        up = torch.tensor([0.0, 1.0, 0.0], device=eye.device)

    forward = torch.nn.functional.normalize(target - eye, dim=0)
    right = torch.nn.functional.normalize(torch.cross(forward, up), dim=0)
    cam_up = torch.cross(right, forward)

    return torch.stack([right, cam_up, forward], dim=0)  # (3, 3)


# ─── Ray Marching ────────────────────────────────────────────────────────────

def render_scene(eye, target, fov=60.0, width=WIDTH, height=HEIGHT, chunk_size=200000):
    """
    Render the Mandelbulb scene from a given camera position.
    Processes rays in chunks to avoid OOM on very high resolutions.
    """
    device = torch.device(DEVICE)
    t_start = time.time()

    # Camera setup
    eye_t = torch.tensor(eye, dtype=torch.float32, device=device)
    target_t = torch.tensor(target, dtype=torch.float32, device=device)
    cam_rot = look_at(eye_t, target_t)

    # Generate ray directions
    aspect = width / height
    fov_rad = fov * 3.14159265 / 180.0
    scale = np.tan(fov_rad * 0.5)

    # Pixel coordinates
    u = torch.linspace(-1, 1, width, device=device) * scale * aspect
    v = torch.linspace(1, -1, height, device=device) * scale
    vv, uu = torch.meshgrid(v, u, indexing='ij')

    # Ray directions in camera space
    dirs_cam = torch.stack([uu, vv, torch.ones_like(uu)], dim=-1)
    dirs_cam = dirs_cam.reshape(-1, 3)
    dirs_cam = torch.nn.functional.normalize(dirs_cam, dim=1)

    # Transform to world space
    ray_dirs = (dirs_cam @ cam_rot)  # (N, 3)
    ray_dirs = torch.nn.functional.normalize(ray_dirs, dim=1)

    total_pixels = ray_dirs.shape[0]
    final_color = torch.zeros(total_pixels, 3, device=device)

    print(f"  Ray marching {total_pixels:,} rays in chunks of {chunk_size:,}...")

    # Light direction
    light_dir = torch.nn.functional.normalize(
        torch.tensor([0.8, 1.0, 0.6], device=device), dim=0
    )

    for chunk_start in range(0, total_pixels, chunk_size):
        chunk_end = min(chunk_start + chunk_size, total_pixels)
        rd = ray_dirs[chunk_start:chunk_end]
        N = rd.shape[0]

        # Ray origin (same for all rays)
        ro = eye_t.unsqueeze(0).expand(N, 3).clone()

        # March rays
        t = torch.full((N,), 0.01, device=device)
        hit = torch.zeros(N, device=device, dtype=torch.bool)
        iter_at_hit = torch.zeros(N, device=device)
        trap_at_hit = torch.zeros(N, device=device)

        for step in range(MAX_STEPS):
            pos = ro + rd * t.unsqueeze(1)
            dist, iterations, trap = mandelbulb_de(pos)

            # Check for hits
            new_hits = (dist < EPSILON) & (~hit)
            hit = hit | new_hits
            iter_at_hit = torch.where(new_hits, iterations, iter_at_hit)
            trap_at_hit = torch.where(new_hits, trap, trap_at_hit)

            # Advance rays that haven't hit
            t = torch.where(hit, t, t + dist)

            # Stop rays that went too far
            escaped = t > MAX_DIST
            t = torch.where(escaped, torch.tensor(MAX_DIST, device=device), t)

            if hit.all() or (hit | escaped).all():
                break

        # Compute shading for hit pixels
        hit_mask = hit
        hit_indices = hit_mask.nonzero(as_tuple=True)[0]

        # Start with background
        chunk_color = background_color(rd)

        if hit_indices.numel() > 0:
            hit_pos = ro[hit_indices] + rd[hit_indices] * t[hit_indices].unsqueeze(1)

            # Normals
            normals = estimate_normal(hit_pos)

            # AO
            ao_val = ambient_occlusion(hit_pos, normals)

            # Soft shadows
            shadow_val = soft_shadow(hit_pos + normals * 0.002, light_dir)

            # Color
            hit_color = compute_color(
                iter_at_hit[hit_indices],
                trap_at_hit[hit_indices],
                normals,
                rd[hit_indices],
                light_dir,
                ao_val,
                shadow_val
            )

            chunk_color[hit_indices] = hit_color

        final_color[chunk_start:chunk_end] = chunk_color

        pct = chunk_end / total_pixels * 100
        print(f"    Chunk {chunk_start//chunk_size + 1}: {pct:.0f}% complete")

    # Reshape to image
    image = final_color.reshape(height, width, 3)

    # Gamma correction
    image = image.pow(1.0 / 2.2)
    image = image.clamp(0.0, 1.0)

    elapsed = time.time() - t_start
    print(f"  Render complete in {elapsed:.2f}s")

    return image, elapsed


# ─── Save Image ──────────────────────────────────────────────────────────────

def save_image(tensor, path):
    """Save a (H, W, 3) float tensor as PNG."""
    from PIL import Image

    arr = (tensor.cpu().numpy() * 255).astype(np.uint8)
    img = Image.fromarray(arr)
    img.save(path, 'PNG')
    size_mb = os.path.getsize(path) / (1024 * 1024)
    print(f"  Saved: {path} ({size_mb:.1f} MB)")


# ─── Camera Configurations ──────────────────────────────────────────────────

CAMERAS = [
    {
        "name": "Classic Front View",
        "file": "mandelbulb_00.png",
        "eye": [0.0, 0.0, 3.5],
        "target": [0.0, 0.0, 0.0],
        "fov": 50.0,
        "desc": "The iconic Mandelbulb from the front, power 8",
    },
    {
        "name": "Aerial Overview",
        "file": "mandelbulb_01.png",
        "eye": [1.5, 3.0, 2.0],
        "target": [0.0, 0.0, 0.0],
        "fov": 55.0,
        "desc": "Top-down perspective revealing the bulb's symmetry",
    },
    {
        "name": "Surface Detail",
        "file": "mandelbulb_02.png",
        "eye": [0.8, 0.3, 1.4],
        "target": [0.0, 0.2, 0.0],
        "fov": 40.0,
        "desc": "Close-up of the intricate surface detail",
    },
    {
        "name": "Dramatic Low Angle",
        "file": "mandelbulb_03.png",
        "eye": [-2.0, -1.0, 2.5],
        "target": [0.0, 0.3, 0.0],
        "fov": 50.0,
        "desc": "Looking up at the Mandelbulb from below",
    },
    {
        "name": "Side Profile",
        "file": "mandelbulb_04.png",
        "eye": [3.2, 0.5, 0.3],
        "target": [0.0, 0.0, 0.0],
        "fov": 45.0,
        "desc": "Side profile showing depth and layering",
    },
    {
        "name": "Macro Crevice",
        "file": "mandelbulb_05.png",
        "eye": [0.4, 0.9, 0.8],
        "target": [0.0, 0.5, 0.0],
        "fov": 35.0,
        "desc": "Deep into the fractal crevices at the top",
    },
]


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("  3D Mandelbulb Fractal Renderer")
    print(f"  Device: {torch.cuda.get_device_name(0)}")
    print(f"  Resolution: {WIDTH}x{HEIGHT}")
    print(f"  Power: {POWER}, Iterations: {MAX_ITER}")
    print(f"  Max ray steps: {MAX_STEPS}")
    print("=" * 70)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total_start = time.time()
    timings = []

    for i, cam in enumerate(CAMERAS):
        print(f"\n[{i+1}/{len(CAMERAS)}] Rendering: {cam['name']}")
        print(f"  Eye: {cam['eye']}, Target: {cam['target']}, FOV: {cam['fov']}")

        image, elapsed = render_scene(
            eye=cam['eye'],
            target=cam['target'],
            fov=cam['fov'],
        )

        path = os.path.join(OUTPUT_DIR, cam['file'])
        save_image(image, path)
        timings.append(elapsed)

        # Free GPU memory between renders
        del image
        torch.cuda.empty_cache()

    total_elapsed = time.time() - total_start

    print("\n" + "=" * 70)
    print("  Render Summary")
    print("=" * 70)
    for cam, t in zip(CAMERAS, timings):
        print(f"  {cam['name']:25s} {t:7.2f}s")
    print(f"  {'TOTAL':25s} {total_elapsed:7.2f}s")
    print(f"\n  Images saved to: {OUTPUT_DIR}")
    print("=" * 70)


if __name__ == "__main__":
    main()
