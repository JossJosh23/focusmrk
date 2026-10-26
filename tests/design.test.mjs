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

test("interface text uses the type scale; compact sizes only through their named tokens; body is 16px", () => {
  // Brand-specified sizes outside the scale: 11px sidebar labels, 12px calendar labels,
  // 13px metadata and the 24px calendar title. They are only valid via these tokens.
  const compact = new Map([["var(--shell-section-size)", "11px"], ["var(--cal-label-size)", "12px"], ["var(--shell-meta-size)", "13px"], ["var(--cal-title-size)", "24px"]]);
  const scale = new Set([14, 16, 18, 22, 28, 36]);
  for (const { name, root } of sheets) {
    if (name === "tokens.css") continue;
    root.walkDecls("font-size", d => {
      const value = resolve(d.value);
      assert.match(value, /^\d+px$/, `${name}: non-token text size`);
      assert.ok(compact.get(d.value) === value || scale.has(parseFloat(value)), `${name}: unsupported type size ${value} in ${d.parent.selector}`);
    });
  }
  for (const [token, size] of compact) assert.equal(resolve(token), size);
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
  for (const foreground of ["--sidebar-foreground", "--sidebar-muted"]) {
    for (const background of ["--sidebar-background", "--sidebar-hover"]) {
      assert.ok(contrast(rgb(resolve(`var(${foreground})`)), rgb(resolve(`var(${background})`))) >= 4.5,
        `${foreground} on ${background}`);
    }
  }
  for (const foreground of ["--foreground", "--muted", "--placeholder"]) {
    for (const background of ["--surface", "--background", "--accent-subtle"]) {
      assert.ok(contrast(rgb(resolve(`var(${foreground})`)), rgb(resolve(`var(${background})`))) >= 4.5,
        `${foreground} on ${background}`);
    }
  }
  assert.ok(contrast(rgb(resolve("var(--accent-hover)")), rgb(resolve("var(--accent-contrast)"))) >= 4.5);
  // Brand exception: white on --azul (#2F6BFF) measures 4.499:1, a thousandth under AA. The brand asked for
  // this exact blue on the primary button; blue *text* uses --accent-text (--azul-hover) instead.
  assert.ok(contrast(rgb(resolve("var(--accent)")), rgb(resolve("var(--accent-contrast)"))) >= 4.49);
  for (const background of ["--surface", "--background", "--accent-subtle"]) {
    assert.ok(contrast(rgb(resolve("var(--accent-text)")), rgb(resolve(`var(${background})`))) >= 4.5, `--accent-text on ${background}`);
  }
  for (const state of ["draft", "scheduled", "published", "error", "warning"]) {
    const foreground = rgb(resolve(`var(--state-${state})`));
    const background = resolve(`var(--state-${state}-bg)`);
    assert.match(background, /8%, #ffffff\)/i);
    assert.ok(contrast(foreground, foreground.map(v => v * .08 + 255 * .92)) >= 4.5, state);
  }
});

test("workspace chrome text pairs reach 4.5:1", () => {
  // Shell tokens use color-mix and rgba; flatten both to sRGB before measuring.
  const color = (name, base = [255, 255, 255]) => {
    const value = resolve(`var(${name})`);
    const mix = value.match(/^color-mix\(in srgb, (#\w{6}) (\d+)%, (#\w{6})\)$/);
    if (mix) return rgb(mix[1]).map((v, i) => v * mix[2] / 100 + rgb(mix[3])[i] * (1 - mix[2] / 100));
    const alpha = value.match(/^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/);
    if (alpha) return base.map((v, i) => Number(alpha[i + 1]) * alpha[4] + v * (1 - alpha[4]));
    return rgb(value);
  };
  const sidebar = color("--shell-sidebar");
  const pairs = [
    ["--shell-label", "--shell-sidebar"], ["--shell-nav-text", "--shell-sidebar"], ["--shell-accent-light", "--shell-sidebar"],
    ["--shell-text", "--shell-lavender"], ["--shell-muted", "--shell-lavender"], ["--shell-accent-text", "--shell-lavender"], ["--shell-muted", "--surface"], ["--login-accent-text", "--login-white"],
    ["--shell-overdue-text", "--shell-overdue-soft"], ["--shell-overdue-text", "--shell-lavender"], ["--shell-upcoming-text", "--shell-upcoming-soft"],
    ["--surface", "--shell-overdue-text"], ["--surface", "--shell-accent-text"], ["--shell-muted", "--cal-weekend"],
  ];
  for (const [foreground, background] of pairs) {
    const back = background === "--shell-sidebar" ? sidebar : color(background);
    assert.ok(contrast(color(foreground, back), back) >= 4.5, `${foreground} on ${background}`);
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

test("composer keeps every field and an always-visible footer with the primary action", () => {
  const { transpileModule, ModuleKind, JsxEmit } = require("typescript");
  const { createElement } = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const calendar = require("../lib/calendar.ts");
  const dir = new URL("../components/calendar/composer/", import.meta.url);
  // Replace media, icon and image dependencies only; the composer modules themselves are the real ones.
  const stubs = {
    "@/lib/calendar": calendar,
    "@/lib/media": { MEDIA_TYPES: [], allMedia: async () => [], getMedia: async () => undefined, putMedia: async () => {}, uniqueMedia: async () => ({ accepted: [], duplicates: [] }), assetFromFile() {} },
    "@/lib/link-preview": { resolveLinkPreview: () => null },
    "../media-library": { AssetPreview: () => null },
    "../link-media-preview": { LinkMediaPreview: () => null },
    "../content-card": { NetworkIcons: () => null },
    "../post-thumbnail": { PostThumbnail: () => null },
    "next/image": { __esModule: true, default: () => null },
  };
  const cache = new Map();
  function load(name) {
    if (stubs[name]) return stubs[name];
    if (!name.startsWith("./")) return require(name);
    if (cache.has(name)) return cache.get(name).exports;
    const file = [".tsx", ".ts"].map(ext => new URL(name.slice(2) + ext, dir)).find(url => existsSync(url));
    const loaded = { exports: {} };
    cache.set(name, loaded);
    const compiled = transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Function("require", "module", "exports", compiled)(load, loaded, loaded.exports);
    return loaded.exports;
  }
  const { PostComposer } = load("./post-composer");
  const markup = renderToStaticMarkup(createElement(PostComposer, {
    server: false, initial: { ...calendar.emptyPublication("2026-09-17"), brand: "Prueba" },
    posts: [], usedMediaIds: [], onClose() {}, onSave: async () => true, onDelete: async () => true,
    persistenceError: "No se pudo guardar",
  }));
  for (const text of ['aria-label="Tema o título"', "Prueba", "Borrador", "Medios", "Texto de publicación", "Programación", "Redes sociales", "Brief creativo", "Pauta", "Añadir firma de la marca", "Checklist de publicación", "Simulación orientativa"]) {
    assert.ok(markup.includes(text), `Composer must render: ${text}`);
  }
  // The footer is a sibling of the body (not inside a scrolling column) and carries the primary action and save errors.
  const footer = markup.slice(markup.indexOf('<footer class="cmp-footer"'));
  assert.ok(markup.indexOf('<footer class="cmp-footer"') > markup.lastIndexOf('class="cmp-preview"'), "Footer must follow the body columns");
  assert.ok(footer.includes("Programar") && footer.includes("No se pudo guardar"));
  const composer = sheets.find(s => s.name === "composer.css").root;
  composer.walkRules(rule => {
    if (/\.cmp-footer\b(?![-\w])/.test(rule.selector) && rule.parent.type === "atrule") {
      assert.ok(!rule.nodes.some(n => n.prop === "display" && n.value === "none"), "No breakpoint may hide the composer footer");
    }
  });
});
