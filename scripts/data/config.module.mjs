// Keep this module small while the runtime still uses classic scripts.
export const weaponCooldownMs = 1000;
export const weaponDamage = 50;
export const objectHp = 100;
export const maxSkill = 18;
export const tachiMasterSkillMax = 18;
export const soulStepsPerLevel = 27;
export const soulMaxLevel = 4;
export const ninjuFollowupMoveAllowance = 3;
export const moneyDartButtonRect = { x: 508, y: 600, w: 65, h: 30 };
export const steelButtonRect = { x: 582, y: 600, w: 65, h: 30 };
export const hotBloodButtonRect = { x: 656, y: 600, w: 65, h: 30 };
export const genkiButtonRect = { x: 730, y: 600, w: 65, h: 30 };
export const kakkiButtonRect = { x: 804, y: 600, w: 65, h: 30 };
export const shinkiButtonRect = { x: 878, y: 600, w: 65, h: 30 };
export const itemSlotStartX = 510;
export const itemSlotY = 558;
export const itemSlotW = 38;
export const itemSlotH = 34;
export const itemSlotGap = 6;
export const defaultConsumableDisableMs = 1500;
export const defaultConsumableInvincibleMs = 1500;
export const sake4MoveSkillFreeMs = 15000;

export const ninjutsuRuleProfiles = {
  modified: {
    moneyDart: {
      cost: 0,
      damage: 70,
      readyMs: 200,
      postThrowNinjuLockMs: 200,
    },
    steel: {
      cost: 6,
      castDurationMs: 1500,
      durationMs: 15000,
      defenseMultiplier: 1.7,
    },
    hotBlood: {
      cost: 6,
      castDurationMs: 1500,
      durationMs: 15000,
      weaponDamageMultiplier: 2,
    },
    genki: {
      cost: 2,
      castDurationMs: 1500,
      healAmount: 0,
      effect: "steelNoDefense",
    },
    kakki: {
      available: false,
      cost: 6,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "selfHeal",
    },
    shinki: {
      available: false,
      cost: 10,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "teamHeal",
    },
    flash: {
      cost: 0, // 閃光
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    wildfire: {
      cost: 0,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    death: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    freeze: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.35,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 10000,
    },
    angel: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 100,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    mouryo: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 145,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    seven: {
      cost: 7,
      castDurationMs: 1720,
      damage: 130,
    },
    clone: {
      cost: 10,
      castDurationMs: 1600,
    },
  },
  original: {
    moneyDart: {
      cost: 0,
      damage: 100,
      readyMs: 250,
      postThrowNinjuLockMs: 250,
    },
    steel: {
      cost: 7,
      castDurationMs: 1500,
      durationMs: 15000,
      defenseMultiplier: 2,
    },
    hotBlood: {
      cost: 7,
      castDurationMs: 1500,
      durationMs: 15000,
      weaponDamageMultiplier: 2,
    },
    genki: {
      available: false,
      cost: 3,
      castDurationMs: 1500,
      healAmount: 50,
      effect: "selfHeal",
    },
    kakki: {
      available: false,
      cost: 6,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "selfHeal",
    },
    shinki: {
      available: false,
      cost: 10,
      castDurationMs: 1500,
      healAmount: 100,
      effect: "teamHeal",
    },
    flash: {
      cost: 0,
      castDurationMs: 1500,
      hitChance: 0.3,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    wildfire: {
      cost: 0,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    death: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.6,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    freeze: {
      cost: 7,
      castDurationMs: 1500,
      hitChance: 0.35,
      damage: 50,
      missDisableMs: 1500,
      hitDisableMs: 10000,
    },
    angel: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 100,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    mouryo: {
      cost: 7,
      castDurationMs: 1720,
      hitChance: 0.6,
      damage: 145,
      missDisableMs: 1500,
      hitDisableMs: 3500,
    },
    seven: {
      cost: 7,
      castDurationMs: 1720,
      damage: 130,
    },
    clone: {
      cost: 10,
      castDurationMs: 1600,
    },
  },
};

export const attackNinjuOutcomeTables = {
  wildfire: [
    { chance: 0.3, damage: 50, headEffect: "flashHitHead" },
    { chance: 0.2, damage: 100, headEffect: "wildfireMiddleHitHead" },
  ],
  death: [
    { chance: 0.0, damage: 9999, headEffect: "flashHitHead" },
    { chance: 0.0, damage: 9999, headEffect: "deathMiddleHitHead" },
    { chance: 0.0, damage: 9999, headEffect: "deathBigHitHead" },
    { chance: 0.08, damage: 9999, headEffect: "deathNinjuSuccess" },
  ],
  freeze: [
    { chance: 0.35, damage: 50, headEffect: "flashHitHead", hitDisableMs: 10000 },
  ],
};

export function summarizeConfigConstants(legacy = {}) {
  const moduleResult = {
    weaponCooldownMs,
    weaponDamage,
    objectHp,
    maxSkill,
    tachiMasterSkillMax,
    soulStepsPerLevel,
    soulMaxLevel,
    ninjuFollowupMoveAllowance,
    ninjutsuModes: Object.keys(ninjutsuRuleProfiles),
    modifiedNinjutsuKeys: Object.keys(ninjutsuRuleProfiles.modified || {}),
    originalNinjutsuKeys: Object.keys(ninjutsuRuleProfiles.original || {}),
  };
  const legacyResult = {
    weaponCooldownMs: legacy.weaponCooldownMs,
    weaponDamage: legacy.weaponDamage,
    objectHp: legacy.objectHp,
    maxSkill: legacy.maxSkill,
    tachiMasterSkillMax: legacy.tachiMasterSkillMax,
    soulStepsPerLevel: legacy.soulStepsPerLevel,
    soulMaxLevel: legacy.soulMaxLevel,
    ninjuFollowupMoveAllowance: legacy.ninjuFollowupMoveAllowance,
    ninjutsuModes: Object.keys(legacy.ninjutsuRuleProfiles || {}),
    modifiedNinjutsuKeys: Object.keys(legacy.ninjutsuRuleProfiles?.modified || {}),
    originalNinjutsuKeys: Object.keys(legacy.ninjutsuRuleProfiles?.original || {}),
  };
  return {
    moduleResult,
    legacyResult,
    isSynced: JSON.stringify(moduleResult) === JSON.stringify(legacyResult),
  };
}

