"""
GPU-Accelerated Fractal Art Generator using PyTorch + RTX 5090
Generates Julia set fractals with beautiful color palettes and saves as images.
"""

import torch
import numpy as np
import base64
import io
import json
import sys
import time

def julia_set_gpu(width=1920, height=1080, c_real=-0.7269, c_imag=0.1889,
                  x_min=-1.5, x_max=1.5, y_min=-1.0, y_max=1.0,
                  max_iter=500, device='cuda'):
    """Generate a Julia set fractal on GPU."""
    t0 = time.time()

    # Create coordinate grids on GPU
    x = torch.linspace(x_min, x_max, width, device=device)
    y = torch.linspace(y_min, y_max, height, device=device)
    Y, X = torch.meshgrid(y, x, indexing='ij')

    # Complex plane
    Z = torch.complex(X, Y)
    C = torch.complex(
        torch.tensor(c_real, device=device),
        torch.tensor(c_imag, device=device)
    )

    # Iteration count
    iteration = torch.zeros(height, width, device=device, dtype=torch.float32)
    mask = torch.ones(height, width, device=device, dtype=torch.bool)

    for i in range(max_iter):
        Z[mask] = Z[mask] * Z[mask] + C
        escaped = torch.abs(Z) > 4.0
        new_escaped = escaped & mask
        iteration[new_escaped] = i
        mask = mask & ~escaped

    # Smooth coloring
    iteration[mask] = max_iter
    iteration = iteration / max_iter

    elapsed = time.time() - t0
    print(f"Fractal computed in {elapsed:.3f}s on {device}")
    return iteration


def colorize_fractal(iteration, palette='cosmic'):
    """Apply beautiful color palette to fractal data."""
    h, w = iteration.shape

    if palette == 'cosmic':
        # Deep space colors: black -> purple -> blue -> cyan -> gold
        r = torch.sin(iteration * 3.14159 * 2.0 + 0.0) * 0.5 + 0.5
        g = torch.sin(iteration * 3.14159 * 2.0 + 2.094) * 0.5 + 0.5
        b = torch.sin(iteration * 3.14159 * 2.0 + 4.189) * 0.5 + 0.5
        # Darken the set itself
        in_set = iteration >= 0.99
        r[in_set] = 0.0
        g[in_set] = 0.0
        b[in_set] = 0.0
    elif palette == 'fire':
        r = torch.clamp(iteration * 3.0, 0, 1)
        g = torch.clamp(iteration * 3.0 - 1.0, 0, 1)
        b = torch.clamp(iteration * 3.0 - 2.0, 0, 1)
        in_set = iteration >= 0.99
        r[in_set] = 0.0
        g[in_set] = 0.0
        b[in_set] = 0.0
    elif palette == 'ocean':
        r = torch.sin(iteration * 5.0) * 0.3
        g = torch.sin(iteration * 7.0 + 1.0) * 0.5 + 0.3
        b = torch.sin(iteration * 3.0 + 2.0) * 0.5 + 0.5
        in_set = iteration >= 0.99
        r[in_set] = 0.02
        g[in_set] = 0.02
        b[in_set] = 0.05

    # Stack to RGB image (H, W, 3)
    img = torch.stack([r, g, b], dim=-1)
    img = torch.clamp(img, 0, 1)
    return img


def save_image(img_tensor, path):
    """Save GPU tensor as PNG image."""
    try:
        from PIL import Image
    except ImportError:
        # Fallback: save as raw PPM
        img_np = (img_tensor.cpu().numpy() * 255).astype(np.uint8)
        h, w, _ = img_np.shape
        with open(path.replace('.png', '.ppm'), 'wb') as f:
            f.write(f'P6\n{w} {h}\n255\n'.encode())
            f.write(img_np.tobytes())
        print(f"Saved as PPM (PIL not available): {path.replace('.png', '.ppm')}")
        return

    img_np = (img_tensor.cpu().numpy() * 255).astype(np.uint8)
    Image.fromarray(img_np).save(path)
    print(f"Saved: {path}")


def generate_gallery():
    """Generate a gallery of fractal art."""
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")

    # Interesting Julia set parameters
    presets = [
        {"name": "Seahorse Valley", "c_real": -0.75, "c_imag": 0.11, "palette": "cosmic",
         "x_min": -1.5, "x_max": 1.5, "y_min": -1.0, "y_max": 1.0},
        {"name": "Dragon Spiral", "c_real": -0.8, "c_imag": 0.156, "palette": "fire",
         "x_min": -1.5, "x_max": 1.5, "y_min": -1.0, "y_max": 1.0},
        {"name": "Lightning", "c_real": -0.7269, "c_imag": 0.1889, "palette": "ocean",
         "x_min": -1.5, "x_max": 1.5, "y_min": -1.0, "y_max": 1.0},
        {"name": "Dendrite", "c_real": 0.285, "c_imag": 0.01, "palette": "cosmic",
         "x_min": -1.5, "x_max": 1.5, "y_min": -1.0, "y_max": 1.0},
        {"name": "Galaxy Arm", "c_real": -0.4, "c_imag": 0.6, "palette": "ocean",
         "x_min": -1.8, "x_max": 1.8, "y_min": -1.2, "y_max": 1.2},
    ]

    output_dir = "/home/alton/Sartor-claude-network/dashboard/static/fun/fractals"
    import os
    os.makedirs(output_dir, exist_ok=True)

    manifest = []
    for i, preset in enumerate(presets):
        print(f"\nGenerating: {preset['name']}...")
        iteration = julia_set_gpu(
            width=1920, height=1080,
            c_real=preset['c_real'], c_imag=preset['c_imag'],
            x_min=preset.get('x_min', -1.5), x_max=preset.get('x_max', 1.5),
            y_min=preset.get('y_min', -1.0), y_max=preset.get('y_max', 1.0),
            max_iter=500, device=device
        )
        img = colorize_fractal(iteration, palette=preset['palette'])
        filename = f"fractal_{i:02d}.png"
        save_image(img, os.path.join(output_dir, filename))
        manifest.append({
            "name": preset['name'],
            "file": filename,
            "c": f"{preset['c_real']} + {preset['c_imag']}i",
            "palette": preset['palette'],
        })

    # Save manifest
    with open(os.path.join(output_dir, "manifest.json"), 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"\nGenerated {len(manifest)} fractals in {output_dir}")

    # Clean up GPU memory
    if device == 'cuda':
        torch.cuda.empty_cache()


if __name__ == '__main__':
    generate_gallery()
