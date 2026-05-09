---
type: research
entity: smart-home-integration
updated: 2026-04-12
status: complete
tags: [meridian, google-home, sonos, smart-home, local-api, fastapi]
---

# Smart Home Integration Research for MERIDIAN

## 1. Executive Summary

The fastest path to smart home control from MERIDIAN is a two-track approach: **SoCo (Python) for Sonos** and **pychromecast + gTTS for Google Home speakers**. Both are mature, well-maintained Python libraries that operate entirely over the local network via UPnP/mDNS and the Cast protocol, respectively -- no cloud dependency, no subscription, no Home Assistant required. SoCo gives you play/pause/volume/grouping/TTS/queue in about 20 lines of code. pychromecast gives you Cast media + TTS to any Google Home/Nest speaker. Home Assistant is **not needed** as an intermediary for these two ecosystems; it would add complexity without proportional benefit at this stage. The main implementation risk is network discovery: the initial scan from Rocinante found only 4 devices on the LAN (router, Apple TV "Office", one Google device at 192.168.1.163, and one unknown at 192.168.1.100). Sonos devices were not discovered, suggesting they may be on a separate WiFi network, powered off, or running S1 firmware. A discovery debug session with the devices powered on and the Sonos app open on a phone will resolve this quickly.

## 2. Google Home / Google Nest

### What's Possible

| Approach | Viability | Notes |
|----------|-----------|-------|
| **pychromecast** (Cast protocol) | **Best option** | Mature Python lib (maintained by Home Assistant team). Cast audio/video, TTS via gTTS, get device status. Requires mDNS discovery or known IP. Works with Google Home, Nest Hub, Nest Mini, Chromecast. |
| **googlehomepush** | Good for TTS | Thin wrapper around pychromecast + gTTS. `GoogleHome("Kitchen").say("Dinner's ready")` -- one line. |
| **Google Home local API (port 8443)** | Fragile | Undocumented, reverse-engineered. Requires `cast-local-authorization-token` (rotates daily). Can get device info, alarms, settings, reboot. Not for media control. Google has been progressively locking this down since 2019. |
| **glocaltokens** (Python) | Useful supplement | Fetches local auth tokens for the port-8443 API using Google account credentials. Needed if you want device info beyond what Cast provides. |
| **Google Home APIs (official, 2025)** | Not viable for this use case | Android/iOS SDK only -- no REST API, no Python SDK. Designed for mobile app developers building Google Home companion apps. Requires Google Cloud project + OAuth. Limited to 100 users in beta. Does not expose speaker control endpoints. |
| **Google Assistant SDK** | Deprecated, dying | Google Assistant discontinuation scheduled for March 2026, replaced by Gemini. The SDK is in maintenance-only mode. Gemini has no equivalent programmatic API for smart home control yet. |
| **home.google.com in Chrome** | Not practical | The web UI is limited (device management, not playback control). No documented APIs behind it. Chrome automation would be brittle. |
| **Chrome extensions** | None mature | No extensions expose a programmatic local device control API. |

### Recommended Approach for MERIDIAN

```python
# pip install pychromecast gTTS
import pychromecast
from pychromecast.controllers.media import MediaController

# Discover all Cast devices on the LAN
chromecasts, browser = pychromecast.get_chromecasts()
# Or connect to known IP:
chromecasts, browser = pychromecast.get_listed_chromecasts(
    known_hosts=["192.168.1.163"]
)

cast = chromecasts[0]
cast.wait()  # Wait for connection

# Play audio
mc = cast.media_controller
mc.play_media("http://example.com/song.mp3", "audio/mp3")
mc.block_until_active()

# Volume
cast.set_volume(0.5)

# TTS (requires hosting the audio file -- gTTS generates it, you serve it)
from gtts import gTTS
tts = gTTS("Dinner is ready", lang="en")
tts.save("/tmp/tts.mp3")
# Then serve via MERIDIAN's own HTTP and cast the URL
mc.play_media("http://192.168.1.171:8000/tts/tts.mp3", "audio/mp3")
```

