import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import { startServer } from "../scripts/serve.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("static server", () => {
  /** @type {import("node:http").Server} */
  let server;
  /** @type {string} */
  let baseUrl;

  before(async () => {
    const started = await startServer({ root: repoRoot, port: 0 });
    server = started.server;
    baseUrl = started.url;
  });

  after(async () => {
    await new Promise((resolvePromise) => server.close(resolvePromise));
  });

  it("serves the web template index over HTTP", async () => {
    const response = await fetch(`${baseUrl}/web/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    const html = await response.text();
    assert.match(html, /curly-doodle/i);
    assert.match(html, /<canvas id="pad"/);
  });

  it("serves stylesheets with the correct content type", async () => {
    const response = await fetch(`${baseUrl}/web/styles.css`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/css/);
  });

  it("serves ES modules so the app can import the library", async () => {
    const response = await fetch(`${baseUrl}/src/index.js`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /javascript/);
    const source = await response.text();
    assert.match(source, /export/);
  });

  it("returns 404 for a missing file", async () => {
    const response = await fetch(`${baseUrl}/web/does-not-exist.js`);
    assert.equal(response.status, 404);
  });

  it("refuses to escape the served root", async () => {
    const response = await fetch(`${baseUrl}/..%2f..%2fetc%2fpasswd`);
    assert.equal(response.status, 403);
  });

  it("rejects malformed percent-encoding", async () => {
    const response = await fetch(`${baseUrl}/web/%E0%A4%A`);
    assert.equal(response.status, 403);
  });

  it("rejects null-byte paths", async () => {
    const response = await fetch(`${baseUrl}/web/%00index.html`);
    assert.equal(response.status, 403);
  });
});
