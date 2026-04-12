---
name: Hermes Studio Architectural Analysis
description: Deep-dive analysis of JPeetz/Hermes-Studio for MERIDIAN dashboard upgrade project
type: reference
created: 2026-04-11
updated: 2026-04-11
source: https://github.com/JPeetz/Hermes-Studio
version: 1.5.0
---

# Hermes Studio -- Architectural Analysis for MERIDIAN Dashboard Upgrade

## Executive Summary

Hermes Studio is a 319-file React 19 workspace UI built on TanStack Start/Router + Vite 7 + Tailwind CSS 4, designed as a full-featured browser-based control plane for the Hermes Agent (NousResearch). It provides real-time SSE chat streaming, session persistence (Redis + file fallback), a 9-theme CSS variable system, cron job management, execution approval workflows, memory/skills browsing, a Monaco code editor, xterm.js terminal, and mobile-first PWA support. The codebase is MIT-licensed and well-organized, making it an excellent reference for upgrading MERIDIAN's dashboard from its current FastAPI + vanilla-JS stack. The most valuable patterns to adopt are: the CSS variable theming system, the SSE streaming architecture, the dashboard GlassCard/MetricTile component library, the gateway capability probing system, the command palette, and the WebAudio notification system. Wholesale porting is not feasible due to the React/TanStack dependency; a selective pattern-steal approach is recommended.

---

## Tech Stack Breakdown

| Layer              | Technology                          | Version   | Notes                                     |
|--------------------|-------------------------------------|-----------|-------------------------------------------|
| **Framework**      | TanStack Start (React 19 + SSR)     | 1.132.0   | File-based routing, server functions       |
| **Routing**        | TanStack Router                     | 1.132.0   | Type-safe, file-based routes               |
| **Build**          | Vite                                | 7.1.7     | HMR, proxy config, custom plugins          |
| **Styling**        | Tailwind CSS                        | 4.1.18    | CSS variables for theming                  |
| **State**          | Zustand                             | 5.0.11    | Persisted to localStorage                  |
| **Data Fetching**  | TanStack React Query                | 5.84.1    | Cache, polling, stale-while-revalidate     |
| **Terminal**       | xterm.js                            | 5.3.0     | + fit, search, web-links addons            |
| **Editor**         | Monaco Editor (React)               | 4.7.0     | Full code editing                          |
| **Markdown**       | react-markdown + remark-gfm + Shiki | latest    | GFM + syntax highlighting                  |
| **Charts**         | Recharts                            | 3.7.0     | AreaChart on dashboard                     |
| **Animation**      | Motion (Framer Motion)              | 12.29.2   | Page transitions, UI polish                |
| **Validation**     | Zod                                 | 3.25.76   | Auth endpoints                             |
| **Icons**          | Hugeicons + Lobehub Icons           | latest    | Provider logos, UI icons                   |
| **Tour**           | react-joyride                       | 2.9.3     | Onboarding walkthrough                     |
| **WebSocket**      | ws                                  | 8.19.0    | WebSocket proxy for Hermes gateway         |
| **Config**         | YAML parser                         | 2.8.2     | Hermes config read/write                   |
| **Database**       | better-sqlite3                      | 12.8.0    | Workspace daemon persistence               |
| **Cache**          | ioredis                             | 5.10.1    | Session persistence (optional)             |
| **Testing**        | Vitest + Testing Library            | 3.0.5     | Unit tests                                 |

---

## Feature Inventory (Grouped by Category)

### A. Chat & Communication
1. Real-time SSE streaming with tool call rendering (`src/routes/api/send-stream.ts`)
2. Multi-session management: create, rename, delete, fork, pin
3. Dual chat backend: Enhanced Hermes gateway OR portable OpenAI-compatible
4. Slash command menu (`/new`, `/clear`, `/model`, `/save`, `/skills`, `/skin`, `/help`)
5. File attachment support (images via base64, multimodal)
6. Voice input (Web Speech API) (`src/hooks/use-voice-input.ts`)
7. Markdown + GFM + syntax highlighting via Shiki
8. Tool call pill rendering with expandable details
9. Thinking/reasoning content display (DeepSeek, QwQ)
10. Context meter showing token usage percentage
11. Auto-generated session titles
12. Export conversations as Markdown/JSON/Text

