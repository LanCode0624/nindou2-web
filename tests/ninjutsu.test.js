const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCombatRules, plain } = require("./helpers/script-loader");

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
  for (const type of ["angel", "mouryo"]) {
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

test("clone ninjutsu teleports the caster and creates two pass-through decoys", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 180,
    maxHp: 300,
    controlMode: "ai_red",
    appearanceKey: "red",
    steelUntil: 4000,
    hotBloodUntil: 0,
    buffAuraType: "steel",
    skill: 20,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
  };
  const randomValues = [0, 0, 0];
  const testMath = Object.create(Math);
  testMath.random = () => randomValues.shift() ?? 0;
  const context = loadCombatRules({
    Math: testMath,
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
    specialNinjuConfigs: { clone: { label: "分身" } },
  });

  context.useSpecialNinju("clone");

  assert.equal(unit.skill, 10);
  assert.equal(unit.ninju.type, "clone");

  context.triggerSpecialNinju(unit, "clone", 1000);

  assert.notDeepEqual({ x: unit.x, y: unit.y }, { x: 5, y: 5 });
  assert.equal(context.state.cloneDecoys.length, 2);
  assert.equal(context.state.cloneDecoys.some((decoy) => decoy.x === 5 && decoy.y === 5), false);
  assert.equal(
    context.state.cloneDecoys.every((decoy) => !(decoy.x === unit.x && decoy.y === unit.y)),
    true
  );
  const occupiedCloneCells = new Set([
    `${unit.x},${unit.y}`,
    ...context.state.cloneDecoys.map((decoy) => `${decoy.x},${decoy.y}`),
  ]);
  assert.equal(occupiedCloneCells.size, 3);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.casterId === unit.id), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.moveT === 1 && decoy.fromX === decoy.x && decoy.fromY === decoy.y), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.name === unit.name), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.hp === unit.hp && decoy.maxHp === unit.maxHp), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.controlMode === "ai_red" && decoy.appearanceKey === "red"), true);
  assert.equal(context.state.cloneDecoys.every((decoy) => decoy.steelUntil === unit.steelUntil && decoy.buffAuraType === "steel"), true);
});

test("clone ninjutsu can use map-specific playable bottom row cells", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    x: 5,
    y: 5,
  };
  const context = loadCombatRules({
    state: {
      roomMapKey: "evil-castle-1",
      units: [unit],
      objects: [],
      projectiles: [],
      moneyDartCasts: [],
      cloneDecoys: [],
    },
  });

  assert.equal(
    context.cloneOpenCells(unit).some((cell) => cell.x === 3 && cell.y === 11),
    true
  );
});

test("clone decoys are removed when their caster dies", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    hp: 10,
    maxHp: 10,
    skill: 20,
    soulSteps: 0,
    kills: 0,
    damageDone: 0,
    damageTaken: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
  };
  const attacker = {
    id: 2,
    name: "grey1",
    team: "grey",
    alive: true,
    hp: 10,
    maxHp: 10,
    kills: 0,
    damageDone: 0,
    damageTaken: 0,
    soulSteps: 0,
  };
  const context = loadCombatRules({
    state: {
      units: [unit, attacker],
      objects: [],
      projectiles: [],
      moneyDartCasts: [],
      cloneDecoys: [
        { casterId: 1, x: 4, y: 5 },
        { casterId: 1, x: 6, y: 5 },
        { casterId: 2, x: 8, y: 5 },
      ],
    },
  });

  context.damageUnit(unit, 10, "test", false, attacker);

  assert.equal(unit.alive, false);
  assert.deepEqual(plain(context.state.cloneDecoys), [{ casterId: 2, x: 8, y: 5 }]);
});

test("money dart is not charged twice when it is already queued", () => {
  const unit = {
    id: 1,
    name: "blue1",
    team: "blue",
    alive: true,
    skill: 20,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    ninju: {
      type: "steel",
      phase: "active",
      startedAt: 0,
      duration: 1500,
      queue: 0,
      pendingMoneyDart: true,
    },
  };
  const context = loadCombatRules({
    state: { units: [unit], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    selectedUnit: () => unit,
    canControlUnit: () => true,
  });
  context.moneyDartRule().cost = 5;

  context.useMoneyDart();

  assert.equal(unit.skill, 20);
  assert.equal(unit.ninju.pendingMoneyDart, true);
});
