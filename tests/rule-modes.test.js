const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCombatRules, loadCoreRules, plain } = require("./helpers/script-loader");

test("modified 模式使用調整後的武器與忍術數值", () => {
  const context = loadCoreRules();

  assert.equal(context.currentRuleModeKey(), "modified");
  assert.equal(context.weaponDamageForMode("weapon4", 999), 40);
  assert.equal(context.weaponDamageForMode("unknown", 33), 33);
  assert.deepEqual(plain(context.steelRule()), {
    cost: 6,
    castDurationMs: 1500,
    durationMs: 15000,
    defenseMultiplier: 1.7,
  });
  assert.equal(context.moneyDartRule().damage, 70);
  assert.equal(context.moneyDartRule().cost, 0);
  assert.equal(context.moneyDartRule().readyMs, 200);
  assert.equal(context.attackNinjuRule("flash").cost, 0);
  assert.equal(context.attackNinjuRule("wildfire").cost, 0);
  assert.equal(context.attackNinjuRule("angel").damage, 100);
  assert.equal(context.attackNinjuRule("mouryo").damage, 145);
  assert.equal(context.specialNinjuRule("seven").damage, 130);
  assert.equal(context.specialNinjuRule("clone").cost, 10);
  assert.equal(context.healNinjuRule("kakki").cost, 6);
  assert.equal(context.healNinjuRule("genki").effect, "steelNoDefense");
});

test("original 模式使用原版覆蓋數值", () => {
  const context = loadCoreRules({ state: { useOriginalMode: true } });

  assert.equal(context.currentRuleModeKey(), "original");
  assert.equal(context.weaponDamageForMode("weapon4", 999), 50);
  assert.equal(context.weaponDamageForMode("weapon6", 999), 25);
  assert.equal(context.steelRule().cost, 7);
  assert.equal(context.steelRule().defenseMultiplier, 2);
  assert.equal(context.moneyDartRule().damage, 100);
});

test("n3 模式有獨立入口且目前數值同原版", () => {
  const context = loadCoreRules({ state: { ruleModeKey: "n3" } });

  assert.equal(context.currentRuleModeKey(), "n3");
  assert.equal(context.weaponDamageForMode("weapon4", 999), 50);
  assert.equal(context.weaponDamageForMode("weapon6", 999), 25);
  assert.equal(context.steelRule().cost, 7);
  assert.equal(context.moneyDartRule().damage, 100);
  assert.equal(context.specialNinjuRule("clone").cost, 10);

  const n3SteelRule = context.steelRule();
  context.state.ruleModeKey = "original";
  const originalSteelRule = context.steelRule();

  assert.notEqual(n3SteelRule, originalSteelRule);
  n3SteelRule.cost = 8;
  assert.equal(originalSteelRule.cost, 7);
});

test("極惡城地圖使用專屬戰鬥配樂", () => {
  const context = loadCombatRules({ state: { roomMapKey: "evil-castle-1", units: [], objects: [], projectiles: [], moneyDartCasts: [] } });

  assert.equal(
    plain(context.currentRoomMapDefinition()).battleBgmSrc,
    "assets/sounds/bgm/忍2鬼島戰鬥.mp3"
  );
});
