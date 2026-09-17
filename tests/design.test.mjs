import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const postcss = require("postcss");
const parseValue = require("next/dist/compiled/postcss-value-parser");
const app = new URL("../app/", import.meta.url);
const files = readdirSync(app).filter(name => name.endsWith(".css"));
const sheets = [...files, "login/login.css"].map(name => ({
  name, root: postcss.parse(readFileSync(new URL(name, app), "utf8")),
}));
const definitions = new Map();
for (const { root } of sheets) root.walkDecls(/^--/, d => definitions.set(d.prop, d.value));

function resolve(value, path = []) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, key) => {
    assert.ok(definitions.has(key), `Undefined token: ${key}`);
    assert.ok(!path.includes(key), `Circular token: ${key}`);
    return resolve(definitions.get(key), [...path, key]);
  });
}

test("component CSS uses defined tokens for colors, fixed dimensions and durations", () => {
  for (const { name, root } of sheets) {
    root.walkAtRules("import", rule => {
      const match = rule.params.match(/^"(\.\/[^\"]+)"/);
      if (match) assert.ok(existsSync(new URL(match[1], new URL(name, app))), `Missing CSS import: ${match[1]}`);
    });
    root.walkDecls(d => {
      if (name === "tokens.css") return;
      parseValue(d.value).walk(node => {
        if (node.type === "function" && node.value === "var") {
          const token = node.nodes.find(n => n.type === "word")?.value;
          assert.ok(definitions.has(token), `${name}: undefined ${token}`);
          return false;
        }
        if (node.type !== "word") return;
        assert.ok(!/^#|^(white|black)$/i.test(node.value), `${name}: hardcoded color ${node.value}`);
        assert.ok(!/^[+-]?[\d.]+(px|rem|ms|s)$/.test(node.value), `${name}: hardcoded dimension ${node.value}`);
      });
    });
  }
  for (const [key, value] of definitions) resolve(value, [key]);
});

test("interface text stays on the readable type scale and body is 16px", () => {
  const scale = new Set([14, 16, 18, 22, 28, 36]);
  for (const { name, root } of sheets) {
    if (name === "tokens.css") continue;
    root.walkDecls("font-size", d => {
      const value = resolve(d.value);
      assert.match(value, /^\d+px$/, `${name}: non-token text size`);
      assert.ok(scale.has(parseFloat(value)), `${name}: unsupported type size ${value}`);
    });
  }
  assert.equal(resolve("var(--font-size-body)"), "16px");
  assert.equal(resolve("var(--control-min-size)"), "44px");
});

function rgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
}
function luminance(channels) {
  return channels.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

test("text, placeholders, accent and semantic pairs have at least 4.5:1 contrast", () => {
  for (const foreground of ["--foreground", "--muted", "--placeholder"]) {
    for (const background of ["--surface", "--background", "--accent-subtle"]) {
      assert.ok(contrast(rgb(resolve(`var(${foreground})`)), rgb(resolve(`var(${background})`))) >= 4.5,
        `${foreground} on ${background}`);
    }
  }
  for (const accent of ["--accent", "--accent-hover"]) {
    assert.ok(contrast(rgb(resolve(`var(${accent})`)), rgb(resolve("var(--accent-contrast)"))) >= 4.5);
  }
  for (const state of ["draft", "scheduled", "published", "error", "warning"]) {
    const foreground = rgb(resolve(`var(--state-${state})`));
    const background = resolve(`var(--state-${state}-bg)`);
    assert.match(background, /8%, #ffffff\)/);
    assert.ok(contrast(foreground, foreground.map(v => v * .08 + 255 * .92)) >= 4.5, state);
  }
});

test("publication states share one mapping across calendar, editor and badges", () => {
  const expected = new Map([["Borrador", "draft"], ["En revisión", "warning"], ["Aprobado", "scheduled"], ["Publicado", "published"]]);
  const global = sheets.find(s => s.name === "globals.css").root;
  for (const [label, token] of expected) {
    const rules = [];
    global.walkRules(`[data-status="${label}"]`, rule => rules.push(rule));
    assert.equal(rules.length, 1, `Duplicate/missing mapping: ${label}`);
    assert.equal(rules[0].nodes.find(n => n.prop === "--publication-color").value, `var(--state-${token})`);
  }
  for (const { root } of sheets) root.walkRules(rule => {
    if (!rule.selector.includes("[data-status=")) return;
    rule.walkDecls(d => {
      if (/^(color|background|border.*color)$/.test(d.prop)) assert.match(d.value, /var\(--publication-/, rule.selector);
    });
  });
  assert.ok(readFileSync(new URL("globals.css", app), "utf8").includes("prefers-reduced-motion"));
});
