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

// ===== Input =====
// 處理滑鼠按下：忍術按鈕、選角色、攻擊或開始拖曳。
function pointerDown(event) {
  if (state.inRoom) return;
  if (state.result) {
    if (performance.now() < (state.resultClickableAt || 0)) return;
    returnToRoomFromResult();
    return;
  }
  startBgm();
  pointerMove(event);
  if (!isMatchActive()) return;
  const cell = state.pointer.cell;
  for (let index = 0; index < 10; index++) {
    if (pointInRect(state.pointer.x, state.pointer.y, itemSlotRect(index))) {
      useItemSlot(index);
      return;
    }
  }
  for (const button of currentNinjuButtonList()) {
    if (pointInRect(state.pointer.x, state.pointer.y, button)) {
      useNinjuByType(button.type);
      return;
    }
  }
  if (!cell || state.gameOver) return;

  const unitRaw = unitAt(cell.x, cell.y);
  // 移動動畫播放中視為不可點擊，等動畫結束才能再次操作。
  const unitMoving = unitRaw && unitRaw.moveTrail && (performance.now() - unitRaw.moveTrail.startedAt) < ARRIVE_TOTAL;
  const unit = unitMoving ? null : unitRaw;
  const selected = selectedUnit();
  state.pressedUnit = unit && canControlUnit(unit) && !unit.moneyDart ? unit : null;
  state.pressTime = performance.now();
  state.dragMoved = false;
  state.charging = false;

  if (selected && selected.moneyDart) {
    if (cell.x !== selected.x || cell.y !== selected.y) {
      throwMoneyDart(selected, cell);
    } else {
      setMessage(`${selected.name}：請選擇上、下、左、右其中一個方向丟出錢鏢。`);
    }
    return;
  }

  if (unit && canControlUnit(unit)) {
    state.selectedId = unit.id;
    setMessage(`${unit.name}：請持續按住以累積技量。`);
    return;
  }

  if (unit && selected && unit.team !== selected.team) {
    if (manhattan(selected, unit) === 1) {
      attack(selected, unit);
    } else {
      attackAimedWeapon(selected, cell);
    }
    return;
  }

  if (selected && (cell.x !== selected.x || cell.y !== selected.y)) {
    attackAimedWeapon(selected, cell);
    return;
  }

  setMessage("移動必須先按住角色集氣，再拖到目標格。");
}
// 處理滑鼠移動並更新目前指向的格子。
function pointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = (event.clientX - rect.left) * canvas.width / rect.width;
  state.pointer.y = (event.clientY - rect.top) * canvas.height / rect.height;
  state.pointer.cell = pointToCell(state.pointer.x, state.pointer.y);

  const lookUnit = state.pressedUnit || selectedUnit();
  if (lookUnit && canControlUnit(lookUnit) && lookUnit.alive && !isUnitDisabled(lookUnit)) {
    updateFacingFromPointer(lookUnit);
  }

  if (!state.pressedUnit || !event.buttons) return;
  const start = cellCenter(state.pressedUnit.x, state.pressedUnit.y);
  const dx = state.pointer.x - start.x;
  const dy = state.pointer.y - start.y;
  if (Math.hypot(dx, dy) > 12) {
    state.dragMoved = true;
  }
}

// 處理滑鼠放開，決定是否執行拖曳移動。
function pointerUp(event) {
  startBgm();
  pointerMove(event);
  const cell = state.pressedUnit ? dragMoveTargetCell(state.pressedUnit) : null;
  if (state.charging && state.dragMoved && state.pressedUnit && cell) {
    skillMove(state.pressedUnit, cell);
  } else if (state.pressedUnit) {
    setMessage(`${state.pressedUnit.name}：已集到 ${state.pressedUnit.skill.toFixed(1)} 技。`);
  }

  state.pressedUnit = null;
  state.dragMoved = false;
  state.charging = false;
}

canvas.addEventListener("pointerdown", pointerDown);
canvas.addEventListener("pointermove", pointerMove);
window.addEventListener("pointerup", pointerUp);
window.addEventListener("keydown", startRestartHold);
window.addEventListener("keyup", stopRestartHold);
resetBtn.addEventListener("click", resetGame);
resetBtn.addEventListener("click", startBgm);
setupRuleModeSelect();
setupDeathModeSelect();
setupWeaponSelects();
setupControlSelects();
setupHpInputs();
setupSkillInputs();
setupRoomSlots();
if (battleStartBtn) battleStartBtn.addEventListener("click", startBattleFromRoom);
if (teamEditBtn) teamEditBtn.addEventListener("click", openNinjuEditor);
if (teamShopBtn) teamShopBtn.addEventListener("click", openRoomShop);
if (roomShopCloseBtn) roomShopCloseBtn.addEventListener("click", closeRoomShop);
roomShopItemEls.forEach((itemEl) => itemEl.addEventListener("click", () => purchaseShopItem(itemEl)));
roomShopBagSlotEls.forEach((slotEl, index) => slotEl.addEventListener("click", () => removeRoomShopBagItem(index)));
if (ninjuEditorResetBtn) ninjuEditorResetBtn.addEventListener("click", resetNinjuEditorLoadout);
if (ninjuEditorCancelBtn) ninjuEditorCancelBtn.addEventListener("click", closeNinjuEditor);
if (ninjuEditorSaveBtn) ninjuEditorSaveBtn.addEventListener("click", saveNinjuEditor);
if (musicVolumeInput) musicVolumeInput.addEventListener("input", applyVolumeControls);
if (sfxVolumeInput) sfxVolumeInput.addEventListener("input", applyVolumeControls);
if (ruleModeSelect) ruleModeSelect.addEventListener("change", (event) => setRuleMode(event.target.value));
if (deathModeSelect) deathModeSelect.addEventListener("change", (event) => {
  state.deathModeKey = event.target.value || "death_heal";
  updateDeathModeUi();
});
if (roomMapSelect) roomMapSelect.addEventListener("change", (event) => setRoomMap(event.target.value));
window.addEventListener("keydown", startBgm, { once: true });

state.onRoomInventoryChanged = renderRoomShopBag;
applyRoomLanguage();

loadImages().then(() => {
  updateRuleModeUi();
  updateDeathModeUi();
  updateRoomMapUi();
  applyVolumeControls();
  resetGame();
  startBgm();
  draw();
});

