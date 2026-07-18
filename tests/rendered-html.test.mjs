import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("Fırsat Lab ana sayfasını sunucu tarafında oluşturur", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Fırsat Lab — Otomasyon Fırsatı Keşif Aracı<\/title>/i);
  assert.match(html, /Bugün neyi daha/);
  assert.match(html, /Fırsat havuzu/i);
  assert.match(html, /Yeni fırsat yakala/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("erişilebilir temel yapıyı ve yerel veri akışını içerir", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /lang="tr"/i);
  assert.match(html, /aria-label="Ana menü"/i);
  assert.match(html, /Fırsat Lab ana sayfa/i);
  assert.match(html, /Veriler yalnızca bu tarayıcıda saklanır/i);

  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(source, /function exportJson\(/);
  assert.match(source, /function exportCsv\(/);
  assert.match(source, /function exportMarkdown\(/);
  assert.match(source, /function importJson\(/);
});
