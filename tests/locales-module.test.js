const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, loadCombatRules, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

test("locales ES module stays in sync with legacy locale data", async () => {
  const context = loadCombatRules();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "locales.module.mjs")).href;
  const localesModule = await import(modulePath);

  const legacyLocale = contextValue(context, "roomLocaleText");
  const summary = localesModule.summarizeLocaleCatalog(legacyLocale);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(localesModule.roomLocaleText, plain(legacyLocale));
  assert.deepEqual(localesModule.roomControlModeLabels, plain(contextValue(context, "roomControlModeLabels")));
  assert.equal(localesModule.localizedControlModeLabel("ai_tachi_master"), contextValue(context, 'localizedControlModeLabel("ai_tachi_master")'));
  assert.equal(localesModule.localizedNinjuTypeLabel("clone"), contextValue(context, 'localizedNinjuTypeLabel("clone")'));
  assert.equal(localesModule.localizedCountdownText(0), contextValue(context, "localizedCountdownText(0)"));
  assert.equal(localesModule.localizedRuleModeLabel("modified"), contextValue(context, 'localizedRuleModeLabel("modified")'));
  assert.equal(localesModule.localizedDeathModeLabel("death_heal"), contextValue(context, 'localizedDeathModeLabel("death_heal")'));
});