### Network Scan Results (2026-04-12)

- **192.168.1.163** -- MAC `90:CA:FA:35:28:1C` -- **Google Inc.** (likely a Nest Mini or Google Home). Ports 8008/8443/8009 all timed out. Device may be in sleep mode or running firmware that blocks the local HTTP API. pychromecast discovery also failed, likely because mDNS responses weren't received (Windows Firewall set to Public profile, blocking inbound).
- **Action needed:** Temporarily switch Windows Firewall to Private profile or add inbound rules for UDP 5353 (mDNS) and TCP 8008-8009, 8443.

### What's NOT Possible

- You **cannot** send arbitrary voice commands ("Hey Google, play jazz in the kitchen") programmatically without a physical microphone or the deprecated Assistant SDK.
- You **cannot** control non-Cast smart home devices (lights, thermostats) through pychromecast. Those require the Google Home APIs (Android-only) or Home Assistant.
- You **cannot** create Google Home speaker groups programmatically. Groups are managed only through the Google Home mobile app.

## 3. Sonos

### What's Possible

| Approach | Viability | Notes |
|----------|-----------|-------|
| **SoCo** (Python, local UPnP) | **Best option** | Mature, actively maintained (v0.31, 2024). Full local control: play/pause, volume, seek, queue, grouping, favorites, TTS, alarms, EQ, sleep timers. No cloud dependency. |
| **soco-cli** | Great for scripting | CLI wrapper around SoCo. `sonos Kitchen volume 40`, `sonos Kitchen say "Dinner's ready"`. Could be called from MERIDIAN via subprocess. |
| **node-sonos-http-api** | Alternative bridge | Node.js HTTP bridge. REST endpoints like `GET /Kitchen/volume/40`, `GET /Kitchen/say/Dinner's ready`. Could run alongside MERIDIAN. Has built-in TTS support (VoiceRSS, Google Translate TTS, AWS Polly). |
| **Sonos Cloud Control API** | Supplement only | Official REST API. OAuth2 + Sonos developer account required. Adds: audioClip (play short clips without interrupting current music -- ideal for notifications). Does NOT support full playback control for all sources. Main advantage: works outside the LAN. |
| **play.sonos.com** (official web app) | Not for automation | Full playback control in browser, but no API -- browser automation would be fragile. |
| **Sonos S2 Windows app** | Not for automation | Desktop app, no exposed API or command-line interface. |

### Recommended Approach for MERIDIAN

```python
# pip install soco
import soco

# Discover all Sonos speakers
devices = soco.discover()
kitchen = {d.player_name: d for d in devices}.get("Kitchen")

# Play/Pause
kitchen.play()
kitchen.pause()

# Volume
kitchen.volume = 40
kitchen.volume += 5  # relative

# Queue and play a track
kitchen.clear_queue()
kitchen.add_uri("x-rincon-mp3radio://http://stream.example.com/jazz")
kitchen.play_from_queue(0)

# Play a favorite
favs = kitchen.music_library.get_sonos_favorites()
fav = [f for f in favs if "Jazz" in f.title][0]
kitchen.play_uri(fav.resources[0].uri, fav.resources[0].uri_metadata)

# TTS (using soco-cli's approach: host audio, play as clip)
# Or use Sonos Cloud API audioClip for non-interrupting alerts

# Group speakers
kitchen.join(living_room)  # kitchen joins living room's group
# Or: living_room.join(kitchen)

# Get current track info
info = kitchen.get_current_track_info()
# Returns: title, artist, album, album_art, position, duration, uri
```

### Network Scan Results (2026-04-12)

