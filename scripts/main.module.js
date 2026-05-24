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

const probeSections = [
  ["config", "Config module probe is out of sync with legacy config constants."],
  ["weapons", "Weapon module probe is out of sync with legacy weaponDefinitions."],
  ["ninjutsu", "Ninjutsu module probe is out of sync with legacy ninjuCatalog."],
  ["locales", "Locales module probe is out of sync with legacy roomLocaleText."],
  ["ruleModes", "Rule modes module probe is out of sync with legacy modeRuleProfiles."],
  ["maps", "Map module probe is out of sync with legacy mapObjectBuilders."],
  ["assets", "Asset module probe is out of sync with legacy asset data."],
  ["appearance", "Appearance module probe is out of sync with legacy appearance helpers."],
  ["stateHelpers", "State helper module probe is out of sync with legacy state helpers."],
  ["grid", "Grid module probe is out of sync with legacy grid helpers."],
  ["audio", "Audio module probe is out of sync with legacy audio helpers."],
  ["match", "Match module probe is out of sync with legacy match flow."],
  ["consumables", "Consumables module probe is out of sync with legacy consumable helpers."],
  ["movement", "Movement module probe is out of sync with legacy movement helpers."],
  ["ai", "AI module probe is out of sync with legacy AI profile helpers."],
  ["combat", "Combat module probe is out of sync with legacy combat helpers."],
];

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

for (const [key, warning] of probeSections) {
  if (!globalThis.NindouModuleProbe[key]?.isSynced) {
    console.warn(warning);
  }
}
