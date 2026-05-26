import test from "node:test";
import assert from "node:assert/strict";

import { installRoomUiGlobals } from "../scripts/bootstrap/install-room-ui-globals.module.mjs";

function element({ value = "", dataset = {}, hidden = true } = {}) {
  const children = [];
  return {
    value,
    dataset,
    hidden,
    innerHTML: "",
    textContent: "",
    src: "",
    alt: "",
    style: { display: "", fontSize: "", setProperty() {} },
    className: "",
    type: "",
    children,
    listeners: {},
    classList: {
      add(name) { this[name] = true; },
      remove(name) { this[name] = false; },
    },
    setAttribute(name, nextValue) { this[name] = nextValue; },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    appendChild(child) { children.push(child); },
    replaceChildren() { children.length = 0; },
  };
}

function baseTarget(overrides = {}) {
  const state = { ruleModeKey: "original", deathModeKey: "death_heal", roomMapKey: "country-10", roomItemSlots: [] };
  const storage = new Map();
  const selectors = new Map();
  const allSelectors = new Map();
  const target = {
    document: {
      documentElement: { lang: "" },
      querySelector: (selector) => selectors.get(selector) || null,
      querySelectorAll: (selector) => allSelectors.get(selector) || [],
      createElement: () => element({ hidden: false }),
    },
    window: { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } },
    NindouRuntimeState: {
      getState: () => state,
      getSelectedNinjuLoadout: () => target.selected,
      setSelectedNinjuLoadout: (value) => { target.selected = value; },
      getEditNinjuDraft: () => target.draft,
      setEditNinjuDraft: (value) => { target.draft = value; },
      getEditNinjuSlotIndex: () => target.slotIndex,
      setEditNinjuSlotIndex: (value) => { target.slotIndex = value; },
    },
    selected: ["heal1", null, null, null, null, null],
    draft: ["heal1", null, null, null, null, null],
    slotIndex: 0,
    defaultNinjuLoadout: ["heal1", "support1", null, null, null, null],
    ninjuByType: { heal1: { type: "heal1", label: "Heal", group: "heal", editorRow: "1" }, support1: { type: "support1", label: "Support", group: "support", editorRow: "2" } },
    ninjuEditorCatalog: [{ type: "support1", label: "Support", group: "support", editorRow: "2", editorOrder: 2 }],
    localizedNinjuLabel: (ninju) => ninju.label,
    localizedNinjuFontSize: (size) => size,
    roomLocale: () => ({ emptySlot: "Empty", mapSelect: "Map" }),
    defaultRoomMapKey: "country-10",
    roomMapDefinitions: { "country-10": { label: "Country" } },
    roomMapDefinitionEntries: () => [["country-10", { label: "Country" }]],
    localizedRuleModeLabel: (mode) => mode,
    localizedDeathModeLabel: (mode) => mode,
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    maxHp: 300,
    maxSkill: 18,
    ...overrides,
  };
  target.__selectors = selectors;
  target.__allSelectors = allSelectors;
  target.__storage = storage;
  return target;
}

test("installRoomUiGlobals provides saved loadout before game.js initializes runtime state", () => {
  const target = baseTarget({ NindouRuntimeState: undefined });
  target.__storage.set("nindou2.ninjuLoadout", JSON.stringify(["heal1", null, "support1", null, null, null]));
  installRoomUiGlobals(target);

  assert.deepEqual(target.loadSavedNinjuLoadout(), ["heal1", null, "support1", null, null, null]);
  assert.deepEqual(target.normalizedNinjuLoadout(["bad", "support1"]), [null, "support1", null, null, null, null]);
  assert.equal(typeof target.NindouRoomUi.renderNinjuEditor, "function");
});

test("room UI editor writes through the runtime state bridge", () => {
  const slots = element();
  const list = element();
  const editor = element({ hidden: true });
  const target = baseTarget();
  target.__selectors.set("#ninjuEditorSlots", slots);
  target.__selectors.set("#ninjuEditorList", list);
  target.__selectors.set("#ninjuEditor", editor);

  installRoomUiGlobals(target);
  target.openNinjuEditor();

  assert.equal(editor.hidden, false);
  assert.deepEqual(target.draft, target.selected);
  assert.equal(slots.children.length, 6);
  assert.equal(list.children.length, 1);

  list.children[0].listeners.click();
  assert.equal(target.draft.includes("support1"), true);
  target.saveNinjuEditor();
  assert.deepEqual(target.selected, ["heal1", "support1", null, null, null, null]);
  assert.equal(editor.hidden, true);
});

test("selected room values are resolved from live DOM controls", () => {
  const control = element({ value: "ai_tachi_master", dataset: { team: "blue", slot: "1" } });
  const weapon = element({ value: "weapon2", dataset: { team: "blue", slot: "1" } });
  const hp = element({ value: "450", dataset: { team: "blue", slot: "1" } });
  const skill = element({ value: "30", dataset: { team: "blue", slot: "1" } });
  const target = baseTarget({
    defaultWeaponKey: "weapon1",
    weaponDefinitionByKey: { weapon1: {}, weapon2: {}, weapon3: {} },
  });
  target.__allSelectors.set(".room-control-select", [control]);
  target.__allSelectors.set(".room-weapon-select", [weapon]);
  target.__allSelectors.set(".room-hp-input", [hp]);
  target.__allSelectors.set(".room-skill-input", [skill]);

  installRoomUiGlobals(target);

  assert.equal(target.selectedControlMode("blue", 1), "ai_tachi_master");
  assert.equal(target.selectedWeaponKey("blue", 1), "weapon3");
  assert.equal(target.selectedHpValue("blue", 1), 450);
  assert.equal(target.selectedSkillValue("blue", 1), 30);
});