> [!warning] No Sonos devices discovered
> `soco.discover(timeout=10)` returned empty. SSDP M-SEARCH for `urn:schemas-upnp-org:device:ZonePlayer:1` got no responses. Only the router (192.168.1.1) responded to general SSDP.
>
> **Likely causes (in order of probability):**
> 1. Sonos speakers are on a different WiFi network/VLAN than the Ethernet-connected Rocinante (192.168.1.171). Rocinante's WiFi adapter is **disconnected**.
> 2. Sonos speakers are powered off or in standby.
> 3. Windows Firewall (Public profile) is blocking inbound SSDP multicast responses (UDP 1900).
> 4. Router not forwarding multicast between WiFi and Ethernet segments.
>
> **Resolution steps:**
> 1. Open the Sonos S2 app on a phone -- note the IP addresses shown in Settings > System > About My System.
> 2. Try `soco.discover()` again with `interface_addr="192.168.1.171"` to force the correct interface.
> 3. If IPs are known, bypass discovery: `speaker = soco.SoCo("192.168.1.XXX")`.
> 4. Add Windows Firewall inbound rule: UDP 1900 (SSDP) and UDP 5353 (mDNS) on Private/Domain profiles.

### What's NOT Possible

- **Sonos + Google Home speaker groups:** Cannot group Sonos and Google Home speakers together. They use incompatible multiroom protocols (Sonos proprietary vs. Chromecast). They must be controlled separately.
- **Spotify Connect via SoCo:** You cannot programmatically start Spotify playback from SoCo (Spotify uses its own connect protocol). You CAN control playback once Spotify is already playing on a Sonos speaker.
- **Sonos S1 devices:** If any speakers are running S1 firmware, they won't be discoverable by current SoCo versions.

## 4. Combined Architecture for MERIDIAN

### Architecture Diagram

```
MERIDIAN (FastAPI on Rocinante)
 |
 +-- /api/home/discover          GET  -- scan network for all devices
 +-- /api/home/devices           GET  -- list all known devices (cached)
 |
 +-- /api/home/sonos/            
 |    +-- {room}/play            POST -- play current queue
 |    +-- {room}/pause           POST
 |    +-- {room}/volume          POST {level: 0-100}
 |    +-- {room}/volume          GET  -- current volume
 |    +-- {room}/now-playing     GET  -- track info + album art
 |    +-- {room}/favorites       GET  -- list Sonos favorites
 |    +-- {room}/play-favorite   POST {name: "Jazz Radio"}
 |    +-- {room}/say             POST {text: "Dinner's ready", volume: 40}
 |    +-- {room}/group           POST {join: "Living Room"}
 |    +-- {room}/ungroup         POST
 |
 +-- /api/home/google/
 |    +-- {device}/play-media    POST {url: "...", content_type: "audio/mp3"}
 |    +-- {device}/tts           POST {text: "...", lang: "en"}
 |    +-- {device}/volume        POST {level: 0.0-1.0}
 |    +-- {device}/stop          POST
 |    +-- {device}/status        GET
 |
 +-- /api/home/announce          POST {text: "...", targets: ["all"|"sonos"|"google"|room_name]}
```

### Implementation Module Structure

```
meridian/
  home/
    __init__.py
    router.py              # FastAPI router mounting all endpoints
    discovery.py           # Network scanning (SoCo + pychromecast)
    sonos_controller.py    # SoCo wrapper with caching + error handling
    google_controller.py   # pychromecast wrapper
    tts_service.py         # gTTS generation + local HTTP serving
    models.py              # Pydantic models for API requests/responses
    device_cache.py        # In-memory cache of discovered devices
```

### Key Design Decisions

