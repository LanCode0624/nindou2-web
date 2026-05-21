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
    canControlUnit: () => false,
    selectedUnit: () => null,
    clearDragState: () => {},
    cancelDragIfPressed: () => {},
    activeMoneyDartCast: () => null,
    checkVictory: () => {},
    formatDamage: (value) => String(value),
    updateFacing: (unit, target) => {
      if (!unit || !target) return;
      if (target.x > unit.x) unit.facing = "right";
      else if (target.x < unit.x) unit.facing = "left";
      else if (target.y > unit.y) unit.facing = "down";
      else if (target.y < unit.y) unit.facing = "up";
    },
    directionFromTarget: (from, target) => {
      if (!from || !target) return null;
      const dx = target.x - from.x;
      const dy = target.y - from.y;
      if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) return { name: dx > 0 ? "right" : "left", dx: Math.sign(dx), dy: 0 };
      if (dy !== 0) return { name: dy > 0 ? "down" : "up", dx: 0, dy: Math.sign(dy) };
      return null;
    },
    gainSoul: (unit, steps) => {
      unit.soulSteps = (unit.soulSteps || 0) + steps;
    },
    ARRIVE_TOTAL: 325,
    attackNinjuConfigs: {},
    specialNinjuConfigs: {},
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

function loadAiRules(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/data/weapons.js",
    "scripts/data/rule-modes.js",
    "scripts/systems/grid.js",
    "scripts/systems/ninjutsu.js",
    "scripts/systems/combat.js",
    "scripts/systems/movement.js",
    "scripts/systems/ai.js",
  ]);
}

module.exports = {
  createGameContext,
  loadAiRules,
  loadCombatRules,
  loadCoreRules,
  loadScripts,
  plain,
};
