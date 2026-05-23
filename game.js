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

// ===== Game Setup =====
// 重設一局遊戲的角色、地圖物件、倒數與狀態。
function resetGame() {
  const now = performance.now();
  const keepRoomState = state.inRoom;
  state.objects = buildMapObjects();
  state.units = buildStartingUnits();
  applyRoomInventoryToPlayerUnit();
  state.attacks = [];
  state.projectiles = [];
  state.ninjuDamageEffects = [];
  state.consumableEffects = [];
  state.moneyDartCasts = [];
  state.cloneDecoys = [];
  state.selectedId = 1;
  state.pressedUnit = null;
  state.dragMoved = false;
  state.charging = false;
  state.gameOver = false;
  state.countdownStart = 0;
  state.matchStart = now;
  state.matchEnd = 0;
  state.result = null;
  state.resultClickableAt = 0;
  state.startSoundPlayed = true;
  state.endSoundPlayed = false;
  state.endSoundInstance = null;
  state.inRoom = keepRoomState;
  setMessage("開始。");
  updatePanel();
}

// 建立一個角色資料物件，包含血量、技、AI 與統計資料。
function makeUnit(id, name, team, x, y, weaponKey = defaultWeaponKey, controlMode = "ai_beginner", hpMax = maxHp, initialSkill = null, appearanceKey = "default") {
  const aiNextThink = controlMode === "player" ? 0 : performance.now() + 520 + Math.random() * 500;
  const facing = controlMode === "ai_red" ? "down" : (team === "blue" ? "right" : "left");
  const defaultSkillMax = controlMode === "ai_tachi_master" ? tachiMasterSkillMax : maxSkill;
  const requestedSkill = Math.round(Number.isFinite(initialSkill) ? initialSkill : defaultSkillMax);
  const skillMax = Math.max(defaultSkillMax, clamp(requestedSkill, 0, roomSkillInputMax));
  const skill = clamp(requestedSkill, 0, skillMax);
  return { id, name, team, x, y, hp: hpMax, maxHp: hpMax, skill, skillMax, soulSteps: 0, gold: 0, items: {}, itemSlots: [], facing, alive: true, moveT: 1, fromX: x, fromY: y, moveTrail: null, hitFlash: 0, respawning: false, respawnTipUntil: 0, aiNextThink, aiActionAt: 0, aiPlanKey: "", ninju: null, consumableUse: null, steelUntil: 0, hotBloodUntil: 0, buffAuraType: "", disabledUntil: 0, invincibleUntil: 0, moveSkillFreeUntil: 0, moneyDart: null, ninjuLockedUntil: 0, weaponKey, controlMode, weaponReadyAt: 0, kills: 0, damageDone: 0, damageTaken: 0, appearanceKey };
}

// 依照兩隊起始範圍隨機產生本局角色位置。
function buildStartingUnits() {
  const units = [];
  let id = 1;
  const mapStartingDisplayCellsBySlot = currentRoomMapDefinition().startingDisplayCellsBySlot || null;
  const addTeam = (team, label) => {
    const activeSlots = roomCardEls
      .filter((card) => card.classList.contains("active-slot") && card.dataset.team === team)
      .map((card) => Number(card.dataset.slot))
      .sort((a, b) => a - b);
    const fallbackCells = shuffledCellsInArea(startingAreas[team]).filter((cell) => !isBlockedCell(cell.x, cell.y) && !units.some((unit) => unit.x === cell.x && unit.y === cell.y));
    for (const slot of activeSlots) {
      const displayCell = mapStartingDisplayCellsBySlot?.[team]?.[slot];
      const fixedCell = displayCell ? internalCellCoord(displayCell) : null;
      const cell = fixedCell && !isBlockedCell(fixedCell.x, fixedCell.y) && !units.some((unit) => unit.x === fixedCell.x && unit.y === fixedCell.y)
        ? fixedCell
        : fallbackCells.find((candidate) => !units.some((unit) => unit.x === candidate.x && unit.y === candidate.y));
      if (!cell) continue;
      const controlMode = selectedControlMode(team, slot);
      const weaponKey = selectedWeaponKey(team, slot);
      const appearanceKey = selectedLookKey(team, slot);
      units.push(makeUnit(
        id,
        `${label}${slot}`,
        team,
        cell.x,
        cell.y,
        weaponKey,
        controlMode,
        selectedHpValue(team, slot),
        selectedSkillValue(team, slot),
        appearanceKey,
      ));
      id += 1;
    }
  };

  addTeam("blue", "青");
  addTeam("grey", "灰");
  return units;
}

