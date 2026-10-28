/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('PWA compliance: manifest.json is valid and contains all required PWABuilder fields', () => {
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'public/manifest.json must exist');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.strictEqual(content.name, 'Tile Wars: Tactical Terminal');
  assert.strictEqual(content.short_name, 'Tile Wars');
  assert.strictEqual(content.description, 'Turn-based retro hex strategy game');
  assert.strictEqual(content.start_url, './index.html');
  assert.strictEqual(content.display, 'standalone');
  assert.strictEqual(content.orientation, 'portrait');
  assert.strictEqual(content.background_color, '#0a0c0a');
  assert.strictEqual(content.theme_color, '#00ff66');
  assert.deepStrictEqual(content.categories, ['games', 'entertainment']);

  // Icons validation
  assert.ok(Array.isArray(content.icons), 'icons must be an array');
  assert.ok(content.icons.some((i: any) => i.sizes === '192x192' && i.type === 'image/png'), 'Must have 192x192 PNG icon');
  assert.ok(content.icons.some((i: any) => i.sizes === '512x512' && i.type === 'image/png'), 'Must have 512x512 PNG icon');
  assert.ok(content.icons.some((i: any) => i.purpose === 'maskable'), 'Must have maskable icon');
});

test('PWA compliance: PNG and SVG icons exist and have valid file sizes', () => {
  const requiredFiles = [
    'public/icons/icon-192x192.png',
    'public/icons/icon-512x512.png',
    'public/icons/icon-maskable-512x512.png',
    'public/icons/apple-touch-icon.png',
    'public/icons/icon.svg',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(process.cwd(), relPath);
    assert.ok(fs.existsSync(fullPath), `${relPath} must exist`);
    const stats = fs.statSync(fullPath);
    assert.ok(stats.size > 200, `${relPath} must have non-empty valid content`);
  }
});

test('PWA compliance: Service Worker sw.js is configured with cache and offline fallback', () => {
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf-8');

  assert.ok(swContent.includes('addEventListener(\'install\''), 'sw.js must handle install event');
  assert.ok(swContent.includes('addEventListener(\'activate\''), 'sw.js must handle activate event');
  assert.ok(swContent.includes('addEventListener(\'fetch\''), 'sw.js must handle fetch event');
  assert.ok(swContent.includes('caches.open'), 'sw.js must open cache');
  assert.ok(swContent.includes('clients.claim()'), 'sw.js must claim clients');
});

test('PWA compliance: index.html has manifest link, meta tags, and Service Worker registration', () => {
  const indexPath = path.join(process.cwd(), 'index.html');
  const html = fs.readFileSync(indexPath, 'utf-8');

  assert.ok(html.includes('rel="manifest"'), 'index.html must link to manifest');
  assert.ok(html.includes('theme-color'), 'index.html must have theme-color meta');
  assert.ok(html.includes('viewport-fit=cover'), 'index.html must have viewport-fit=cover');
  assert.ok(html.includes('navigator.serviceWorker') && html.includes('register'), 'index.html must register Service Worker');
});
