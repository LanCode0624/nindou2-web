const test = require("node:test");
const assert = require("node:assert/strict");

const { loadCoreRules, plain } = require("./helpers/script-loader");

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
