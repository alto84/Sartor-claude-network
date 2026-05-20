# Vast.ai Support Ticket — DRAFT for Alton to send in morning

**Why this exists:** Machine 97429 (rtxserver) has a frozen `error_description` field that
filters the machine out of renter-side marketplace search. Tested exhaustively overnight
2026-05-19 → 05-20; the underlying docker pipeline is verifiably working but vast.ai's
server-side machine record has stale state from an earlier failed attempt. No CLI verb
clears this. Manual intervention from support is required.

**Where to send:** Use the vast.ai "Contact Support" form on cloud.vast.ai, or email
support directly. Saber was the support engineer on the 2026-04-22 incident — useful
to reference if reaching them by name.

---

## Subject

Machine 97429 has stale error_description blocking marketplace visibility despite verified self-tests

## Body

Hi vast.ai support,

I'm the host of machine 97429 (rtxpro6000server, 2× RTX PRO 6000 Blackwell Workstation, public IP 100.1.100.63, Solar Inference LLC account, alto84@gmail.com). Listing is at $1.20/GPU/hr × 2 = $2.40/hr dual-rental, end_date 2026-08-16, listed_min_gpu_count=2.

**Issue:** The machine is verified and listed in my host-side `vastai show machines` output, but is completely absent from renter-side `vastai search offers` results. Direct `vastai search offers machine_id=97429` also returns zero results. Other renters cannot see or rent the machine.

**Root cause I've identified:** The `error_description` field on my machine record is set to:

```
Error response from daemon: --storage-opt is supported only for overlay over xfs with "pquota" mount option
```

This was set during an earlier verification attempt before the filesystem was correctly mounted. The filesystem has since been fixed and confirmed working. Specifically:

- `/var/lib/docker` is on `/dev/nvme0n1p1`, type `xfs`, mount options include `prjquota` (the modern XFS naming for what Docker's error message calls "pquota").
- `Storage Driver: overlay2`, `Backing Filesystem: xfs`, `Native Overlay Diff: true`, project quota Accounting + Enforcement both ON per `xfs_quota -x -c state`.
- Manual test confirms: `docker run --rm --storage-opt size=10G ubuntu:24.04 df -h /` runs cleanly, container gets a 10G overlay filesystem as expected.

**Repro that the docker pipeline works through vast.ai:** I've run `vastai self-test machine 97429` twice in the last 6 hours (the second time tonight via instance 37114618). Both passes completed every sub-test successfully:

- System requirements ✓
- ResNet18 on both GPUs ✓
- ECC ✓
- NCCL distributed test (2-GPU) ✓
- stress-ng + gpu-burn 60s simultaneous ✓
- Instance destroyed successfully on attempt 1 ✓

**Recovery actions that did NOT clear the field:**
- `vastai unlist machine 97429` followed by `vastai list machine 97429 ...` (full unlist+relist cycle)
- `sudo systemctl restart vastai.service` (kaalia daemon restart)
- Full machine cold-boot (we had a fuse blow tonight; rtxserver came up fresh; error persisted)
- Manual cleanup of a stuck NOC-launched verification container (`vastai destroy instance 37112441`) followed by a fresh successful `vastai self-test machine 97429`

**Request:** Could you please manually clear the `error_description` field on machine 97429, or trigger a re-evaluation of the machine state from your end? The underlying docker provisioning is now functional, the verification self-test passes, and the machine is ready to rent.

Happy to provide any additional information or diagnostics.

Thanks,
Alton Sartor
Solar Inference LLC
alto84@gmail.com

---

## Optional follow-up data (paste if asked)

- `vastai show machines --raw` for machine 97429 confirms `listed: True`, `verification: verified`, `listed_gpu_cost: 1.2`, `listed_min_gpu_count: 2`, `reliability2: ~0.967`, and the stuck `error_description`.
- `vastai search offers machine_id=97429` returns `[]` (empty).
- `kaalia.log` since reboot 2026-05-20 03:10 UTC shows clean sysinfo / heartbeat / container poll cycles — no docker-storage-opt errors from kaalia's side.
- Self-test instance IDs run tonight: 37112121 (succeeded earlier), 37112441 (NOC auto-launched on machine return; tests passed but NOC failed to destroy — we manually destroyed), 37114618 (manually triggered after cleanup; succeeded fully including clean destroy).