### B. Dashboard & Monitoring
13. GlassCard component library with accent color top-bar (`src/screens/dashboard/dashboard-screen.tsx:36`)
14. MetricTile with label/value/sub/icon layout (`dashboard-screen.tsx:158`)
15. ActivityChart -- 14-day Recharts AreaChart with dual Y-axis (`dashboard-screen.tsx:196`)
16. SystemGlance status bar: sessions, model, latency, tokens, cost (`dashboard-screen.tsx:116`)
17. ModelCard with online/offline status indicator (`dashboard-screen.tsx:328`)
18. SkillsWidget showing installed skills count (`dashboard-screen.tsx:422`)
19. QuickAction navigation buttons (`dashboard-screen.tsx:476`)
20. SessionRow with token usage progress bars (`dashboard-screen.tsx:533`)

### C. Usage & Cost Tracking
21. UsageMeter with 4 switchable views: Session/Provider/Cost/Agents (`src/components/usage-meter/usage-meter.tsx`)
22. Model pricing database (GPT-4o, Claude, etc.) (`usage-meter.tsx:74`)
23. Context alert system with threshold warnings (50%, 75%, 90%)
24. Provider usage polling with preferred-provider persistence
25. Cost estimation from token counts

### D. Memory & Knowledge
26. Memory file browser with MEMORY.md-first sorting
27. Memory search across entries (max 200 matches)
28. Memory editor with live Markdown preview
29. Memory read/write API (`src/routes/api/memory/`)

### E. Skills Management
30. Browse 2,000+ skills from registry
31. Install/uninstall/toggle skills from browser
32. Skill categories with search and filter
33. Security risk display (safe/low/medium/high)
34. Featured skills curation

### F. Execution & Control
35. Execution approval cards with 3 scopes: Once/Session/Always (`src/screens/chat/components/approval-card.tsx`)
36. Cron job manager: create, edit, pause, resume, trigger, monitor
37. Delivery channels: Telegram, Discord, Slack, Signal
38. Terminal with full PTY via Python helper + xterm.js
39. File browser with Monaco editor integration

### G. Theming & UI
40. 9-theme system via CSS variables (`src/lib/theme.ts`, `src/styles.css`)
41. Theme stored in `data-theme` attribute on `<html>`
42. CSS variable tokens: `--theme-bg`, `--theme-sidebar`, `--theme-card`, `--theme-accent`, etc.
43. KPI card utility classes (`.kpi-card`, `.kpi-card-label`, `.kpi-card-value`, `.kpi-card-trend`)
44. Light/dark variant mapping per theme
45. AgentStatusStrip telemetry bar for "Hermes OS" theme (`src/components/agent-status-strip.tsx`)

### H. Navigation & UX
46. Command palette (`Cmd+K`) with fuzzy search (`src/components/command-palette.tsx`)
47. Mobile tab bar with 8 sections
48. Swipe navigation on mobile
49. Onboarding wizard + guided tour (react-joyride)
50. Keyboard shortcuts modal
51. WebAudio notification sounds (7 distinct events) (`src/lib/sounds.ts`)
52. Haptic feedback on mobile (`navigator.vibrate(8)`)
53. Connection startup screen with auto-start + manual setup guide

### I. Security
54. Auth middleware on all API routes
55. Rate limiting (sliding window, per-endpoint)
56. Path traversal prevention
57. CSRF protection via Content-Type requirement
58. Timing-safe password comparison

### J. Infrastructure
59. Gateway capability probing with TTL cache (`src/server/gateway-capabilities.ts`)
60. Three chat modes: enhanced-hermes / portable / disconnected
61. Redis session persistence with file fallback (`src/server/local-session-store.ts`)
62. Workspace daemon with exponential backoff restart
63. Docker Compose deployment

