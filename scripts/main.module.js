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

const probeSections = {
  config: {
    warning: "Config module probe is out of sync with legacy config constants.",
    legacy: () => globalThis.NindouConfig || {},
    summarize: summarizeConfigConstants,
  },
  weapons: {
    warning: "Weapon module probe is out of sync with legacy weaponDefinitions.",
    legacy: () => globalThis.NindouWeapons?.definitions || [],
    summarize: summarizeWeaponCatalog,
  },
  ninjutsu: {
    warning: "Ninjutsu module probe is out of sync with legacy ninjuCatalog.",
    legacy: () => globalThis.NindouNinjutsu?.catalog || [],
    summarize: summarizeNinjutsuCatalog,
  },
  locales: {
    warning: "Locales module probe is out of sync with legacy roomLocaleText.",
    legacy: () => globalThis.NindouLocales?.localeText || {},
    summarize: summarizeLocaleCatalog,
  },
  ruleModes: {
    warning: "Rule modes module probe is out of sync with legacy modeRuleProfiles.",
    legacy: () => globalThis.NindouRuleModes?.modeRuleProfiles || {},
    summarize: summarizeRuleModeProfiles,
  },
  maps: {
    warning: "Map module probe is out of sync with legacy mapObjectBuilders.",
    legacy: () => globalThis.NindouMaps?.mapObjectBuilders || {},
    summarize: summarizeMapObjectBuilders,
  },
  assets: {
    warning: "Asset module probe is out of sync with legacy asset data.",
    legacy: () => globalThis.NindouAssets || {},
    summarize: summarizeAssetCatalog,
  },
  appearance: {
    warning: "Appearance module probe is out of sync with legacy appearance helpers.",
    legacy: () => globalThis.NindouAppearance || {},
    summarize: summarizeAppearanceHelpers,
  },
  stateHelpers: {
    warning: "State helper module probe is out of sync with legacy state helpers.",
    legacy: () => globalThis.NindouStateHelpers || {},
    summarize: summarizeStateHelpers,
  },
  grid: {
    warning: "Grid module probe is out of sync with legacy grid helpers.",
    legacy: () => globalThis.NindouGrid || {},
    summarize: summarizeGridHelpers,
  },
  audio: {
    warning: "Audio module probe is out of sync with legacy audio helpers.",
    legacy: () => globalThis.NindouAudio || {},
    summarize: summarizeAudioHelpers,
  },
  match: {
    warning: "Match module probe is out of sync with legacy match flow.",
    legacy: () => globalThis.NindouMatch || {},
    summarize: summarizeMatchFlow,
  },
  consumables: {
    warning: "Consumables module probe is out of sync with legacy consumable helpers.",
    legacy: () => globalThis.NindouConsumables || {},
    summarize: summarizeConsumableHelpers,
  },
  movement: {
    warning: "Movement module probe is out of sync with legacy movement helpers.",
    legacy: () => globalThis.NindouMovement || {},
    summarize: summarizeMovementHelpers,
  },
  ai: {
    warning: "AI module probe is out of sync with legacy AI profile helpers.",
    legacy: () => globalThis.NindouAi || {},
    summarize: summarizeAiProfileHelpers,
  },
  combat: {
    warning: "Combat module probe is out of sync with legacy combat helpers.",
    legacy: () => globalThis.NindouCombat || {},
    summarize: summarizeCombatHelpers,
  },
};

globalThis.NindouModuleProbe = Object.fromEntries(
  Object.entries(probeSections).map(([key, section]) => [key, section.summarize(section.legacy())]),
);

const probeKeys = Object.keys(globalThis.NindouModuleProbe);
const unsyncedProbeKeys = probeKeys.filter((key) => !globalThis.NindouModuleProbe[key]?.isSynced).sort();
const syncedProbeKeys = probeKeys.filter((key) => globalThis.NindouModuleProbe[key]?.isSynced).sort();
globalThis.NindouModuleProbeMeta = {
  version: 1,
  sectionKeys: probeKeys,
  sectionCount: probeKeys.length,
  syncedCount: syncedProbeKeys.length,
  unsyncedCount: unsyncedProbeKeys.length,
  generatedAt: new Date().toISOString(),
};
globalThis.NindouModuleProbeWarnings = unsyncedProbeKeys.map((key) => ({
  key,
  warning: probeSections[key]?.warning || `Module probe is out of sync: ${key}`,
}));
globalThis.NindouModuleProbeSummary = {
  total: probeKeys.length,
  synced: probeKeys.length - unsyncedProbeKeys.length,
  unsynced: unsyncedProbeKeys.length,
  syncedKeys: syncedProbeKeys,
  unsyncedKeys: unsyncedProbeKeys,
};
globalThis.isNindouModuleProbeSynced = unsyncedProbeKeys.length === 0;
globalThis.getNindouModuleProbeReport = (options = {}) => {
  const includeProbe = options.includeProbe !== false || options.keysOnly === true;
  const includeMeta = options.includeMeta !== false;
  const onlyUnsynced = options.onlyUnsynced === true;
  const keysOnly = options.keysOnly === true;
  const probePayload = onlyUnsynced
    ? Object.fromEntries(
      globalThis.NindouModuleProbeSummary.unsyncedKeys.map((key) => [key, globalThis.NindouModuleProbe[key]]),
    )
    : globalThis.NindouModuleProbe;
  const normalizedProbe = keysOnly
    ? Object.keys(probePayload)
    : probePayload;
  return {
    optionsUsed: { includeMeta, includeProbe, onlyUnsynced, keysOnly },
    ...(includeMeta ? { meta: globalThis.NindouModuleProbeMeta } : {}),
    summary: globalThis.NindouModuleProbeSummary,
    warnings: globalThis.NindouModuleProbeWarnings,
    ...(includeProbe ? { probe: normalizedProbe } : {}),
  };
};

for (const entry of globalThis.NindouModuleProbeWarnings) {
  console.warn(entry.warning);
}
