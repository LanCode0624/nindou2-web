// Shared gameplay constants. Keep this file data-only so it can move to Phaser later.
const grid = {
  cols: 22,
  rows: 12,
  cell: 44.5, // 地圖整體縮放：數字變大會等比例放大背景格、物件、角色位置。
  left: -9, // 地圖整體 X 位置：數字變大往右；放大後可用負數讓左右平均裁切。
  top: 5, // 地圖整體 Y 位置：數字變大往下；目前讓上排樹貼近上緣。
};
const battleMapDrawInset = {
  left: 5, // 地圖背景左邊界：數字越小越往左。
  top: 5, // 地圖背景上邊界：數字越小越往上，讓上方 HUD 蓋在地圖物件上。
  right: 5, // 地圖背景右邊界：數字越小越往右。
  bottom: 5, // 地圖背景下邊界：數字越小越往下。
};
const defaultRoomMapKey = "evil-castle-1";
const roomMapDefinitions = {
  "country-10": {
    label: "鄉野之十",
    groundImageKey: "arena",
    fallbackImageKey: "bg",
    objectLayout: "country-10",
    coordinateBottomInternalY: 10,
    playableInternalYMin: 1,
    playableInternalYMax: 10,
  },
  "evil-castle-1": {
    label: "極惡城之一",
    groundImageKey: "evilCastleGround",
    maskImageKey: "evilCastleMask",
    battleBgmSrc: "assets/sounds/bgm/忍2鬼島戰鬥.mp3",
    objectLayout: "evil-castle-1",
    coordinateBottomInternalY: 11,
    playableInternalYMin: 2,
    playableInternalYMax: 11,
    blockedDisplayCells: ["1,1", "18,1", "1,10", "18,10", "1,18", "18,18"],
    startingDisplayCellsBySlot: {
      blue: {
        1: { x: 9, y: 3 },
        2: { x: 8, y: 1 },
        3: { x: 9, y: 1 },
        4: { x: 10, y: 1 },
      },
      grey: {
        1: { x: 6, y: 9 },
        2: { x: 8, y: 8 },
        3: { x: 11, y: 8 },
        4: { x: 13, y: 9 },
      },
    },
  },
};

function roomMapDefinitionEntries() {
  return Object.entries(roomMapDefinitions);
}

const maxSkill = 18; // 18
const holdSeconds = 0;
const chargePerSecond = 18 / 6.5;
const maxHp = 300;
const weaponDamage = 50;
const collisionDamage = 40; //衝撞傷害
const weaponCooldownMs = 1000;
const objectHp = 100;
const respawnMs = 3000;
const respawnPointerDuration = 1000;
const playerUnitId = 1;
const unitsPerTeam = 3;
const aiSkillRegenPerSecond = 0.42;
const soulStepsPerLevel = 27;
const soulMaxLevel = 4;
const soulCombatGainSteps = soulStepsPerLevel / 5;
const soulDeathGainSteps = soulStepsPerLevel;
const ninjuChainGap = 500;
const ninjuChainMaxGap = 500;
const ninjuFollowupMoveAllowance = 2;
const mapItemDropChance = 0.4;
const mapItemDropTypes = ["chest", "vase", "barrel", "hay"];
const mapGoldDropTypes = ["hay"];
const itemSlotStartX = 510;
const itemSlotY = 558;
const itemSlotW = 38;
const itemSlotH = 34;
const itemSlotGap = 6;

const moneyDartButtonRect = { x: 508, y: 600, w: 65, h: 30 };
const steelButtonRect = { x: 582, y: 600, w: 65, h: 30 };
const hotBloodButtonRect = { x: 656, y: 600, w: 65, h: 30 };
const genkiButtonRect = { x: 730, y: 600, w: 65, h: 30 };
const kakkiButtonRect = { x: 804, y: 600, w: 65, h: 30 };
const shinkiButtonRect = { x: 878, y: 600, w: 65, h: 30 };

const ninjutsuRuleProfiles = {
  modified: {
    moneyDart: {
      cost: 0,
      damage: 70,
      readyMs: 200,
      postThrowNinjuLockMs: 200,
      speed: 1500,
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
      speed: 1500,
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
ninjutsuRuleProfiles.n3 = JSON.parse(JSON.stringify(ninjutsuRuleProfiles.original));

const attackNinjuOutcomeTables = {
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
const countdownTotalMs = 2500;

const ui = {
  top: 0,
  bottomTop: 542,
  bottomHeight: 138,
  leftPanelW: 446,
  midX: 446,
};

const startingAreas = {
  // Internal grid coordinates. Display coordinates are converted elsewhere.
  blue: { xMin: 2, xMax: 3, yMin: 3, yMax: 7 },
  grey: { xMin: 16, xMax: 17, yMin: 3, yMax: 7 },
};