---

## Architecture Diagram (ASCII)

```
+-----------------------------------------------------------------------+
|  Browser (React 19 + TanStack Router)                                  |
|                                                                        |
|  +-----------+  +----------+  +-------+  +--------+  +------+         |
|  | ChatScreen|  | Dashboard|  | Files |  |Terminal |  | Jobs |  ...    |
|  +-----------+  +----------+  +-------+  +--------+  +------+         |
|       |              |            |           |           |             |
|  +----+----+    +----+----+      |      +----+----+      |             |
|  |Zustand  |    |React    |      |      |xterm.js |      |             |
|  |Store    |    |Query    |      |      |         |      |             |
|  +---------+    +---------+      |      +---------+      |             |
+----------|------------|----------|-----------|-----------|-------------+
           |            |          |           |           |
    SSE /api/send-stream  REST /api/*   SSE /api/terminal-stream
           |            |          |           |           |
+----------|------------|----------|-----------|-----------|-------------+
|  Vite Dev Server / TanStack Start (Node.js SSR)                        |
|                                                                        |
|  +---------------------+  +------------------+  +------------------+   |
|  | gateway-capabilities|  | chat-event-bus   |  | local-session-   |   |
|  | (probe + cache)     |  | (pub/sub + store)|  | store (Redis/FS) |   |
|  +---------------------+  +------------------+  +------------------+   |
|                                                                        |
|  +------------------+  +------------------+  +------------------+      |
|  | auth-middleware   |  | rate-limit       |  | terminal-sessions|      |
|  +------------------+  +------------------+  +------------------+      |
+----------|------------|--------------------------------------------------+
           |            |
    Proxy /api/hermes-proxy/*          WebSocket /ws-hermes
           |            |
+----------|------------|--------------------------------------------------+
|  Hermes Agent Gateway (Python FastAPI, port 8642)                         |
|  /api/sessions, /api/skills, /api/memory, /api/config, /api/jobs          |
|  /v1/chat/completions, /v1/models                                         |
+--------------------------------------------------------------------------+
```

---

## Top 10 Features to Adopt (Ranked by Value for MERIDIAN)

### 1. CSS Variable Theming System (Value: Critical)
**Files:** `src/styles.css:41-99` (theme utility classes), `src/lib/theme.ts` (theme registry + persistence)
**What:** All colors flow through `--theme-bg`, `--theme-card`, `--theme-accent`, `--theme-border`, etc. Themes are toggled by setting `data-theme` attribute on `<html>`. Each theme defines 15+ CSS variables. Utility classes like `.theme-bg`, `.kpi-card` consume them.
**Why adopt:** MERIDIAN's current inline colors are not themeable. This pattern requires zero JS framework -- pure CSS variables + a `data-theme` attribute. Portable to vanilla JS.
**Adoption effort:** Low. Extract the CSS variable definitions and `.kpi-card` / `.theme-*` classes into MERIDIAN's stylesheet. Write a `setTheme()` function in vanilla JS.

### 2. Dashboard GlassCard / MetricTile Component Pattern (Value: Critical)
**Files:** `src/screens/dashboard/dashboard-screen.tsx:36-84` (GlassCard), `158-192` (MetricTile), `533-582` (SessionRow)
**What:** Reusable card components with accent-color top-bar gradients, optional title + titleRight slots, and consistent spacing. MetricTile shows label/value/sub/icon. SessionRow has a token-usage progress bar.
**Why adopt:** MERIDIAN's dashboard currently has ad-hoc card styling. These patterns are clean, reusable, and work with the CSS variable system above.
**Adoption effort:** Low-Medium. Rewrite as vanilla JS template functions or web components.

