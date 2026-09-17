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

test("editor submit remains associated with its form outside the mobile panels", () => {
  const { transpileModule, ModuleKind, JsxEmit } = require("typescript");
  const { createElement } = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const calendar = require("../lib/calendar.ts");
  const source = readFileSync(new URL("../components/calendar/post-editor.tsx", import.meta.url), "utf8");
  const compiled = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  const compiledModule = { exports: {} };
  // Replace media/network dependencies only; render the real editor and native form.
  const dependencies = {
    "@/lib/calendar": calendar,
    "./media-library": { MediaLibrary: () => null },
    "./visual-preview": { VisualPreview: () => createElement("aside", { className: "social-preview" }) },
    "./content-card": { SocialPlatformIcon: () => null },
  };
  new Function("require", "module", "exports", compiled)(name => dependencies[name] || require(name), compiledModule, compiledModule.exports);
  const markup = renderToStaticMarkup(createElement(compiledModule.exports.PostEditor, {
    server: false, initial: { ...calendar.emptyPublication("2026-09-17"), brand: "Prueba" },
    posts: [], usedMediaIds: [], onClose() {}, onSave: async () => true, onDelete: async () => true,
    persistenceError: "No se pudo guardar",
  }));
  const form = markup.match(/<form\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/form>/);
  assert.ok(form, "Native form must remain present");
  assert.ok(!form[2].includes('class="editor-actions"'), "Actions must not be inside the panel hidden on mobile");
  assert.ok(form[2].includes("Tema o título") && form[2].includes("Fecha tentativa"));
  const footer = markup.slice(markup.indexOf('class="editor-actions"'));
  assert.ok(footer.includes(`form="${form[1]}"`), "External submit must target the native form");
  assert.ok(footer.includes("Guardar publicación") && footer.includes("No se pudo guardar"));
  const editor = sheets.find(s => s.name === "editor.css").root;
  let mobileFooter;
  editor.walkAtRules("media", at => {
    if (at.params === "(max-width: 850px)") at.walkRules(".editor-actions", r => { mobileFooter = r; });
  });
  assert.equal(mobileFooter?.nodes.find(n => n.prop === "grid-row")?.value, "5");
});
