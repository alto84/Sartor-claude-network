"""
Chrome DevTools Protocol (CDP) client for browser automation.
Works on any platform with Chrome installed.

Usage:
    from cdp_client import CDPClient

    client = CDPClient(port=9223)
    tabs = client.list_tabs()
    tab = tabs[0]
    client.navigate(tab['id'], 'https://example.com')
    screenshot_b64 = client.screenshot(tab['id'])
    text = client.eval_js(tab['id'], 'document.title')
"""

import json
import base64
import urllib.request
import asyncio
import random
from typing import Optional

try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False

try:
    import websocket as ws_sync
    HAS_WS_SYNC = True
except ImportError:
    HAS_WS_SYNC = False


class CDPClient:
    """Chrome DevTools Protocol client using HTTP + WebSocket."""

    def __init__(self, host: str = "localhost", port: int = 9223):
        self.host = host
        self.port = port
        self.base_url = f"http://{host}:{port}"

    def list_tabs(self) -> list:
        """List all open page tabs."""
        url = f"{self.base_url}/json"
        with urllib.request.urlopen(url, timeout=5) as resp:
            tabs = json.loads(resp.read())
        return [t for t in tabs if t.get("type") == "page"]

    def get_tab(self, tab_id: str) -> Optional[dict]:
        """Get a specific tab by ID."""
        for tab in self.list_tabs():
            if tab["id"] == tab_id:
                return tab
        return None

    def new_tab(self, url: str = "about:blank") -> dict:
        """Create a new tab."""
        req_url = f"{self.base_url}/json/new?{url}"
        req = urllib.request.Request(req_url, method="PUT")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())

    def close_tab(self, tab_id: str) -> bool:
        """Close a tab."""
        req_url = f"{self.base_url}/json/close/{tab_id}"
        try:
            with urllib.request.urlopen(req_url, timeout=5) as resp:
                return resp.read().decode().strip() == "Target is closing"
        except Exception:
            return False

    def _send_cdp(self, ws_url: str, method: str, params: dict = None, timeout: int = 15) -> dict:
        """Send a CDP command via WebSocket and return the response."""
        if params is None:
            params = {}

        msg_id = random.randint(1, 999999)
        message = json.dumps({"id": msg_id, "method": method, "params": params})

        if HAS_WS_SYNC:
            return self._send_sync(ws_url, message, msg_id, timeout)
        elif HAS_WEBSOCKETS:
            return asyncio.get_event_loop().run_until_complete(
                self._send_async(ws_url, message, msg_id, timeout)
            )
        else:
            raise ImportError(
                "No WebSocket library available. Install one:\n"
                "  pip install websocket-client  (recommended)\n"
                "  pip install websockets"
            )

    def _send_sync(self, ws_url: str, message: str, msg_id: int, timeout: int) -> dict:
        """Send CDP command using websocket-client (synchronous)."""
        conn = ws_sync.create_connection(ws_url, timeout=timeout)
        try:
            conn.send(message)
            while True:
                raw = conn.recv()
                resp = json.loads(raw)
                if resp.get("id") == msg_id:
                    return resp
        finally:
            conn.close()

    async def _send_async(self, ws_url: str, message: str, msg_id: int, timeout: int) -> dict:
        """Send CDP command using websockets (async)."""
        async with websockets.connect(ws_url) as conn:
            await conn.send(message)
            while True:
                raw = await asyncio.wait_for(conn.recv(), timeout=timeout)
                resp = json.loads(raw)
                if resp.get("id") == msg_id:
                    return resp

    def _cdp(self, tab_id: str, method: str, params: dict = None, timeout: int = 15) -> dict:
        """Execute a CDP method on a specific tab."""
        tab = self.get_tab(tab_id)
        if not tab:
            raise ValueError(f"Tab '{tab_id}' not found")
        ws_url = tab["webSocketDebuggerUrl"]
        return self._send_cdp(ws_url, method, params or {}, timeout)

    def navigate(self, tab_id: str, url: str, timeout: int = 30) -> dict:
        """Navigate a tab to a URL."""
        result = self._cdp(tab_id, "Page.navigate", {"url": url}, timeout)
        return result.get("result", {})

    def eval_js(self, tab_id: str, expression: str, await_promise: bool = False) -> any:
        """Evaluate JavaScript in a tab and return the result."""
        params = {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": await_promise,
        }
        result = self._cdp(tab_id, "Runtime.evaluate", params)
        r = result.get("result", {}).get("result", {})
        if r.get("type") == "string":
            return r.get("value")
        elif r.get("type") == "number":
            return r.get("value")
        elif r.get("type") == "boolean":
            return r.get("value")
        elif r.get("type") == "object" and "value" in r:
            return r["value"]
        elif r.get("type") == "undefined":
            return None
        return r

    def screenshot(self, tab_id: str, format: str = "png", quality: int = None) -> str:
        """Take a screenshot and return base64-encoded image data."""
        params = {"format": format}
        if quality is not None:
            params["quality"] = quality
        result = self._cdp(tab_id, "Page.captureScreenshot", params)
        return result.get("result", {}).get("data", "")

    def screenshot_to_file(self, tab_id: str, output_path: str, format: str = "png") -> str:
        """Take a screenshot and save to file."""
        b64 = self.screenshot(tab_id, format)
        if b64:
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(b64))
        return output_path

    def get_page_text(self, tab_id: str) -> str:
        """Get the text content of the page."""
        return self.eval_js(tab_id, "document.body.innerText")

    def get_page_title(self, tab_id: str) -> str:
        """Get the page title."""
        return self.eval_js(tab_id, "document.title")

    def get_page_html(self, tab_id: str) -> str:
        """Get the full HTML of the page."""
        return self.eval_js(tab_id, "document.documentElement.outerHTML")

    def click(self, tab_id: str, x: int, y: int) -> None:
        """Click at coordinates."""
        self._cdp(tab_id, "Input.dispatchMouseEvent", {
            "type": "mousePressed", "x": x, "y": y,
            "button": "left", "clickCount": 1
        })
        self._cdp(tab_id, "Input.dispatchMouseEvent", {
            "type": "mouseReleased", "x": x, "y": y,
            "button": "left", "clickCount": 1
        })

    def click_selector(self, tab_id: str, selector: str) -> bool:
        """Click an element by CSS selector."""
        js = f"""
        (function() {{
            var el = document.querySelector('{selector}');
            if (!el) return null;
            var rect = el.getBoundingClientRect();
            return {{x: rect.x + rect.width/2, y: rect.y + rect.height/2}};
        }})()
        """
        pos = self.eval_js(tab_id, js)
        if pos and isinstance(pos, dict):
            self.click(tab_id, int(pos["x"]), int(pos["y"]))
            return True
        return False

    def type_text(self, tab_id: str, text: str) -> None:
        """Type text into the focused element."""
        self._cdp(tab_id, "Input.insertText", {"text": text})

    def find_elements(self, tab_id: str, selector: str, limit: int = 20) -> list:
        """Find elements by CSS selector, return their info."""
        js = f"""
        (function() {{
            var els = document.querySelectorAll('{selector}');
            var results = [];
            for (var i = 0; i < Math.min(els.length, {limit}); i++) {{
                var el = els[i];
                var rect = el.getBoundingClientRect();
                results.push({{
                    tag: el.tagName.toLowerCase(),
                    text: (el.innerText || '').substring(0, 200),
                    href: el.href || null,
                    bounds: {{x: rect.x, y: rect.y, w: rect.width, h: rect.height}},
                    visible: rect.width > 0 && rect.height > 0
                }});
            }}
            return results;
        }})()
        """
        return self.eval_js(tab_id, js) or []

    def scroll(self, tab_id: str, x: int = 0, y: int = 300) -> None:
        """Scroll the page."""
        self._cdp(tab_id, "Input.dispatchMouseEvent", {
            "type": "mouseWheel", "x": 0, "y": 0,
            "deltaX": x, "deltaY": y
        })

    def wait(self, seconds: float = 1.0) -> None:
        """Wait for a specified number of seconds."""
        import time
        time.sleep(seconds)