### 3. SSE Streaming Architecture (Value: High)
**Files:** `src/routes/api/send-stream.ts` (full SSE implementation), `src/server/chat-event-bus.ts` (pub/sub)
**What:** Server creates a `ReadableStream`, sends typed events (`chunk`, `tool`, `thinking`, `done`, `error`, `approval`). Client listens via `EventSource`. Run lifecycle management prevents duplicates. Tool calls rendered as expandable pills.
**Why adopt:** MERIDIAN already has basic SSE. Hermes's event vocabulary (`chunk`, `tool`, `thinking`, `done`, `approval`) is richer and would support tool-call visualization and approval workflows.
**Adoption effort:** Medium. The event schema is portable; the server-side ReadableStream pattern maps to FastAPI's `StreamingResponse`.

### 4. Gateway Capability Probing (Value: High)
**Files:** `src/server/gateway-capabilities.ts` (full implementation)
**What:** On startup, probes 9 endpoints in parallel to detect what the backend supports. Caches results with 120s TTL. Three-mode chat system: enhanced / portable / disconnected. Feature gates degrade gracefully.
**Why adopt:** MERIDIAN talks to multiple backends (Claude, GPU servers). A capability probe system would let the dashboard adapt to what's available without hardcoding.
**Adoption effort:** Low. Pure logic, no framework dependency. Port to Python easily.

### 5. Command Palette (Cmd+K) (Value: High)
**Files:** `src/components/command-palette.tsx` (full implementation with fuzzy scoring)
**What:** Global keyboard shortcut opens a searchable command palette. Groups: Screens, Recent Sessions, Slash Commands. Fuzzy scoring with substring + subsequence matching. Arrow key navigation, Enter to select.
**Why adopt:** MERIDIAN has no quick-navigation system. A command palette would let Alton jump between dashboard sections, trigger agent actions, and search sessions instantly.
**Adoption effort:** Medium. The fuzzy scoring algorithm (`scoreCommandAction` at line 76) is framework-agnostic. Build the overlay in vanilla JS.

### 6. WebAudio Sound Notification System (Value: Medium-High)
**Files:** `src/lib/sounds.ts` (full implementation)
**What:** 7 synthesized sounds using Web Audio API -- no audio files needed. Events: agentSpawned, agentComplete, agentFailed, chatNotification, chatComplete, alert, thinking. Each uses specific note frequencies and waveforms. Volume control + enable/disable.
**Why adopt:** MERIDIAN currently has no audio feedback. For a household agent dashboard, sound cues for "agent done", "approval needed", "error" are high-value -- especially when the tab is in the background.
**Adoption effort:** Very Low. The file is 305 lines of pure JS with zero dependencies. Copy and adapt.

### 7. Usage Meter with Multi-View Toggle (Value: Medium-High)
**Files:** `src/components/usage-meter/usage-meter.tsx` (891 lines)
**What:** Compact pill in the header shows live stats. Toggleable between 4 views: Session Stats, Provider Usage, Cost Breakdown, Agent Activity. Polls `/api/session-status` every 10s. Model pricing database for cost estimation. Context alert modals at 50/75/90% thresholds.
**Why adopt:** MERIDIAN tracks GPU costs and agent token usage across multiple entities. A compact, multi-view usage meter in the dashboard header would surface critical cost data without taking up screen space.
**Adoption effort:** Medium. The pricing database and formatting functions are portable. The poll + view-toggle pattern works in vanilla JS.

### 8. Approval Card UI Pattern (Value: Medium)
**Files:** `src/screens/chat/components/approval-card.tsx` (121 lines)
**What:** Card with 3 approval scopes (Once / This Session / Always Allow) + Deny. Expandable context section. Resolved receipt shows inline after decision. Clean amber/emerald/red color coding.
**Why adopt:** MERIDIAN's agent network will need approval workflows for destructive actions. This card pattern is clean and well-tested.
**Adoption effort:** Low. Pure UI pattern, easy to reimplement in any framework.

