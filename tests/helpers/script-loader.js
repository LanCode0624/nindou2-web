const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..", "..");

function createGameContext(overrides = {}) {
  const context = {
    console,
    Math,
    performance: { now: () => 0 },
    state: { useOriginalMode: false, units: [], objects: [], projectiles: [], moneyDartCasts: [] },
    setMessage: () => {},
    playSound: () => null,
    canControlUnit: () => false,
    selectedUnit: () => null,
    clearDragState: () => {},
    cancelDragIfPressed: () => {},
    checkVictory: () => {},
    formatDamage: (value) => String(value),
    gainSoul: (unit, steps) => {
      unit.soulSteps = (unit.soulSteps || 0) + steps;
    },
    ARRIVE_TOTAL: 325,
    attackNinjuConfigs: {},
    ...overrides,
  };
  return vm.createContext(context);
}

function loadScript(context, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const code = fs.readFileSync(absolutePath, "utf8");
  vm.runInContext(code, context, { filename: relativePath });
  return context;
}

function loadScripts(context, relativePaths) {
  for (const relativePath of relativePaths) {
    loadScript(context, relativePath);
  }
  return context;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadCoreRules(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/rule-modes.js",
  ]);
}

function loadCombatRules(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/weapons.js",
    "scripts/data/rule-modes.js",
    "scripts/systems/grid.js",
    "scripts/systems/ninjutsu.js",
    "scripts/systems/combat.js",
  ]);
}

module.exports = {
  createGameContext,
  loadCombatRules,
  loadCoreRules,
  loadScripts,
  plain,
};
