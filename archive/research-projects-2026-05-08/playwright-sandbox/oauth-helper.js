// OAuth helper v2 — opens Chromium, navigates to the rtxserver Claude OAuth URL,
// auto-clicks the Authorize button if present, waits for the callback redirect
// with a real auth code (not the URL param `code=true`), extracts the code.
//
// Usage:
//   node oauth-helper.js "<oauth-url>"
//
// Persistent profile lives in ./profile/ so login persists across runs.

const { chromium } = require("playwright");

const url = process.argv[2];
if (!url) {
  console.error("Usage: node oauth-helper.js <oauth-url>");
  process.exit(1);
}

const PROFILE_DIR = "./profile";
const CALLBACK_HOST = "platform.claude.com";

async function maybeClickAuthorize(page) {
  // Try common authorize-button text patterns
  const candidates = [
    'button:has-text("Authorize")',
    'button:has-text("Allow")',
    'button:has-text("Approve")',
    'button:has-text("Continue")',
    '[data-testid="authorize-button"]',
    'button[type="submit"]',
  ];
  for (const sel of candidates) {
    try {
      const btn = await page.locator(sel).first();
      if (await btn.isVisible({ timeout: 500 })) {
        const text = (await btn.textContent()) || sel;
        console.log(`[oauth-helper] clicking: ${text.trim()} (${sel})`);
        await btn.click();
        return true;
      }
    } catch (e) {
      // not visible / not found, try next
    }
  }
  return false;
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
  });
  const page = ctx.pages()[0] || (await ctx.newPage());

  console.log("[oauth-helper] navigating to OAuth URL");
  await page.goto(url, { waitUntil: "domcontentloaded" });

  console.log("[oauth-helper] waiting for callback redirect or auth code...");

  let captured = null;
  let lastUrl = "";
  for (let i = 0; i < 600; i++) {
    const cur = page.url();
    if (cur !== lastUrl) {
      console.log(`[oauth-helper] url: ${cur.slice(0, 140)}`);
      lastUrl = cur;
    }

    // Real callback: contains platform.claude.com/oauth/code/callback?code=<longstring>
    if (cur.includes(CALLBACK_HOST + "/oauth/code/callback") && cur.includes("code=")) {
      const m = cur.match(/[?&]code=([^&]+)/);
      if (m && m[1] !== "true" && m[1].length > 10) {
        captured = decodeURIComponent(m[1]);
        break;
      }
    }

    // Try clicking authorize button if we're on an authorize page
    if (cur.includes("/oauth/authorize") || cur.includes("/cai/oauth")) {
      const clicked = await maybeClickAuthorize(page);
      if (clicked) {
        await page.waitForTimeout(2000);
        continue;
      }
    }

    // Look for an explicit paste-code on the page (some flows show code visibly)
    try {
      const bodyText = await page.evaluate(
        () => document.body && document.body.innerText.slice(0, 4000)
      );
      // Pattern: a long code with # separator (Claude Code pasteback format)
      const m = bodyText && bodyText.match(/\b([A-Za-z0-9_-]{20,}#[A-Za-z0-9_-]{20,})\b/);
      if (m) {
        captured = "ONPAGE:" + m[1];
        break;
      }
    } catch (e) {
      // page navigating
    }

    await page.waitForTimeout(1000);
  }

  if (!captured) {
    console.log("[oauth-helper] TIMEOUT — no callback after 10 minutes");
    console.log("[oauth-helper] final URL:", page.url());
  } else {
    console.log("[oauth-helper] CAPTURED_CODE:", captured);
  }

  // Keep browser open 5s so user can see the result, then close
  await page.waitForTimeout(5000);
  await ctx.close();
})();