### 9. Connection Startup Screen with Auto-Detection (Value: Medium)
**Files:** `src/components/connection-startup-screen.tsx` (348 lines)
**What:** Full-screen overlay shown on startup. Polls backend every 2s. After 5s of failure, reveals manual setup guide. Auto-Start button attempts to spawn the backend. Platform-aware commands (Windows/macOS/Linux).
**Why adopt:** MERIDIAN starts multiple services. A connection startup screen that shows which services are up/down and auto-detects readiness would improve the first-run experience.
**Adoption effort:** Low-Medium. The polling pattern and progressive reveal are framework-agnostic.

### 10. Agent Status Strip (Telemetry Bar) (Value: Medium)
**Files:** `src/components/agent-status-strip.tsx` (123 lines)
**What:** Thin bar at the top showing: brand mark, active session, current model, connection status pip. Polls `/api/connection-status` every 20s. Only visible in the "Hermes OS" theme (CSS-controlled).
**Why adopt:** MERIDIAN could show: active agents, current costs, connection status to GPU servers, memory usage. A persistent telemetry bar is ideal for at-a-glance monitoring.
**Adoption effort:** Very Low. Simple polling + DOM update.

---

## Irrelevant Features to Skip

1. **Hermes Gateway integration specifics** -- All the Hermes-specific API proxying (`/api/hermes-proxy`, `/api/hermes-jobs`, session management via the Hermes gateway). MERIDIAN talks to Claude API and custom backends, not the NousResearch Hermes gateway.

2. **Skill marketplace / installation** -- The 2,000+ skill browsing from `skillsmp.com` is specific to the Hermes agent ecosystem. MERIDIAN has its own skill/tool system.

3. **OAuth device code flow** -- The Nous Portal OAuth integration is irrelevant.

4. **Provider catalog for LLM providers** -- MERIDIAN doesn't need multi-provider selection UI (Ollama, OpenRouter, MiniMax, etc.). It uses Claude via Anthropic API exclusively.

5. **Workspace daemon / hermes-agent auto-start** -- The child process management for spawning Python backends is specific to the Hermes architecture.

6. **Mobile PWA / Tailscale setup** -- While mobile support is nice, MERIDIAN's primary use case is desktop dashboard. The PWA install instructions and Tailscale guides are not priorities.

7. **Docker Compose orchestration** -- MERIDIAN has its own deployment story.

8. **react-joyride onboarding tour** -- Adds 50KB+ for a feature Alton doesn't need.

9. **Monaco Editor integration** -- Over-engineered for MERIDIAN's needs. A simple textarea or CodeMirror lite would suffice if needed.

---

## Integration Challenges

### 1. React vs. Vanilla JS Impedance Mismatch
Hermes Studio is built entirely in React 19 with hooks, JSX, and component composition. MERIDIAN uses FastAPI + vanilla JavaScript with Jinja2 templates. Every React component must be mentally decomposed into:
- HTML template (the JSX return)
- State management (useState/useRef -> vanilla JS variables)
- Side effects (useEffect -> event listeners / setInterval)
- Data fetching (React Query -> fetch + polling)

### 2. Tailwind CSS Classes
Hermes uses Tailwind CSS 4 extensively. MERIDIAN would need to either:
- (a) Add Tailwind to the build pipeline, or
- (b) Extract the actual CSS values from Tailwind classes and write equivalent CSS

Option (b) is recommended -- extract only the patterns we need rather than adding a build dependency.

### 3. Zustand State Management
The `workspace-store.ts` and `chat-store.ts` use Zustand with localStorage persistence. In vanilla JS, this maps to a simple pub/sub store pattern with `localStorage.setItem/getItem`.

### 4. TanStack Router File-Based Routing
The file-based API routes (`src/routes/api/*.ts`) are server-side TanStack Start handlers. In MERIDIAN, these map to FastAPI route functions -- the logic inside is often portable, but the routing layer is not.

### 5. SSR Considerations
TanStack Start does server-side rendering. MERIDIAN is a single-page application served by FastAPI. This is actually simpler -- no SSR hydration to worry about.