def launch_chrome(port: int = 9223, user_data_dir: str = "/tmp/chrome-automation") -> None:
    """Launch Chrome with CDP enabled (Linux)."""
    import subprocess
    import shutil

    chrome_path = shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium-browser")
    if not chrome_path:
        raise FileNotFoundError("Chrome not found. Install google-chrome or chromium-browser.")

    subprocess.Popen([
        chrome_path,
        f"--remote-debugging-port={port}",
        "--remote-allow-origins=*",
        f"--user-data-dir={user_data_dir}",
        "--no-first-run",
        "--headless=new",  # Run headless on servers
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    import time
    time.sleep(2)  # Wait for Chrome to start


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python cdp_client.py <command> [args...]")
        print("Commands: list, navigate <url>, screenshot <output>, text, title, eval <js>")
        sys.exit(1)

    client = CDPClient()
    cmd = sys.argv[1]

    if cmd == "list":
        for tab in client.list_tabs():
            print(f"  {tab['id']}: {tab.get('title', 'untitled')} - {tab.get('url', '')}")

    elif cmd == "navigate":
        url = sys.argv[2] if len(sys.argv) > 2 else "https://example.com"
        tabs = client.list_tabs()
        if tabs:
            print(client.navigate(tabs[0]["id"], url))
        else:
            tab = client.new_tab(url)
            print(f"Created tab: {tab['id']}")

    elif cmd == "screenshot":
        output = sys.argv[2] if len(sys.argv) > 2 else "screenshot.png"
        tabs = client.list_tabs()
        if tabs:
            client.screenshot_to_file(tabs[0]["id"], output)
            print(f"Saved: {output}")

    elif cmd == "text":
        tabs = client.list_tabs()
        if tabs:
            print(client.get_page_text(tabs[0]["id"]))

    elif cmd == "title":
        tabs = client.list_tabs()
        if tabs:
            print(client.get_page_title(tabs[0]["id"]))

    elif cmd == "eval":
        expr = sys.argv[2] if len(sys.argv) > 2 else "1+1"
        tabs = client.list_tabs()
        if tabs:
            print(client.eval_js(tabs[0]["id"], expr))

    elif cmd == "launch":
        launch_chrome()
        print("Chrome launched with CDP on port 9223")
