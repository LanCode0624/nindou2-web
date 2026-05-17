const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCombatRules } = require("./helpers/script-loader");

test("attack ninjutsu can be used at soul 1 even without skill", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 0,
    soulSteps: 27,
  };
  const context = loadCombatRules({
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    attackNinjuConfigs: { wildfire: { label: "野火" } },
  });

  context.useAttackNinju("wildfire");

  assert.equal(unit.skill, 0);
  assert.equal(unit.soulSteps, 0);
  assert.equal(unit.ninju.type, "wildfire");
  assert.equal(unit.ninju.attackNinjuLevel, 1);
});

test("attack ninjutsu is blocked below soul 1", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 10,
    soulSteps: 26,
  };
  const context = loadCombatRules({
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    attackNinjuConfigs: { death: { label: "死神" } },
  });

  context.useAttackNinju("death");

  assert.equal(unit.skill, 10);
  assert.equal(unit.soulSteps, 26);
  assert.equal(unit.ninju, undefined);
});

test("ported attack ninjutsu spend soul instead of skill", () => {
  for (const type of ["angel", "mouryo", "butsu"]) {
    const unit = {
      id: 1,
      name: "blue1",
      team: "blue",
      alive: true,
      skill: 0,
      soulSteps: 27,
    };
    const context = loadCombatRules({
      state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [] },
      selectedUnit: () => unit,
      canControlUnit: () => true,
      attackNinjuConfigs: { [type]: { label: type } },
    });

    context.useAttackNinju(type);

    assert.equal(unit.skill, 0);
    assert.equal(unit.soulSteps, 0);
    assert.equal(unit.ninju.type, type);
    assert.equal(unit.ninju.attackNinjuLevel, 1);
  }
});