---

## Recommended Adoption Strategy: Selective Pattern Steal

**NOT recommended:** Wholesale port (too much React dependency), full rewrite (too much scope).

**Recommended:** Cherry-pick the 10 features above in this order:

### Phase 1: Foundation (1-2 days)
1. **CSS Variable Theming** -- Extract theme definitions from `styles.css`. Add `data-theme` support to MERIDIAN's base template. Define 2 themes: dark (default) + light.
2. **GlassCard/MetricTile** -- Create vanilla JS template functions. Wire up to existing MERIDIAN data.
3. **KPI Card CSS** -- Copy `.kpi-card` classes directly.

### Phase 2: Infrastructure (2-3 days)
4. **Gateway Capability Probing** -- Implement in Python as a FastAPI startup task. Probe Claude API, GPU servers, memory store.
5. **SSE Event Vocabulary** -- Extend MERIDIAN's existing SSE with the `chunk/tool/thinking/done/error/approval` event schema.
6. **Sound Notifications** -- Copy `sounds.ts` verbatim. Wire to SSE events.

### Phase 3: Polish (2-3 days)
7. **Command Palette** -- Build a vanilla JS overlay with the fuzzy scoring algorithm.
8. **Usage Meter** -- Implement the compact pill with multi-view toggle.
9. **Status Strip** -- Add a persistent telemetry bar.
10. **Approval Card** -- Implement if/when approval workflows are needed.

### Total estimated scope: 5-8 days of focused work.

---

## Key File Reference Index

| Pattern                      | File                                                  | Lines     |
|------------------------------|-------------------------------------------------------|-----------|
| Theme registry               | `src/lib/theme.ts`                                    | 1-144     |
| Theme CSS variables          | `src/styles.css`                                      | 41-150    |
| GlassCard component          | `src/screens/dashboard/dashboard-screen.tsx`           | 36-84     |
| MetricTile component         | `src/screens/dashboard/dashboard-screen.tsx`           | 158-192   |
| Activity chart               | `src/screens/dashboard/dashboard-screen.tsx`           | 196-324   |
| Quick actions                | `src/screens/dashboard/dashboard-screen.tsx`           | 476-529   |
| Session row + progress bar   | `src/screens/dashboard/dashboard-screen.tsx`           | 533-582   |
| Full dashboard layout        | `src/screens/dashboard/dashboard-screen.tsx`           | 586-784   |
| SSE streaming                | `src/routes/api/send-stream.ts`                       | 267-894   |
| Chat event bus               | `src/server/chat-event-bus.ts`                        | 1-99      |
| Gateway probing              | `src/server/gateway-capabilities.ts`                  | 1-327     |
| Command palette              | `src/components/command-palette.tsx`                   | 1-519     |
| Fuzzy scoring algorithm      | `src/components/command-palette.tsx`                   | 76-104    |
| Sound notifications          | `src/lib/sounds.ts`                                   | 1-305     |
| Usage meter                  | `src/components/usage-meter/usage-meter.tsx`           | 1-891     |
| Model pricing database       | `src/components/usage-meter/usage-meter.tsx`           | 74-86     |
| Approval card                | `src/screens/chat/components/approval-card.tsx`        | 1-121     |
| Status strip                 | `src/components/agent-status-strip.tsx`                | 1-123     |
| Startup screen               | `src/components/connection-startup-screen.tsx`         | 1-348     |
| Workspace store (Zustand)    | `src/stores/workspace-store.ts`                       | 1-76      |
| Workspace shell layout       | `src/components/workspace-shell.tsx`                   | 1-416     |
| Local session store          | `src/server/local-session-store.ts`                   | full      |
| Auth middleware               | `src/server/auth-middleware.ts`                       | full      |
| Rate limiter                 | `src/server/rate-limit.ts`                            | full      |

---

*Analysis performed on Hermes Studio v1.5.0, cloned 2026-04-11 from https://github.com/JPeetz/Hermes-Studio*
