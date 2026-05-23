const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repoRoot = path.resolve(__dirname, "..", "..");

function createGameContext(overrides = {}) {
  const context = {
    console,
    Math,
    performance: { now: () => 0 },
    state: { useOriginalMode: false, units: [], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    setMessage: () => {},
    playSound: () => null,
    checkVictory: () => {},
    attackNinjuConfigs: {},
    specialNinjuConfigs: {},
    ...overrides,
  };
  Object.defineProperty(context, "__testOverrides", { value: overrides });
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
  Object.assign(context, context.__testOverrides || {});
  return context;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function contextValue(context, expression) {
  return vm.runInContext(expression, context);
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
    "scripts/data/ninjutsu-definitions.js",
    "scripts/data/locales.js",
    "scripts/data/rule-modes.js",
    "scripts/systems/grid.js",
    "scripts/systems/state-helpers.js",
    "scripts/systems/ninjutsu.js",
    "scripts/systems/consumables.js",
    "scripts/systems/combat.js",
  ]);
}

function loadAiRules(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/weapons.js",
    "scripts/data/ninjutsu-definitions.js",
    "scripts/data/locales.js",
    "scripts/data/rule-modes.js",
    "scripts/systems/grid.js",
    "scripts/systems/state-helpers.js",
    "scripts/systems/ninjutsu.js",
    "scripts/systems/consumables.js",
    "scripts/systems/combat.js",
    "scripts/systems/movement.js",
    "scripts/systems/ai.js",
  ]);
}

module.exports = {
  contextValue,
  createGameContext,
  loadAiRules,
  loadCombatRules,
  loadCoreRules,
  loadScripts,
  plain,
};