function applyRoomLanguage() {
  const text = roomLocale();
  const roomScreenEl = document.querySelector("#roomScreen");
  const roomTitleLabelEl = document.querySelector(".room-title-cell span");
  const roomLeaveBtn = document.querySelector(".room-leave-btn");
  const teamTabsEl = document.querySelector(".team-tabs");
  const teamTabBlueEl = document.querySelector(".team-tab-blue");
  const teamTabGreyEl = document.querySelector(".team-tab-grey");
  const playerGridEl = document.querySelector(".player-grid");
  const battleStartImgEl = battleStartBtn?.querySelector("img");
  const chatPanelEl = document.querySelector(".chat-panel");
  const chatChannelEl = document.querySelector(".chat-input span");
  const chatSendBtn = document.querySelector(".chat-input button");
  const modePanelEl = document.querySelector(".mode-panel");
  const modeTitleEl = document.querySelector(".mode-title");
  const modeSideAEl = document.querySelector(".mode-side.side-a");
  const modeSideBEl = document.querySelector(".mode-side.side-b");
  const volumePanelEl = document.querySelector(".room-volume-panel");
  const volumeLabels = Array.from(document.querySelectorAll(".room-volume-control span"));
  const ninjuProfileRows = Array.from(document.querySelectorAll(".ninju-editor-stats > div"));
  const ninjuScoreRows = Array.from(document.querySelectorAll(".ninju-editor-score > div"));
  const ninjuTabButtons = Array.from(document.querySelectorAll(".ninju-editor-tabs button"));
  const ninjuSeriesEls = Array.from(document.querySelectorAll(".ninju-editor-series span"));
  const ninjuTitleSpanEl = document.querySelector(".ninju-editor-title span");
  const ninjuInfoBtn = document.querySelector(".ninju-editor-title button");

  document.documentElement.lang = text.htmlLang;
  if (roomScreenEl) roomScreenEl.setAttribute("aria-label", text.roomScreen);
  setupRuleModeSelect();
  setupDeathModeSelect();
  if (roomTitleLabelEl) roomTitleLabelEl.textContent = text.modeLabel;
  if (roomLeaveBtn) roomLeaveBtn.setAttribute("aria-label", text.leave);
  if (teamTabsEl) teamTabsEl.setAttribute("aria-label", text.teams);
  if (teamEditBtn) {
    teamEditBtn.textContent = text.edit;
    teamEditBtn.setAttribute("aria-label", text.editNinjutsu);
  }
  if (teamShopBtn) {
    teamShopBtn.textContent = text.shop;
    teamShopBtn.setAttribute("aria-label", text.shopAria);
  }
  if (roomShopEl) {
    roomShopEl.setAttribute("aria-label", text.shopAria);
    const shopTitleEl = roomShopEl.querySelector(".room-shop-header h2");
    const shopTotalEl = roomShopEl.querySelector(".room-shop-footer span");
    if (shopTitleEl) shopTitleEl.textContent = text.shopTitle;
    if (shopTotalEl) shopTotalEl.textContent = text.shopTotal;
  }
  if (teamTabBlueEl) teamTabBlueEl.textContent = text.blueTeam;
  if (teamTabGreyEl) teamTabGreyEl.textContent = text.greyTeam;
  if (playerGridEl) playerGridEl.setAttribute("aria-label", text.playerCards);
  if (battleStartBtn) battleStartBtn.setAttribute("aria-label", text.startBattle);
  if (battleStartImgEl) battleStartImgEl.alt = text.startBattle;
  setupRoomMapSelect();
  if (chatPanelEl) chatPanelEl.setAttribute("aria-label", text.chat);
  if (chatChannelEl) chatChannelEl.textContent = text.general;
  if (chatSendBtn) chatSendBtn.textContent = text.send;
  if (modePanelEl) modePanelEl.setAttribute("aria-label", text.modePanel);
  if (modeTitleEl) modeTitleEl.textContent = text.randomMode;
  if (modeSideAEl) modeSideAEl.textContent = text.editSettings;
  if (modeSideBEl) modeSideBEl.textContent = text.gameSettings;
  if (volumePanelEl) volumePanelEl.setAttribute("aria-label", text.volume);
  if (volumeLabels[0]) volumeLabels[0].textContent = text.music;
  if (volumeLabels[1]) volumeLabels[1].textContent = text.sfx;
  if (ninjuEditorEl) ninjuEditorEl.setAttribute("aria-label", text.ninjuEditor);
  if (ninjuProfileRows[0]) {
    const spans = ninjuProfileRows[0].querySelectorAll("span");
    const button = ninjuProfileRows[0].querySelector("button");
    if (spans[0]) spans[0].textContent = text.nickname;
    if (button) button.textContent = text.change;
  }
  if (ninjuProfileRows[1]) {
    const spans = ninjuProfileRows[1].querySelectorAll("span");
    const strongs = ninjuProfileRows[1].querySelectorAll("strong");
    if (spans[0]) spans[0].textContent = text.level;
    if (spans[1]) spans[1].textContent = text.role;
    if (strongs[1]) strongs[1].textContent = text.roleName;
  }
  if (ninjuProfileRows[2]) {
    const span = ninjuProfileRows[2].querySelector("span");
    const strong = ninjuProfileRows[2].querySelector("strong");
    if (span) span.textContent = text.guild;
    if (strong) strong.textContent = text.guildName;
  }
  if (ninjuScoreRows[0]) {
    const spans = ninjuScoreRows[0].querySelectorAll("span");
    if (spans[0]) spans[0].textContent = text.wins;
    if (spans[1]) spans[1].textContent = text.losses;
  }
  if (ninjuScoreRows[1]) {
    const span = ninjuScoreRows[1].querySelector("span");
    if (span) span.textContent = text.gold;
  }
  if (ninjuScoreRows[2]) {
    const span = ninjuScoreRows[2].querySelector("span");
    if (span) span.textContent = text.rep;
  }
  const ninjuTabsEl = document.querySelector(".ninju-editor-tabs");
  if (ninjuTabsEl) ninjuTabsEl.setAttribute("aria-label", text.editCategories);
  if (ninjuTabButtons[0]) ninjuTabButtons[0].textContent = text.ninjuTab;
  if (ninjuTabButtons[1]) ninjuTabButtons[1].textContent = text.weaponTab;
  if (ninjuTabButtons[2]) ninjuTabButtons[2].textContent = text.eyesTab;
  if (ninjuTabButtons[3]) ninjuTabButtons[3].textContent = text.itemsTab;
  if (ninjuTabButtons[4]) ninjuTabButtons[4].textContent = text.lookTab;
  const ninjuSeriesWrapEl = document.querySelector(".ninju-editor-series");
  if (ninjuSeriesWrapEl) ninjuSeriesWrapEl.setAttribute("aria-label", text.ninjuSeries);
  if (ninjuSeriesEls[0]) ninjuSeriesEls[0].textContent = text.healSeries;
  if (ninjuSeriesEls[1]) ninjuSeriesEls[1].textContent = text.supportSeries;
  if (ninjuSeriesEls[2]) ninjuSeriesEls[2].textContent = text.attackSeries;
  if (ninjuSeriesEls[3]) ninjuSeriesEls[3].textContent = text.specialSeries;
  if (ninjuSeriesEls[4]) ninjuSeriesEls[4].textContent = text.transformSeries;
  if (ninjuTitleSpanEl) ninjuTitleSpanEl.textContent = text.chooseNinju;
  if (ninjuInfoBtn) ninjuInfoBtn.textContent = text.ninjuInfo;
  if (ninjuEditorSlotsEl) ninjuEditorSlotsEl.setAttribute("aria-label", text.selectedNinju);
  if (ninjuEditorListEl) ninjuEditorListEl.setAttribute("aria-label", text.availableNinju);
  if (ninjuEditorResetBtn) ninjuEditorResetBtn.textContent = text.reset;
  if (ninjuEditorCancelBtn) ninjuEditorCancelBtn.textContent = text.cancel;
  if (ninjuEditorSaveBtn) ninjuEditorSaveBtn.textContent = text.save;

  setupWeaponSelects();
  setupLookSelects();
  setupControlSelects();

  roomCardEls.forEach((card) => {
    const team = card.dataset.team;
    const slot = Number(card.dataset.slot);
    const addBtn = card.querySelector(".room-slot-add");
    const removeBtn = card.querySelector(".room-slot-remove");
    const hpInputEl = card.querySelector(".room-hp-input");
    const skillInputEl = card.querySelector(".room-skill-input");
    const lookEl = card.querySelector(".room-look-select");
    const controlEl = card.querySelector(".room-control-select");
    const weaponEl = card.querySelector(".room-weapon-select");

    if (addBtn) {
      addBtn.textContent = text.add;
      addBtn.setAttribute("aria-label", text.add);
    }
    if (removeBtn) removeBtn.setAttribute("aria-label", text.remove);
    if (hpInputEl) hpInputEl.setAttribute("aria-label", `${roomTeamLabel(team)} ${slot} ${text.hp}`);
    if (skillInputEl) skillInputEl.setAttribute("aria-label", `${roomTeamLabel(team)} ${slot} ${text.skillBadge}`);
    if (lookEl) lookEl.setAttribute("aria-label", `${roomTeamLabel(team)} ${slot} ${text.lookTab || "外觀"}`);
    if (controlEl) controlEl.setAttribute("aria-label", `${roomTeamLabel(team)} ${slot} ${text.control}`);
    if (weaponEl) weaponEl.setAttribute("aria-label", `${roomTeamLabel(team)} ${slot} ${text.weapon}`);
  });

  updateAllRoomLookCards();

  if (!ninjuEditorEl?.hidden) renderNinjuEditor();
}

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

