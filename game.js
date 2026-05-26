// ===== DOM / Canvas =====
const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statusEl = document.querySelector("#status");
const unitInfoEl = document.querySelector("#unitInfo");
const skillFillEl = document.querySelector("#skillFill");
const resetBtn = document.querySelector("#resetBtn");
const battleStartBtn = document.querySelector("#battleStartBtn");
const roomMapSelect = document.querySelector("#roomMapSelect");
const musicVolumeInput = document.querySelector("#musicVolume");
const sfxVolumeInput = document.querySelector("#sfxVolume");
const ruleModeSelect = document.querySelector("#ruleModeSelect");
const deathModeSelect = document.querySelector("#deathModeSelect");
const teamEditBtn = document.querySelector("#teamEditBtn");
const teamShopBtn = document.querySelector("#teamShopBtn");
const roomShopEl = document.querySelector("#roomShop");
const roomShopCloseBtn = document.querySelector("#roomShopClose");
const roomShopItemEls = Array.from(document.querySelectorAll(".room-shop-item"));
const roomShopBagSlotEls = Array.from(document.querySelectorAll(".room-shop-bag > div"));
const ninjuEditorEl = document.querySelector("#ninjuEditor");
const ninjuEditorSlotsEl = document.querySelector("#ninjuEditorSlots");
const ninjuEditorListEl = document.querySelector("#ninjuEditorList");
const ninjuEditorResetBtn = document.querySelector("#ninjuEditorReset");
const ninjuEditorCancelBtn = document.querySelector("#ninjuEditorCancel");
const ninjuEditorSaveBtn = document.querySelector("#ninjuEditorSave");
const roomCardEls = Array.from(document.querySelectorAll(".room-player-card"));
const weaponSelectEls = Array.from(document.querySelectorAll(".room-weapon-select"));
const controlSelectEls = Array.from(document.querySelectorAll(".room-control-select"));
const lookSelectEls = Array.from(document.querySelectorAll(".room-look-select"));
const hpInputEls = Array.from(document.querySelectorAll(".room-hp-input"));
const skillInputEls = Array.from(document.querySelectorAll(".room-skill-input"));
const roomSkillInputMax = 9999;

// ===== Runtime State =====
const state = {
  inRoom: true,
  roomMapKey: defaultRoomMapKey,
  units: [],
  selectedId: 1,
  pointer: { x: 0, y: 0, cell: null },
  pressedUnit: null,
  pressTime: 0,
  dragMoved: false,
  charging: false,
  message: "準備完成",
  gameOver: false,
  countdownStart: 0,
  matchStart: 0,
  matchEnd: 0,
  result: null,
  resultClickableAt: 0,
  startSoundPlayed: false,
  endSoundPlayed: false,
  endSoundInstance: null,
  pulse: 0,
  lastFrame: performance.now(),
  projectiles: [],
  ninjuDamageEffects: [],
  consumableEffects: [],
  moneyDartCasts: [],
  cloneDecoys: [],
  ruleModeKey: "original",
  deathModeKey: "death_heal",
  roomItemSlots: [],
  onRoomInventoryChanged: null,
};

globalThis.NindouRuntimeState = {
  getState: () => state,
  getGrid: () => grid,
  getSelectedNinjuLoadout: () => selectedNinjuLoadout,
  setSelectedNinjuLoadout: (loadout) => {
    selectedNinjuLoadout = Array.isArray(loadout) ? [...loadout] : selectedNinjuLoadout;
  },
  getEditNinjuDraft: () => editNinjuDraft,
  setEditNinjuDraft: (draft) => {
    editNinjuDraft = Array.isArray(draft) ? [...draft] : editNinjuDraft;
  },
  getEditNinjuSlotIndex: () => editNinjuSlotIndex,
  setEditNinjuSlotIndex: (index) => {
    if (Number.isInteger(index)) editNinjuSlotIndex = index;
  },
};

const ninjuLoadoutStorageKey = "nindou2.ninjuLoadout";
let selectedNinjuLoadout = loadSavedNinjuLoadout();
let editNinjuDraft = [...selectedNinjuLoadout];
let editNinjuSlotIndex = 0;
let restartHoldStartedAt = 0;
let restartHoldTriggered = false;

// ===== Main Loop =====
// 主遊戲迴圈，更新狀態並依序繪製全部畫面。
function draw(now = performance.now()) {
  try {
    const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
    state.lastFrame = now;
    state.pulse += dt;
    updateMatchState(now);
    if (isMatchActive()) {
      updateCharging(dt);
      updateConsumables(now);
      updateNinju(now);
      updateAi(dt, now);
      updateProjectiles(now);
    }
    updateRestartHold(now);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackdrop();
    drawBoard();
    drawMapMaskOverlay();
    drawDrag();
    drawMapObjects();
    drawMoveTrails(now);
    drawUnits();
    drawNinjuEffects(now);
    drawMoneyDartShootAnimations(now);
    drawProjectiles(now);
    drawAttacks();
    drawGameHud();
    drawNinjuBar();
    drawFrame();
    drawCountdownOverlay(now);
    drawResultOverlay();
    updatePanel();
  } catch (error) {
    console.error("Render loop recovered", error);
    state.moneyDartCasts = [];
    state.projectiles = [];
    state.ninjuDamageEffects = [];
    state.consumableEffects = [];
  } finally {
    requestAnimationFrame(draw);
  }
}

