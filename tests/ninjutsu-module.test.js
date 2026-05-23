const assert = require("node:assert/strict");
const test = require("node:test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { contextValue, loadCombatRules, plain } = require("./helpers/script-loader");

const repoRoot = path.resolve(__dirname, "..");

test("ninjutsu ES module stays in sync with legacy ninjutsu data", async () => {
  const context = loadCombatRules();
  const modulePath = pathToFileURL(path.join(repoRoot, "scripts", "data", "ninjutsu-definitions.module.mjs")).href;
  const ninjutsuModule = await import(modulePath);

  const legacyCatalog = contextValue(context, "ninjuCatalog");
  const summary = ninjutsuModule.summarizeNinjutsuCatalog(legacyCatalog);

  assert.equal(summary.isSynced, true);
  assert.deepEqual(ninjutsuModule.ninjuCatalog, plain(legacyCatalog));
  assert.deepEqual(ninjutsuModule.ninjuEditorCatalog, plain(contextValue(context, "ninjuEditorCatalog")));
  assert.deepEqual(ninjutsuModule.defaultNinjuLoadout, plain(contextValue(context, "defaultNinjuLoadout")));
  assert.deepEqual(ninjutsuModule.ninjuByType.clone, plain(contextValue(context, "ninjuByType.clone")));
});