// ===== Per-Frame Updates =====
// 處理玩家長按角色時的集技規則。
function updateCharging(dt) {
  if (!state.pressedUnit || state.gameOver) return;
  if (!canDraggedUnitMoveNow(state.pressedUnit)) return;
  const held = (performance.now() - state.pressTime) / 1000;
  if (held < holdSeconds) return;
  if (!pointerIsOnUnit(state.pressedUnit)) {
    state.charging = true;
    setMessage(`${state.pressedUnit.name}：請把滑鼠移回角色身上才能繼續集氣。`);
    return;
  }

  state.charging = true;
  const skillLimit = state.pressedUnit.skillMax || maxSkill;
  state.pressedUnit.skill = Math.min(skillLimit, state.pressedUnit.skill + chargePerSecond * dt);
  setMessage(`${state.pressedUnit.name} 集氣中 ${state.pressedUnit.skill.toFixed(1)} / ${skillLimit}`);
}

function canDraggedUnitMoveNow(unit) {
  return canUnitMoveNow(unit) || canUseConsumableFollowupMove(unit);
}

// 處理開場倒數結束後正式開始比賽。
function updateMatchState(now) {
  if (state.matchStart || state.result) return;
  if (!state.countdownStart) state.countdownStart = now;
  if (now - state.countdownStart >= countdownTotalMs) {
    state.matchStart = state.countdownStart + countdownTotalMs;
    state.lastFrame = now;
    if (!state.startSoundPlayed) {
      playSound("gameStarted");
      state.startSoundPlayed = true;
    }
    setMessage("開始。");
  }
}

