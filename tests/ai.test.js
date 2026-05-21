const test = require("node:test");
const assert = require("node:assert/strict");

const { loadAiRules } = require("./helpers/script-loader");

test("AI赤組可無視技與魂直接施放野火或急凍", () => {
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon8",
    moveT: 1,
    aiRedCloneAt: 999999,
    aiRedSteelAt: 999999,
    aiRedAttackAt: 0,
  };
  const enemy = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 7,
    y: 5,
  };
  const context = loadAiRules({
    state: { units: [unit, enemy], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    attackNinjuConfigs: {
      wildfire: { label: "野火" },
      freeze: { label: "急凍" },
    },
  });

  context.tryAiNinjutsu(unit, context.aiProfile(unit), 1000);

  assert.equal(["wildfire", "freeze"].includes(unit.ninju.type), true);
  assert.equal(unit.ninju.attackNinjuLevel, 1);
  assert.equal(unit.skill, 0);
  assert.equal(unit.soulSteps, 0);
});

test("AI赤組被斜角攻擊時可排入溜溜球反擊", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0.8;
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon8",
    weaponReadyAt: 0,
    moveT: 1,
  };
  const attacker = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 6,
    y: 6,
    fromX: 6,
    fromY: 6,
    facing: "left",
    damageTaken: 0,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, attacker], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { wildfire: { label: "野火" }, freeze: { label: "急凍" } },
  });

  assert.equal(context.queueAiRedRetaliation(unit, attacker, 1000), true);
  assert.equal(unit.aiRedPendingAction.type, "weapon");

  context.tryAiRedPendingAction(unit, 1200);

  assert.equal(attacker.hp < 300, true);
  assert.equal(context.state.attacks.length, 1);
});

test("AI赤組在直線上會依距離排入延遲撞擊", () => {
  const randomMath = Object.create(Math);
  randomMath.random = () => 0.2;
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 2,
    y: 5,
    fromX: 2,
    fromY: 5,
    facing: "right",
    weaponKey: "weapon8",
    moveT: 1,
    aiNextThink: 0,
  };
  const target = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
  };
  const context = loadAiRules({
    Math: randomMath,
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [] },
    attackNinjuConfigs: { wildfire: { label: "野火" }, freeze: { label: "急凍" } },
  });

  assert.equal(context.tryAiRedCombatAction(unit, target, 1000), true);
  assert.equal(unit.aiRedPendingAction.type, "ram");
  assert.equal(unit.aiRedPendingAction.executeAt, 1700);
});

test("AI赤組敵人在九宮格內時會使用溜溜球攻擊", () => {
  const unit = {
    id: 1,
    name: "red1",
    team: "blue",
    alive: true,
    hp: 300,
    maxHp: 300,
    controlMode: "ai_red",
    skill: 0,
    soulSteps: 0,
    x: 5,
    y: 5,
    fromX: 5,
    fromY: 5,
    facing: "down",
    weaponKey: "weapon8",
    weaponReadyAt: 0,
    moveT: 1,
    damageDone: 0,
  };
  const target = {
    id: 2,
    name: "blue1",
    team: "grey",
    alive: true,
    hp: 300,
    maxHp: 300,
    x: 6,
    y: 6,
    fromX: 6,
    fromY: 6,
    damageTaken: 0,
  };
  const context = loadAiRules({
    state: { units: [unit, target], objects: [], projectiles: [], moneyDartCasts: [], cloneDecoys: [], attacks: [] },
    attackNinjuConfigs: { wildfire: { label: "野火" }, freeze: { label: "急凍" } },
  });

  assert.equal(context.tryAiRedCombatAction(unit, target, 1000), true);

  assert.equal(target.hp < 300, true);
  assert.equal(context.state.attacks.length, 1);
  assert.equal(unit.aiRedPendingAction, undefined);
});
