// Rule-mode profiles for modified and original balance values.
// Future weapon / ninjutsu differences should be configured here.
const modeRuleProfiles = {
  modified: {
    weapons: {
      weapon4: { damage: 40 }, // 伊賀密刀
      weapon6: { damage: 13 }, // 鐵扇不知火
      weapon7: { damage: 70 }, // 極冰鬼切丸
      weapon8: { damage: 20 }, // 伊賀溜溜球
    },
    ninjutsu: ninjutsuRuleProfiles.modified,
  },
  original: {
    weapons: {
      weapon4: { damage: 50 }, // 伊賀密刀
      weapon6: { damage: 25 }, // 鐵扇不知火
      weapon8: { damage: 50 }, // 伊賀溜溜球
    },
    ninjutsu: ninjutsuRuleProfiles.original,
  },
};

function currentRuleModeKey() {
  if (typeof state !== "undefined" && typeof state?.ruleModeKey === "string") {
    if (state.ruleModeKey === "modified") return "modified";
    return "original";
  }
  if (typeof state !== "undefined" && state?.useOriginalMode) return "original";
  return "modified";
}

function currentRuleProfile() {
  const modeKey = currentRuleModeKey();
  return modeRuleProfiles[modeKey] || modeRuleProfiles.modified;
}

function currentDeathModeKey() {
  if (typeof state !== "undefined" && typeof state?.deathModeKey === "string") {
    return state.deathModeKey === "death_heal" ? "death_heal" : "death_command";
  }
  return "death_heal";
}

function weaponDamageForMode(weaponKey, fallbackDamage) {
  const weaponRule = currentRuleProfile().weapons?.[weaponKey];
  return weaponRule?.damage ?? fallbackDamage;
}

function steelRule() {
  return currentRuleProfile().ninjutsu?.steel || {};
}

function hotBloodRule() {
  return currentRuleProfile().ninjutsu?.hotBlood || {};
}

function healNinjuRule(type) {
  const baseRule = currentRuleProfile().ninjutsu?.[type] || {};
  if (type !== "genki" && type !== "kakki" && type !== "shinki") return baseRule;
  const deathModeKey = currentDeathModeKey();
  if (deathModeKey === "death_heal") {
    if (type === "genki" && currentRuleModeKey() === "modified") {
      const healRule = modeRuleProfiles.original?.ninjutsu?.genki || {};
      return {
        ...healRule,
        available: true,
      };
    }
    return {
      ...baseRule,
      available: true,
    };
  }
  if (type === "genki" && currentRuleModeKey() === "modified") {
    return {
      ...baseRule,
      available: baseRule.available !== false,
    };
  }
  return {
    ...baseRule,
    available: false,
  };
}

function specialNinjuRule(type) {
  return currentRuleProfile().ninjutsu?.[type] || {};
}

function moneyDartRule() {
  return currentRuleProfile().ninjutsu?.moneyDart || {};
}

function flashRule() {
  return attackNinjuRule("flash");
}

function wildfireRule() {
  return attackNinjuRule("wildfire");
}

function deathRule() {
  return attackNinjuRule("death");
}

function freezeRule() {
  return attackNinjuRule("freeze");
}

function attackNinjuRule(type) {
  return currentRuleProfile().ninjutsu?.[type] || {};
}

globalThis.NindouRuleModes = {
  modeRuleProfiles,
  currentRuleModeKey,
  currentDeathModeKey,
  weaponDamageForMode,
  steelRule,
  hotBloodRule,
  healNinjuRule,
  specialNinjuRule,
  moneyDartRule,
  attackNinjuRule,
};