// 判斷目前是否在可以操作與 AI 行動的正式對戰中。
function isMatchActive() {
  return Boolean(!state.inRoom && state.matchStart && !state.result);
}

// ===== Rendering: Background / Board =====
// ===== Rendering: Units / Objects / Effects =====
// 繪製角色頭上的血條（原版金框樣式）。
function drawHp(unit, x, y) {
  const W = 50, H = 8;
  const hpMax = unit.maxHp || maxHp;
  const ratio = Math.max(0, unit.hp / hpMax);
  const hpText = `${Math.max(0, Math.round(unit.hp))}/${Math.round(hpMax)}`;
  // 底層背景圖
  if (images.barBackground) {
    ctx.drawImage(images.barBackground, x - W / 2, y, W, H);
  } else {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(x - W / 2, y, W, H);
  }
  // 血量填色（紅色）
  ctx.fillStyle = "#e02020";
  ctx.fillRect(x - W / 2, y, W * ratio, H);
  // 金框外框
  ctx.save();
  ctx.strokeStyle = "#e8c000";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - W / 2, y, W, H);
  // 內層細框
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x - W / 2 + 1, y + 1, W - 2, H - 2);
  // 直接在頭上血條中央顯示具體血量，方便戰鬥中讀值。
  ctx.font = "700 7px Microsoft JhengHei, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.strokeText(hpText, x, y + H / 2);
  ctx.fillStyle = "#fff7d6";
  ctx.fillText(hpText, x, y + H / 2);
  ctx.restore();
}

