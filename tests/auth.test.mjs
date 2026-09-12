import test from "node:test";
import assert from "node:assert/strict";
import { createSession, validSession, credentialsValid, panelAccess, SESSION_COOKIE, SESSION_SECONDS } from "../lib/panel-auth.ts";

test("sessions enforce credentials, expiry, signature, rotation and mutation protection", () => {
  const previous = { ...process.env };
  Object.assign(process.env, { DATABASE_URL: "postgres://test", PANEL_USER: "owner", PANEL_PASSWORD: "test-password-123456789" });
  try {
    assert.equal(credentialsValid("owner", "test-password-123456789"), true);
    assert.equal(credentialsValid("owner", "wrong"), false);
    const now = Date.now();
    const token = createSession(now);
    assert.equal(validSession(token, now), true);
    assert.equal(validSession(token, now + SESSION_SECONDS * 1000), false);
    assert.equal(validSession(`${token}x`, now), false);
    assert.equal(validSession(token.replace(/.$/, token.endsWith("a") ? "b" : "a"), now), false);
    const headers = { cookie: `${SESSION_COOKIE}=${token}` };
    assert.equal(panelAccess(new Request("https://example.com/api/workspace", { headers })), null);
    assert.equal(panelAccess(new Request("https://example.com/api/workspace" )).status, 401);
    assert.equal(panelAccess(new Request("https://example.com/api/workspace", { method: "POST", headers })).status, 403);
    assert.equal(panelAccess(new Request("https://example.com/api/workspace", { method: "POST", headers: { ...headers, "x-focusmrk-request": "1" } })), null);
    assert.equal(panelAccess(new Request("https://example.com/api/workspace", { method: "POST", headers: { ...headers, "x-focusmrk-request": "1", "sec-fetch-site": "cross-site" } })).status, 403);
    process.env.PANEL_PASSWORD = "rotated-password-123456789";
    assert.equal(validSession(token, now), false);
    delete process.env.DATABASE_URL;
    assert.equal(panelAccess(new Request("https://example.com")), null);
  } finally {
    for (const key of ["DATABASE_URL", "PANEL_USER", "PANEL_PASSWORD"]) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
});
