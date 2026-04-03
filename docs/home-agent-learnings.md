# Learnings Log
## Last Updated: 2026-03-31

Hard-won lessons from building and operating this system. Each entry documents the lesson and the context that produced it.

---

## Format

Each entry: lesson, context/source, date learned.

---

## Infrastructure

**Markdown over databases — keep it simple**
- Context: Every database-backed system adds maintenance burden and failure modes. Markdown files with git sync are durable, portable, and debuggable.
- Date: 2026-03-31

**Git push only from Rocinante (has credentials)**
- Context: gpuserver1 does not have GitHub SSH keys configured. Attempting git push from gpuserver1 will fail silently or with auth errors. Always push from Rocinante.
- Date: 2026-03-31

**gpuserver1 SSH key not on GitHub**
- Context: gpuserver1 can pull from public repos but cannot push. Adding its key to GitHub is a deliberate choice not yet made. Until then, all git operations requiring push must route through Rocinante.
- Date: 2026-03-31

**Chrome default profile blocks CDP**
- Context: Chrome's default profile has protections that prevent remote debugging connections. Use a dedicated automation profile (C:\Users\alto8\chrome-automation-profile\) with CDP port 9223 for reliable automation.
- Date: 2026-03-31

**DMZ + UFW pattern: Router DMZ forwards all; server-side UFW filters**
- Context: Fios router DMZ sends all inbound traffic to gpuserver1. Security is enforced by UFW on gpuserver1, not the router. This is the reliable pattern on Fios — router-level port filtering is unreliable.
- Date: 2026-03-31

**UPnP unreliable on Fios router — mappings don't persist**
- Context: UPnP port mappings on the Fios router are cleared on router restart. Do not rely on UPnP. Use static DMZ + UFW.
- Date: 2026-03-31

---

## vast.ai Operations

**vast.ai: payout method must be configured before offers can be created**
- Context: Creating a machine listing on vast.ai silently fails if Stripe payout is not configured. No error is returned. Configured Stripe 2026-02-26; listings started working immediately.
- Date: 2026-03-31

**vast.ai: listing end_date expiry makes machine unlisted**
- Context: If the listing end date passes, the machine becomes "not rentable" on the marketplace without any alert. Must relist with a new end date: `vastai list machine 52271 -g 0.40 -b 0.25 -s 0.10 -m 1 -e "08/24/2026"`
- Date: 2026-03-31

**Hairpin NAT blocks vast.ai self-test from LAN; not Docker or UFW**
- Context: vast.ai self-test connects from external IP back to the machine. On LAN, the Fios router cannot route LAN -> public_IP -> LAN (hairpin NAT not supported). Fix: iptables OUTPUT DNAT rule in /etc/ufw/before.rules. This was mistakenly diagnosed as a Docker or UFW issue first.
- Date: 2026-03-31

**Docker+UFW: need DOCKER-USER chain with conntrack --ctorigdstport for port range**
- Context: Docker rewrites destination ports via NAT. Standard UFW rules that match by destination port miss Docker traffic because the port has been rewritten. Must use DOCKER-USER chain with --ctorigdstport to match on the original destination port before NAT.
- Date: 2026-03-31

---

## Windows / PowerShell

**PowerShell $ variables get mangled inline in Claude Code on Windows**
- Context: When passing PowerShell commands inline (e.g., via -Command), $ variables are interpolated by the shell before PowerShell sees them. Use .ps1 script files with `-ExecutionPolicy Bypass -File path/to/script.ps1` for reliable variable handling.
- Date: 2026-03-31

---

## Agent Systems

**Chrome MCP extension drops connection intermittently on click actions**
- Context: The Claude-in-Chrome MCP extension loses its named pipe connection when click actions trigger page navigation or modal dialogs. Use tabs_context_mcp to reconnect after such actions.
- Date: 2026-03-31

**Fios Router: Vue.js SPA, manipulable via JS (saveDmz(), apply_abstract.cgi)**
- Context: The Fios router admin interface is a Vue.js SPA. DMZ and other settings can be programmatically set by calling JS functions directly (saveDmz()) or POSTing to apply_abstract.cgi. Cert warning in Chrome MCP requires initial manual acknowledgment.
- Date: 2026-03-31

---

## Tax / Legal

**vast.ai listing must be in service before July 4, 2026 for OBBB ITC deadline**
- Context: The One Big Beautiful Bill sets a hard deadline: solar systems must be placed in service before July 4, 2026 to qualify for the 30% federal ITC and 100% bonus depreciation. This deadline drives the solar installation timeline.
- Date: 2026-03-31

**ITC and bonus depreciation interaction: basis reduction applies**
- Context: Cannot take both full ITC (30%) and full bonus depreciation on the same asset without adjustment. Taking the ITC requires reducing the depreciable basis by 50% of the ITC amount. Confirm optimal strategy with CPA.
- Date: 2026-03-31
