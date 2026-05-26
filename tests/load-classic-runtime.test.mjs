import test from "node:test";
import assert from "node:assert/strict";

import {
  CLASSIC_RUNTIME_BUNDLE_PATH,
  loadClassicRuntime,
} from "../scripts/load-classic-runtime.module.mjs";
import { CLASSIC_RUNTIME_SCRIPT_PATHS } from "../scripts/classic-runtime-manifest.module.mjs";

function makeFakeDocument() {
  const loaded = [];
  return {
    loaded,
    querySelector(selector) {
      const match = selector.match(/\[data-classic-runtime="(.+)"\]/);
      if (!match) return null;
      return loaded.includes(match[1]) ? {} : null;
    },
    createElement() {
      const listeners = new Map();
      return {
        dataset: {},
        addEventListener(type, handler) {
          listeners.set(type, handler);
        },
        trigger(type) {
          listeners.get(type)?.();
        },
      };
    },
    body: {
      appendChild(script) {
        loaded.push(script.dataset.classicRuntime);
        script.trigger("load");
      },
    },
  };
}

function makeBundleFailureDocument() {
  const fakeDocument = makeFakeDocument();
  fakeDocument.body.appendChild = function appendChild(script) {
    fakeDocument.loaded.push(script.dataset.classicRuntime);
    if (script.dataset.classicRuntime === CLASSIC_RUNTIME_BUNDLE_PATH) {
      script.trigger("error");
      return;
    }
    script.trigger("load");
  };
  return fakeDocument;
}

test("loadClassicRuntime prefers bundle without falling back to per-script load", async () => {
  const previousDocument = global.document;
  const fakeDocument = makeFakeDocument();
  global.document = fakeDocument;
  try {
    const result = await loadClassicRuntime();
    assert.equal(result.mode, "bundle");
    assert.deepEqual(result.loaded, [CLASSIC_RUNTIME_BUNDLE_PATH]);
    assert.deepEqual(fakeDocument.loaded, [CLASSIC_RUNTIME_BUNDLE_PATH]);
  } finally {
    global.document = previousDocument;
  }
});

test("loadClassicRuntime falls back to per-script loading only when explicitly allowed", async () => {
  const previousDocument = global.document;
  const fakeDocument = makeBundleFailureDocument();
  global.document = fakeDocument;
  try {
    const result = await loadClassicRuntime({ allowScriptFallback: true });
    assert.equal(result.mode, "scripts");
    assert.deepEqual(result.loaded, CLASSIC_RUNTIME_SCRIPT_PATHS);
    assert.equal(fakeDocument.loaded[0], CLASSIC_RUNTIME_BUNDLE_PATH);
    assert.deepEqual(fakeDocument.loaded.slice(1), CLASSIC_RUNTIME_SCRIPT_PATHS);
  } finally {
    global.document = previousDocument;
  }
});

test("loadClassicRuntime fails fast when bundle load fails without explicit fallback", async () => {
  const previousDocument = global.document;
  const fakeDocument = makeBundleFailureDocument();
  global.document = fakeDocument;
  try {
    await assert.rejects(
      () => loadClassicRuntime(),
      /Classic runtime bundle load failed: scripts\/generated\/classic-runtime\.bundle\.js/,
    );
    assert.deepEqual(fakeDocument.loaded, [CLASSIC_RUNTIME_BUNDLE_PATH]);
  } finally {
    global.document = previousDocument;
  }
});