1. **No Home Assistant.** For speaker control only, HA adds a heavyweight Docker container, a separate web UI, its own auth system, and a YAML config layer. SoCo + pychromecast give us everything we need directly.
2. **Device cache with lazy refresh.** Discovery is slow (5-15s). Cache results and refresh on-demand or every 5 minutes.
3. **TTS via local HTTP.** MERIDIAN serves generated TTS audio files at `http://{meridian_ip}:{port}/static/tts/`. Both Sonos and Google Home can play from HTTP URLs on the LAN.
4. **Separate Sonos and Google endpoints.** Their capabilities differ enough that a unified abstraction would leak. Better to have clean per-ecosystem APIs and unify only at the UI layer.
5. **The "announce" endpoint** is the one unified cross-ecosystem feature: generate TTS, then fan out to all Sonos speakers (via SoCo) and all Google speakers (via pychromecast) simultaneously.

### When Home Assistant WOULD Make Sense

- If Alton wants to control non-speaker devices (lights, thermostats, locks, cameras) from MERIDIAN
- If he wants automations that span ecosystems (e.g., "when I leave home, pause all music")
- If the Google Home APIs mature into a real REST API (not just Android SDK)
- At that point, HA could run as a sidecar and MERIDIAN could call its REST API

## 5. Quick Wins (2-3 Hours)

### Win 1: Sonos Discovery and Control (1 hour)

Once Sonos devices are on the same network segment:
```python
# meridian/home/sonos_controller.py
import soco
from functools import lru_cache

class SonosController:
    def __init__(self):
        self._devices = {}
    
    def discover(self):
        devices = soco.discover(timeout=5)
        self._devices = {d.player_name: d for d in (devices or [])}
        return list(self._devices.keys())
    
    def get(self, room: str) -> soco.SoCo:
        if room not in self._devices:
            self.discover()
        return self._devices.get(room)
    
    def play(self, room): self.get(room).play()
    def pause(self, room): self.get(room).pause()
    def volume(self, room, level): self.get(room).volume = level
    def say(self, room, text, volume=40):
        # Would integrate with tts_service.py
        pass
```

### Win 2: Network Debug (30 minutes)

Fix the discovery issue:
1. Check Windows Firewall -- add inbound rules for UDP 1900, 5353
2. Get Sonos IPs from the Sonos app on phone
3. Test `soco.SoCo("known_ip")` with direct IP
4. Test `pychromecast.get_listed_chromecasts(known_hosts=["192.168.1.163"])`

### Win 3: TTS Announcement Endpoint (1 hour)

```python
# FastAPI endpoint
@router.post("/api/home/announce")
async def announce(text: str, targets: str = "all"):
    # Generate TTS audio
    audio_url = tts_service.generate(text)
    
    results = {}
    if targets in ("all", "sonos"):
        for name, device in sonos.devices.items():
            device.play_uri(audio_url)
            results[f"sonos:{name}"] = "ok"
    
    if targets in ("all", "google"):
        for name, cast in google.devices.items():
            cast.media_controller.play_media(audio_url, "audio/mp3")
            results[f"google:{name}"] = "ok"
    
    return {"announced": text, "results": results}
```

## 6. Medium-Term Roadmap

| Phase | What | Effort | Dependencies |
|-------|------|--------|-------------|
| **Phase 1** | Fix network discovery (firewall rules, verify same subnet) | 30 min | Physical access to router + phone with Sonos/Google Home apps |
| **Phase 2** | Build `meridian/home/` module with Sonos + Google control endpoints | 3-4 hours | Phase 1 |
| **Phase 3** | Dashboard UI -- "Home" card with room list, now-playing, volume sliders, TTS input | 4-6 hours | Phase 2 |
| **Phase 4** | Sonos Cloud API integration for audioClip (non-interrupting notifications) | 2-3 hours | Sonos developer account (free) |
| **Phase 5** | Automation hooks -- "GPU rental chime", "morning briefing to Office speaker" | 2-3 hours | Phase 2 + TTS service |
| **Phase 6** | Evaluate Home Assistant if non-speaker devices are wanted | 4-8 hours | Docker on Rocinante |

### Automation Examples