// 繪製玩家拖曳移動時的目標線與落點提示。
function drawDrag() {
  if (!state.charging || !state.dragMoved || !state.pressedUnit) return;
  if (!canDraggedUnitMoveNow(state.pressedUnit)) return;
  const target = dragMoveTargetCell(state.pressedUnit);
  if (!target) return;
  const maxDistance = Math.floor(state.pressedUnit.skill);
  const reachable = maxDistance >= 1 ? reachableMoveCell(state.pressedUnit, target, maxDistance) : null;
  if (!reachable) return;
  const from = unitPosition(state.pressedUnit);
  const to = cellCenter(reachable.x, reachable.y);
  const dist = manhattan(state.pressedUnit, reachable);
  const enough = state.pressedUnit.skill >= Math.max(1, dist);
  const direction = directionFromTarget(state.pressedUnit, reachable);
  if (!direction) return;
  drawDragArrow(from, to, direction, enough);
}

// 用整理後的 drag-arrow 組合圖繪製拖曳移動方向。
function drawDragArrow(from, to, direction, enough) {
  const directionName = typeof direction === "string" ? direction : direction?.name;
  const frame = dragArrowFrames[directionName]?.[0];
  if (!frame) return;
  const arrowY = -18;
  const thickness = 32;
  const minLength = 36;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.max(minLength, Math.abs(dx) + Math.abs(dy));

  ctx.save();
  ctx.globalAlpha = enough ? 0.95 : 0.45;
  if (directionName === "right") {
    ctx.drawImage(frame, from.x, from.y + arrowY - thickness / 2, length, thickness);
  } else if (directionName === "left") {
    ctx.drawImage(frame, from.x - length, from.y + arrowY - thickness / 2, length, thickness);
  } else if (directionName === "up") {
    ctx.drawImage(frame, from.x - thickness / 2, from.y + arrowY - length, thickness, length);
  } else if (directionName === "down") {
    ctx.drawImage(frame, from.x - thickness / 2, from.y + arrowY, thickness, length);
  }
  ctx.restore();
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

function useNinjuByType(type) {
  if (type === "moneyDart") useMoneyDart();
  else if (type === "steel") useSteelNinju();
  else if (type === "hotBlood") useHotBloodNinju();
  else if (attackNinjuConfigs[type]) useAttackNinju(type);
  else if (specialNinjuConfigs[type]) useSpecialNinju(type);
  else if (type === "genki") useGenkiNinju();
  else if (type === "kakki") useKakkiNinju();
  else if (type === "shinki") useShinkiNinju();
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

// ===== UI Text / Audio Helpers =====
// 更新頁面旁邊或下方的文字狀態資訊。
function updatePanel() {
  const unit = selectedHudUnit();
  if (!unit) return;
  const text = roomLocale();
  const coord = displayCellCoord(unit);
  const skillLimit = unit.skillMax || maxSkill;
  unitInfoEl.innerHTML = `
    <div>HP: ${Math.round(unit.hp)}/${unit.maxHp || maxHp}</div>
    <div>${text.panelSkill}: ${unit.skill.toFixed(1)} / ${skillLimit}</div>
    <div>${text.panelCell}: [${coord.x}, ${coord.y}]</div>
  `;
  skillFillEl.style.width = `${Math.min(100, unit.skill / skillLimit * 100)}%`;
}

// 依隊伍與面向取得角色圖片。
function unitSprite(unit) {
  const prefix = unitLookDefinition(unit).spriteSet || (unit.team === "blue" ? "blue" : "grey");
  const suffix = unit.facing.charAt(0).toUpperCase() + unit.facing.slice(1);
  return images[prefix + suffix];
}

// 依滑鼠游標相對角色的位置更新面向。
function updateFacingFromPointer(unit) {
  const origin = cellCenter(unit.x, unit.y);
  const dx = state.pointer.x - origin.x;
  const dy = state.pointer.y - origin.y;
  if (Math.hypot(dx, dy) < 8) return;
  if (Math.abs(dx) >= Math.abs(dy)) {
    unit.facing = dx > 0 ? "right" : "left";
  } else {
    unit.facing = dy > 0 ? "down" : "up";
  }
}

// 設定目前狀態訊息。
function setMessage(text) {
  state.message = text;
  statusEl.textContent = text;
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

