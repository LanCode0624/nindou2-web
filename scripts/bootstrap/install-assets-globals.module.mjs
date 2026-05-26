import {
  defaultRoomBgmSrc,
  defaultBattleBgmSrc,
  soundSources,
  imageSources,
  lookDefinitions,
  baseTeamLookDefinitions,
  frameSourceCatalog,
  chargeDirFrameSources,
  dragArrowFrameSources,
  movePrearriveFrameSources,
  moveArriveFrameSources,
  useNinjuFrameSources,
  moneyDartReadyFrameSources,
  moneyDartShootFrameSources,
} from "../data/assets.module.mjs";

function createLoopingBgm(src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 0.2;
  return audio;
}

function emptyDirectionFrames() {
  return { right: [], left: [], up: [], down: [] };
}

function emptyNestedFrameBuffers(sourceGroups = {}) {
  return Object.fromEntries(
    Object.keys(sourceGroups).map((key) => [key, emptyDirectionFrames()]),
  );
}

function emptyFlatFrameBuffers(sourceGroups = {}) {
  return Object.fromEntries(
    Object.keys(sourceGroups).map((key) => [key, []]),
  );
}

export function installAssetGlobals(target = globalThis) {
  const roomBgm = createLoopingBgm(defaultRoomBgmSrc);
  const battleBgmsBySrc = {};
  const bgmBySrc = (src) => {
    const key = src || defaultBattleBgmSrc;
    if (!battleBgmsBySrc[key]) battleBgmsBySrc[key] = createLoopingBgm(key);
    if (typeof target.musicVolumeInput !== "undefined" && target.musicVolumeInput) {
      battleBgmsBySrc[key].volume = Number(target.musicVolumeInput.value) / 100;
    }
    return battleBgmsBySrc[key];
  };
  const defaultBattleBgm = bgmBySrc(defaultBattleBgmSrc);

  const images = {};
  const sounds = Object.fromEntries(Object.entries(soundSources).map(([key, src]) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = 0.2;
    return [key, audio];
  }));

  const defUpFrameSources = frameSourceCatalog.defUp;
  const atkUpFrameSources = frameSourceCatalog.atkUp;
  const regenHpSmallFrameSources = frameSourceCatalog.regenHpSmall;
  const regenHpLargeFrameSources = frameSourceCatalog.regenHpLarge;
  const consumableRegenSpFrameSources = frameSourceCatalog.consumableRegenSp;
  const smallThunderSummonFrameSources = frameSourceCatalog.smallThunderSummon;
  const smallThunderDamagedFrameSources = frameSourceCatalog.smallThunderDamaged;
  const smallFireSummonFrameSources = frameSourceCatalog.smallFireSummon;
  const smallFireDamagedFrameSources = frameSourceCatalog.smallFireDamaged;
  const deathSummonFrameSources = frameSourceCatalog.deathSummon;
  const deathDamagedFrameSources = frameSourceCatalog.deathDamaged;
  const smallIceSummonFrameSources = frameSourceCatalog.smallIceSummon;
  const smallIceDamagedFrameSources = frameSourceCatalog.smallIceDamaged;
  const smallIceBreakFrameSources = frameSourceCatalog.smallIceBreak;
  const damageFailFrameSources = frameSourceCatalog.damageFail;
  const faintedFrameSources = frameSourceCatalog.fainted;
  const damageSuccessSmallFrameSources = frameSourceCatalog.damageSuccessSmall;
  const damageSuccessMiddleFrameSources = frameSourceCatalog.damageSuccessMiddle;
  const damageSuccessBigFrameSources = frameSourceCatalog.damageSuccessBig;
  const damageSuccessNinjuSuccessFrameSources = frameSourceCatalog.damageSuccessNinjuSuccess;
  const sevenNinjuFrameSources = frameSourceCatalog.sevenNinju;
  const cloneNinjuFrameSources = frameSourceCatalog.cloneNinju;
  const cloneRedNinjuFrameSources = frameSourceCatalog.cloneRedNinju;
  const cloneGreyNinjuFrameSources = frameSourceCatalog.cloneGreyNinju;
  const angelNinjuFrameSources = frameSourceCatalog.angelNinju;
  const mouryoNinjuFrameSources = frameSourceCatalog.mouryoNinju;
  const mouryoNinjuHitFrameSources = frameSourceCatalog.mouryoNinjuHit;
  const chargeRedFrameSources = frameSourceCatalog.chargeRed;
  const chargeYellowFrameSources = frameSourceCatalog.chargeYellow;
  const respawnPointerFrameSources = frameSourceCatalog.respawnPointer;
  const moneyDartPickupFrameSources = frameSourceCatalog.moneyDartPickup;

  const defUpFrames = [];
  const atkUpFrames = [];
  const regenHpSmallFrames = [];
  const regenHpLargeFrames = [];
  const consumableRegenSpFrames = [];
  const smallThunderSummonFrames = [];
  const smallThunderDamagedFrames = [];
  const smallFireSummonFrames = [];
  const smallFireDamagedFrames = [];
  const deathSummonFrames = [];
  const deathDamagedFrames = [];
  const smallIceSummonFrames = [];
  const smallIceDamagedFrames = [];
  const smallIceBreakFrames = [];
  const damageFailFrames = [];
  const faintedFrames = [];
  const damageSuccessSmallFrames = [];
  const damageSuccessMiddleFrames = [];
  const damageSuccessBigFrames = [];
  const damageSuccessNinjuSuccessFrames = [];
  const sevenNinjuFrames = [];
  const cloneNinjuFrames = [];
  const cloneRedNinjuFrames = [];
  const cloneGreyNinjuFrames = [];
  const angelNinjuFrames = [];
  const mouryoNinjuFrames = [];
  const mouryoNinjuHitFrames = [];
  const chargeRedFrames = [];
  const chargeYellowFrames = [];
  const respawnPointerFrames = [];
  const moneyDartPickupFrames = [];

  const chargeDirFrames = {
    b: emptyDirectionFrames(),
    g: emptyDirectionFrames(),
  };
  const dragArrowFrames = emptyDirectionFrames();
  const movePrearriveFrames = emptyNestedFrameBuffers(movePrearriveFrameSources);
  const moveArriveFrames = emptyNestedFrameBuffers(moveArriveFrameSources);
  const useNinjuFrames = emptyFlatFrameBuffers(useNinjuFrameSources);
  const moneyDartReadyFrames = emptyFlatFrameBuffers(moneyDartReadyFrameSources);
  const moneyDartShootFrames = emptyNestedFrameBuffers(moneyDartShootFrameSources);

  const specialNinjuConfigs = {
    seven: {
      label: "七道",
      rule: "seven",
      summonFrames: sevenNinjuFrames,
      hitFrames: [],
      castSound: "sevenNinju",
      castSize: 150,
    },
    clone: {
      label: "分身",
      rule: "clone",
      summonFrames: cloneNinjuFrames,
      hitFrames: [],
      castSize: 70,
    },
  };

  const attackNinjuConfigs = {
    flash: {
      label: "閃光",
      rule: "flashRule",
      summonFrames: smallThunderSummonFrames,
      hitFrames: smallThunderDamagedFrames,
      castSound: "summonSmall",
      hitSound: "smallThunder",
    },
    wildfire: {
      label: "野火",
      rule: "wildfireRule",
      summonFrames: smallFireSummonFrames,
      hitFrames: smallFireDamagedFrames,
      castSound: "summonSmall",
      hitSound: "smallFire",
      outcomes: target.attackNinjuOutcomeTables?.wildfire,
    },
    death: {
      label: "死神",
      rule: "deathRule",
      summonFrames: deathSummonFrames,
      hitFrames: deathDamagedFrames,
      castSound: "summonDeath",
      hitSound: "deathHit",
      outcomes: target.attackNinjuOutcomeTables?.death,
    },
    freeze: {
      label: "急凍",
      rule: "freezeRule",
      summonFrames: smallIceSummonFrames,
      hitFrames: smallIceDamagedFrames,
      castSound: "summonSmall",
      hitSound: "smallIceHit",
      holdHitLastFrame: true,
      breakEffect: "freezeBreak",
      hitBodyEffect: null,
      outcomes: target.attackNinjuOutcomeTables?.freeze,
    },
    angel: {
      label: "天使",
      rule: "angel",
      summonFrames: angelNinjuFrames,
      hitFrames: [],
      castSound: "angelNinju",
      castSize: 150,
    },
    mouryo: {
      label: "魍魎",
      rule: "mouryo",
      summonFrames: mouryoNinjuFrames,
      hitFrames: mouryoNinjuHitFrames,
      castSound: "mouryoNinju",
      hitSound: "mouryoNinju",
      castSize: 150,
    },
  };

  Object.assign(target, {
    roomBgm,
    defaultBattleBgmSrc,
    battleBgmsBySrc,
    bgmBySrc,
    defaultBattleBgm,
    images,
    sounds,
    soundSources,
    imageSources,
    lookDefinitions,
    baseTeamLookDefinitions,
    defUpFrameSources,
    atkUpFrameSources,
    regenHpSmallFrameSources,
    regenHpLargeFrameSources,
    consumableRegenSpFrameSources,
    smallThunderSummonFrameSources,
    smallThunderDamagedFrameSources,
    smallFireSummonFrameSources,
    smallFireDamagedFrameSources,
    deathSummonFrameSources,
    deathDamagedFrameSources,
    smallIceSummonFrameSources,
    smallIceDamagedFrameSources,
    smallIceBreakFrameSources,
    damageFailFrameSources,
    faintedFrameSources,
    damageSuccessSmallFrameSources,
    damageSuccessMiddleFrameSources,
    damageSuccessBigFrameSources,
    damageSuccessNinjuSuccessFrameSources,
    sevenNinjuFrameSources,
    cloneNinjuFrameSources,
    cloneRedNinjuFrameSources,
    cloneGreyNinjuFrameSources,
    angelNinjuFrameSources,
    mouryoNinjuFrameSources,
    mouryoNinjuHitFrameSources,
    chargeRedFrameSources,
    chargeYellowFrameSources,
    respawnPointerFrameSources,
    moneyDartPickupFrameSources,
    defUpFrames,
    atkUpFrames,
    regenHpSmallFrames,
    regenHpLargeFrames,
    consumableRegenSpFrames,
    smallThunderSummonFrames,
    smallThunderDamagedFrames,
    smallFireSummonFrames,
    smallFireDamagedFrames,
    deathSummonFrames,
    deathDamagedFrames,
    smallIceSummonFrames,
    smallIceDamagedFrames,
    smallIceBreakFrames,
    damageFailFrames,
    faintedFrames,
    damageSuccessSmallFrames,
    damageSuccessMiddleFrames,
    damageSuccessBigFrames,
    damageSuccessNinjuSuccessFrames,
    sevenNinjuFrames,
    cloneNinjuFrames,
    cloneRedNinjuFrames,
    cloneGreyNinjuFrames,
    angelNinjuFrames,
    mouryoNinjuFrames,
    mouryoNinjuHitFrames,
    chargeRedFrames,
    chargeYellowFrames,
    respawnPointerFrames,
    moneyDartPickupFrames,
    chargeDirFrameSources,
    chargeDirFrames,
    dragArrowFrameSources,
    dragArrowFrames,
    movePrearriveFrameSources,
    movePrearriveFrames,
    moveArriveFrameSources,
    moveArriveFrames,
    useNinjuFrameSources,
    useNinjuFrames,
    moneyDartReadyFrameSources,
    moneyDartReadyFrames,
    moneyDartShootFrameSources,
    moneyDartShootFrames,
    specialNinjuConfigs,
    attackNinjuConfigs,
  });

  target.NindouAssets = {
    defaultRoomBgmSrc,
    defaultBattleBgmSrc,
    soundSources,
    imageSources,
    lookDefinitions,
    baseTeamLookDefinitions,
    frameSourceCatalog,
    chargeDirFrameSources,
    dragArrowFrameSources,
    movePrearriveFrameSources,
    moveArriveFrameSources,
    useNinjuFrameSources,
    moneyDartReadyFrameSources,
    moneyDartShootFrameSources,
    specialNinjuConfigs,
    attackNinjuConfigs,
  };
}