**GPU rental chime:**
```python
# In the GPU monitoring code, when a new rental is detected:
async def on_new_rental(rental_info):
    await meridian_client.post("/api/home/sonos/Office/play-media", json={
        "url": "http://meridian:8000/static/sounds/cash-register.mp3"
    })
```

**Morning briefing:**
```python
# Scheduled task at 7:00 AM
async def morning_briefing():
    text = await generate_briefing()  # from morning-briefing skill
    await meridian_client.post("/api/home/announce", json={
        "text": text,
        "targets": "Kitchen"  # or wherever Alton has coffee
    })
```

## 7. Things That Are NOT Possible

1. **Unified Sonos + Google speaker groups.** These ecosystems use incompatible multiroom protocols. MERIDIAN can send audio to both simultaneously, but there will be slight timing differences (not suitable for synced music, fine for announcements).

2. **Programmatic "Hey Google" voice commands.** The Google Assistant SDK is deprecated (Assistant EOL March 2026). Gemini has no local/programmatic API. You can cast audio and control media, but cannot trigger Assistant routines or control non-Cast smart home devices.

3. **Starting Spotify/Apple Music playback from scratch via API.** You can control playback once it's active (pause, skip, volume), but initiating a Spotify session requires using the Spotify Connect API separately, or having the user start it from the Spotify app/Sonos app first.

4. **Controlling Google Home device settings** (alarms, timers, routines) without the `cast-local-authorization-token`, which rotates daily and requires Google account credentials to refresh via `glocaltokens`.

5. **Browser-based control of Google Home via home.google.com.** The web UI is for device management (adding devices, setting up rooms), not for playback control. There is no web player equivalent.

6. **Sonos S1 devices.** If any Sonos speakers are on S1 firmware, they operate on a separate network and are not discoverable by current tools.

## 8. Raw Network Discovery Output (2026-04-12)

### Environment

- **Machine:** Rocinante (Windows 10, 192.168.1.171 via Ethernet)
- **WiFi:** Disconnected (Intel AX201)
- **Firewall:** Public profile, BlockInbound
- **Router:** 192.168.1.1 (HUMAX, OpenWRT 19.07)

### soco.discover()

```
Attempting Sonos discovery...
No Sonos devices found on this network.
Possible reasons: no Sonos devices, firewall blocking SSDP/UPnP, different subnet
```

### pychromecast discovery

```
Attempting Chromecast/Google Home discovery (15s timeout)...
No Chromecast/Google Home devices found.
Possible reasons: no devices, firewall, different subnet, mDNS blocked
Discovery stopped.
```

### SSDP M-SEARCH (all devices)

```
General SSDP M-SEARCH (all devices):
  Device at 192.168.1.1: SERVER: OpenWRT/19.07-SNAPSHOT UPnP/1.1 MiniUPnPd/2.2.0
Total unique IPs responding to SSDP: 1
```

### ARP Table (post ping-sweep)

```
192.168.1.1     ac-91-9b-6c-9b-69  HUMAX router (OpenWRT)
192.168.1.100   bc-fc-e7-d9-08-eb  Unknown vendor
192.168.1.160   e0-89-7e-5e-46-75  Apple Inc. -- Apple TV "Office" (AirPlay on port 7000)
192.168.1.163   90-ca-fa-35-28-1c  Google Inc. -- Google Home/Nest device (ports 8008/8443 not responding)
```

### AirPlay Discovery (192.168.1.160)

```
name: Office
model: AppleTV5,3
deviceID: DA:45:8C:F5:8A:84
macAddress: E0:89:7E:5E:46:75
sourceVersion: 940.23.1
osBuildVersion: 23L243
```

### Analysis

Only 4 devices visible on the 192.168.1.0/24 subnet. The Sonos speakers are most likely on a WiFi-only segment that the Ethernet-connected Rocinante cannot reach via multicast. The Google device at .163 has a Google MAC but is not responding to Cast protocol discovery or the local HTTP API. Next step: get device IPs from the mobile apps and test direct connections.
