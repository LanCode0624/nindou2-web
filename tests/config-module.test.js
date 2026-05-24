const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, createGameContext, loadScripts, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

test("config ES module stays in sync with legacy config constants", async () => {
  const context = loadScripts(createGameContext(), [
    "scripts/data/config.js",
  ]);
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "config.module.mjs")).href;
  const configModule = await import(modulePath);
  const legacyConfig = contextValue(context, "globalThis.NindouConfig");
  const summary = configModule.summarizeConfigConstants(legacyConfig);

  assert.equal(summary.isSynced, true);
  assert.equal(configModule.weaponCooldownMs, contextValue(context, "weaponCooldownMs"));
  assert.equal(configModule.weaponDamage, contextValue(context, "weaponDamage"));
  assert.equal(configModule.objectHp, contextValue(context, "objectHp"));
  assert.equal(configModule.maxSkill, contextValue(context, "maxSkill"));
  assert.deepEqual(configModule.ninjutsuRuleProfiles, plain(contextValue(context, "ninjutsuRuleProfiles")));
});

test("config bridge section is generated from module workflow", () => {
  const fs = require("node:fs");
  const configText = fs.readFileSync(path.join(repoRoot, "scripts", "data", "config.js"), "utf8");
  assert.equal(configText.includes("// NINDOU_CONFIG_BRIDGE_START"), true);
  assert.equal(configText.includes("// NINDOU_CONFIG_BRIDGE_END"), true);
  assert.equal(configText.includes("Run: npm run sync:config-nindou"), true);
});
