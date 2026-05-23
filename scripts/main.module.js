import { summarizeConfigConstants } from "./data/config.module.mjs";
import { summarizeWeaponCatalog } from "./data/weapons.module.mjs";
import { summarizeNinjutsuCatalog } from "./data/ninjutsu-definitions.module.mjs";
import { summarizeLocaleCatalog } from "./data/locales.module.mjs";
import { summarizeRuleModeProfiles } from "./data/rule-modes.module.mjs";
import { summarizeMapObjectBuilders } from "./data/map.module.mjs";
import { summarizeAssetCatalog } from "./data/assets.module.mjs";
import { summarizeAppearanceHelpers } from "./systems/appearance.module.mjs";
import { summarizeStateHelpers } from "./systems/state-helpers.module.mjs";
import { summarizeGridHelpers } from "./systems/grid.module.mjs";
import { summarizeAudioHelpers } from "./systems/audio.module.mjs";
import { summarizeMatchFlow } from "./systems/match.module.mjs";
import { summarizeConsumableHelpers } from "./systems/consumables.module.mjs";
import { summarizeMovementHelpers } from "./systems/movement.module.mjs";
import { summarizeAiProfileHelpers } from "./systems/ai.module.mjs";
import { summarizeCombatHelpers } from "./systems/combat.module.mjs";

const legacyConfig = globalThis.NindouConfig || {};
const legacyWeapons = globalThis.NindouWeapons?.definitions || [];
const legacyNinjutsu = globalThis.NindouNinjutsu?.catalog || [];
const legacyLocale = globalThis.NindouLocales?.localeText || {};
const legacyRuleModes = globalThis.NindouRuleModes?.modeRuleProfiles || {};
const legacyMaps = globalThis.NindouMaps?.mapObjectBuilders || {};
const legacyAssets = globalThis.NindouAssets || {};
const legacyAppearance = globalThis.NindouAppearance || {};
const legacyStateHelpers = globalThis.NindouStateHelpers || {};
const legacyGrid = globalThis.NindouGrid || {};
const legacyAudio = globalThis.NindouAudio || {};
const legacyMatch = globalThis.NindouMatch || {};
const legacyConsumables = globalThis.NindouConsumables || {};
const legacyMovement = globalThis.NindouMovement || {};
const legacyAi = globalThis.NindouAi || {};
const legacyCombat = globalThis.NindouCombat || {};
globalThis.NindouModuleProbe = {
  config: summarizeConfigConstants(legacyConfig),
  weapons: summarizeWeaponCatalog(legacyWeapons),
  ninjutsu: summarizeNinjutsuCatalog(legacyNinjutsu),
  locales: summarizeLocaleCatalog(legacyLocale),
  ruleModes: summarizeRuleModeProfiles(legacyRuleModes),
  maps: summarizeMapObjectBuilders(legacyMaps),
  assets: summarizeAssetCatalog(legacyAssets),
  appearance: summarizeAppearanceHelpers(legacyAppearance),
  stateHelpers: summarizeStateHelpers(legacyStateHelpers),
  grid: summarizeGridHelpers(legacyGrid),
  audio: summarizeAudioHelpers(legacyAudio),
  match: summarizeMatchFlow(legacyMatch),
  consumables: summarizeConsumableHelpers(legacyConsumables),
  movement: summarizeMovementHelpers(legacyMovement),
  ai: summarizeAiProfileHelpers(legacyAi),
  combat: summarizeCombatHelpers(legacyCombat),
};

if (!globalThis.NindouModuleProbe.config.isSynced) {
  console.warn("Config module probe is out of sync with legacy config constants.");
}
if (!globalThis.NindouModuleProbe.weapons.isSynced) {
  console.warn("Weapon module probe is out of sync with legacy weaponDefinitions.");
}
if (!globalThis.NindouModuleProbe.ninjutsu.isSynced) {
  console.warn("Ninjutsu module probe is out of sync with legacy ninjuCatalog.");
}
if (!globalThis.NindouModuleProbe.locales.isSynced) {
  console.warn("Locales module probe is out of sync with legacy roomLocaleText.");
}
if (!globalThis.NindouModuleProbe.ruleModes.isSynced) {
  console.warn("Rule modes module probe is out of sync with legacy modeRuleProfiles.");
}
if (!globalThis.NindouModuleProbe.maps.isSynced) {
  console.warn("Map module probe is out of sync with legacy mapObjectBuilders.");
}
if (!globalThis.NindouModuleProbe.assets.isSynced) {
  console.warn("Asset module probe is out of sync with legacy asset data.");
}
if (!globalThis.NindouModuleProbe.appearance.isSynced) {
  console.warn("Appearance module probe is out of sync with legacy appearance helpers.");
}
if (!globalThis.NindouModuleProbe.stateHelpers.isSynced) {
  console.warn("State helper module probe is out of sync with legacy state helpers.");
}
if (!globalThis.NindouModuleProbe.grid.isSynced) {
  console.warn("Grid module probe is out of sync with legacy grid helpers.");
}
if (!globalThis.NindouModuleProbe.audio.isSynced) {
  console.warn("Audio module probe is out of sync with legacy audio helpers.");
}
if (!globalThis.NindouModuleProbe.match.isSynced) {
  console.warn("Match module probe is out of sync with legacy match flow.");
}
if (!globalThis.NindouModuleProbe.consumables.isSynced) {
  console.warn("Consumables module probe is out of sync with legacy consumable helpers.");
}
if (!globalThis.NindouModuleProbe.movement.isSynced) {
  console.warn("Movement module probe is out of sync with legacy movement helpers.");
}
if (!globalThis.NindouModuleProbe.ai.isSynced) {
  console.warn("AI module probe is out of sync with legacy AI profile helpers.");
}
if (!globalThis.NindouModuleProbe.combat.isSynced) {
  console.warn("Combat module probe is out of sync with legacy combat helpers.");
}
