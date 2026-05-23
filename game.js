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

// 播放移動殘影：prearrive 在來源格，arrive 在目標格（水平方向裁切到角色身高）。
function drawMoveTrails(now) {
  for (const unit of state.units) {
    if (!unit.moveTrail) continue;
    const age = now - unit.moveTrail.startedAt;
    if (age >= Math.max(ARRIVE_TOTAL, PREARRIVE_TOTAL)) { unit.moveTrail = null; continue; }

    const trail = unit.moveTrail;
    const dir  = trail.facing;
    const team = unitLookDefinition(unit).moveSet || trail.team || (unit.team === "grey" ? "grey" : "blue");
    const dest = cellCenter(unit.x, unit.y);
    const src  = cellCenter(trail.fromX, trail.fromY);

    // Prearrive：來源格播放 2 影格（起跳/發射效果）
    if (age < PREARRIVE_TOTAL) {
      const fi = Math.min(1, Math.floor(age / PREARRIVE_FRAME_MS));
      const frame = movePrearriveFrames[team]?.[dir]?.[fi];
      if (frame) ctx.drawImage(frame, src.x - frame.width / 2, src.y - frame.height / 2);
    }

    // Arrive：目標格播放 5 影格（帶動態模糊的衝入動畫）
    if (age < ARRIVE_TOTAL) {
      const fi = Math.min(4, Math.floor(age / ARRIVE_FRAME_MS));
      const frame = moveArriveFrames[team]?.[dir]?.[fi];
      if (frame) {
        const off = arriveFrameOffset(dir, dest.x, dest.y, frame.width, frame.height);
        if (dir === "right" || dir === "left") {
          // 水平方向裁切到角色身高範圍，避免殘影延伸到角色上下方。
          ctx.save();
          ctx.beginPath();
          ctx.rect(off.x, dest.y - 47, frame.width, 62);
          ctx.clip();
          ctx.drawImage(frame, off.x, off.y, frame.width, frame.height);
          ctx.restore();
        } else {
          ctx.drawImage(frame, off.x, off.y, frame.width, frame.height);
        }
      }
    }
  }
}

const steelOutlineCache = new WeakMap();
const hotBloodOutlineCache = new WeakMap();
const sake4OutlineCache = new WeakMap();

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

// 房間武器下拉選單的預設內容；第一個 select 寫在 HTML，其餘空 select 由這裡補齊，避免維護十份 option。
function setupWeaponSelects() {
  if (weaponSelectEls.length === 0) return;
  const optionsHtml = weaponDefinitions.map((weapon) => (
    `<option value="${weapon.key}"${weapon.key === defaultWeaponKey ? " selected" : ""}>${localizedWeaponLabel(weapon)}</option>`
  )).join("");
  weaponSelectEls.forEach((select) => {
    const previousValue = select.value || defaultWeaponKey;
    select.innerHTML = optionsHtml;
    if (weaponDefinitionByKey[previousValue]) select.value = previousValue;
    if (!weaponDefinitionByKey[select.value]) select.value = defaultWeaponKey;
  });
}

function setupLookSelects() {
  if (lookSelectEls.length === 0) return;
  const optionsHtml = Object.entries(lookDefinitions).map(([key, look]) => {
    const label = roomLocaleText[look.labelKey] || look.label || key;
    return `<option value="${key}">${label}</option>`;
  }).join("");
  lookSelectEls.forEach((select) => {
    const previousValue = select.value || "default";
    select.innerHTML = optionsHtml;
    select.value = lookDefinitions[previousValue] ? previousValue : "default";
    select.onchange = () => {
      updateRoomLookCard(select.dataset.team, Number(select.dataset.slot));
    };
  });
}

// 房間控制模式下拉選單的預設內容；玩家代表不跑 AI，可由使用者操作。
function setupControlSelects() {
  if (controlSelectEls.length === 0) return;
  const optionsHtml = `
    <option value="player">${localizedControlModeLabel("player")}</option>
    <option value="ai_beginner">${localizedControlModeLabel("ai_beginner")}</option>
    <option value="ai_red">${localizedControlModeLabel("ai_red")}</option>
    <option value="ai_tachi_master">${localizedControlModeLabel("ai_tachi_master")}</option>
    <option value="ai_money_dart_master">${localizedControlModeLabel("ai_money_dart_master")}</option>
    <option value="ai_dart_only_master">${localizedControlModeLabel("ai_dart_only_master")}</option>
    <option value="ai_god">${localizedControlModeLabel("ai_god")}</option>
  `;
  controlSelectEls.forEach((select) => {
    const current = select.value;
    if (!select.innerHTML.trim()) {
      select.innerHTML = optionsHtml;
    } else {
      select.innerHTML = optionsHtml;
      select.value = current;
    }
    if (!current) {
      select.value = select.dataset.team === "grey" ? "player" : "ai_red";
    }
    if (select.value === "ai") select.value = "ai_beginner";
    if (select.value !== "player" && select.value !== "ai_beginner" && select.value !== "ai_red" && select.value !== "ai_tachi_master" && select.value !== "ai_money_dart_master" && select.value !== "ai_dart_only_master" && select.value !== "ai_god") select.value = "player";
    select.onchange = () => {
      updateRoomLookCard(select.dataset.team, Number(select.dataset.slot));
    };
  });
}

// 房間血量輸入框預設與範圍保護。
function setupHpInputs() {
  if (hpInputEls.length === 0) return;
  hpInputEls.forEach((input) => {
    if (!input.value) input.value = String(maxHp);
    const fixed = clamp(Math.round(Number(input.value) || maxHp), 1, 9999);
    input.value = String(fixed);
    input.addEventListener("change", () => {
      const value = clamp(Math.round(Number(input.value) || maxHp), 1, 9999);
      input.value = String(value);
    });
  });
}

function setupSkillInputs() {
  if (skillInputEls.length === 0) return;
  skillInputEls.forEach((input) => {
    if (!input.value) input.value = String(maxSkill);
    const fixed = clamp(Math.round(Number(input.value) || maxSkill), 0, roomSkillInputMax);
    input.value = String(fixed);
    input.addEventListener("change", () => {
      const value = clamp(Math.round(Number(input.value) || 0), 0, roomSkillInputMax);
      input.value = String(value);
    });
  });
}

// 房間卡片新增/刪除：預設青1、灰1啟用，其餘顯示新增。
function setupRoomSlots() {
  roomCardEls.forEach((card) => {
    const team = card.dataset.team;
    const slot = Number(card.dataset.slot);
    const addBtn = card.querySelector(".room-slot-add");
    const removeBtn = card.querySelector(".room-slot-remove");
    const nameEl = card.querySelector(".room-name");
    const controlEl = card.querySelector(".room-control-select");

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        card.classList.add("active-slot");
        if (nameEl) nameEl.textContent = `${team === "blue" ? "青" : "灰"}${slot}`;
        if (controlEl) controlEl.value = team === "grey" ? "player" : "ai_red";
      });
    }
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        if (slot === 1) return;
        card.classList.remove("active-slot");
      });
    }
  });
}

// 依房間卡片上的隊伍與位置，取得該角色進戰鬥後要使用的武器。
function selectedWeaponKey(team, slot) {
  const controlMode = selectedControlMode(team, slot);
  if (controlMode === "ai_red") return "weapon8";
  if (controlMode === "ai_tachi_master") return "weapon3";
  const select = weaponSelectEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  return weaponDefinitionByKey[select?.value] ? select.value : defaultWeaponKey;
}

// 依房間卡片上的隊伍與位置，取得該角色進戰鬥後是玩家操控或電腦操控。
function selectedControlMode(team, slot) {
  const select = controlSelectEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  if (select?.value === "player") return "player";
  if (select?.value === "ai_red") return "ai_red";
  if (select?.value === "ai_tachi_master") return "ai_tachi_master";
  if (select?.value === "ai_money_dart_master") return "ai_money_dart_master";
  if (select?.value === "ai_dart_only_master") return "ai_dart_only_master";
  if (select?.value === "ai_god") return "ai_god";
  return "ai_beginner";
}

// 依房間卡片上的隊伍與位置，取得該角色進戰鬥後使用的最大血量。
function selectedHpValue(team, slot) {
  const input = hpInputEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  const value = Number(input?.value);
  if (!Number.isFinite(value)) return maxHp;
  return clamp(Math.round(value), 1, 9999);
}

function selectedSkillValue(team, slot) {
  const input = skillInputEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  const value = Number(input?.value);
  if (!Number.isFinite(value)) return maxSkill;
  return clamp(Math.round(value), 0, roomSkillInputMax);
}

function updateRoomLookCard(team, slot) {
  const card = roomCardEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  if (!card) return;
  const look = selectedControlMode(team, slot) === "ai_red"
    ? lookDefinitionByKey("red")
    : (team === "blue" ? lookDefinitionByKey(selectedLookKey(team, slot)) : baseLookDefinitionForTeam(team));
  const avatarEl = card.querySelector(".room-avatar");
  const eyeEl = card.querySelector(".room-avatar-eye");
  if (avatarEl) avatarEl.src = look.roomAvatarSrc;
  if (eyeEl) {
    if (look.roomAvatarEyeSrc) {
      eyeEl.src = look.roomAvatarEyeSrc;
      eyeEl.style.display = "";
    } else {
      eyeEl.style.display = "none";
    }
  }
}

function updateAllRoomLookCards() {
  roomCardEls.forEach((card) => {
    updateRoomLookCard(card.dataset.team, Number(card.dataset.slot));
  });
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
function battleMapRect() {
  return {
    x: grid.left + battleMapDrawInset.left,
    y: grid.top + battleMapDrawInset.top,
    w: grid.cols * grid.cell - battleMapDrawInset.left - battleMapDrawInset.right,
    h: grid.rows * grid.cell - battleMapDrawInset.top - battleMapDrawInset.bottom,
  };
}

// 繪製整體背景與 UI 底板。
function drawBackdrop() {
  ctx.fillStyle = "#062f37";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawUiPanels();
  const mapDrawRect = battleMapRect();
  const mapDefinition = currentRoomMapDefinition();
  const groundImage = images[mapDefinition.groundImageKey] || images.arena;
  const fallbackImage = images[mapDefinition.fallbackImageKey] || images.bg;
  if (groundImage) {
    ctx.drawImage(groundImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
  } else if (fallbackImage) {
    ctx.globalAlpha = 0.8;
    ctx.drawImage(fallbackImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#74ad7f";
    ctx.fillRect(mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
  }
  drawFrame();
}

function drawMapMaskOverlay() {
  const mapDefinition = currentRoomMapDefinition();
  const maskImage = images[mapDefinition.maskImageKey];
  if (!maskImage) return;
  const mapDrawRect = battleMapRect();
  ctx.drawImage(maskImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
}

// 繪製下方 UI 面板區塊。
function drawUiPanels() {
  const bottom = ui.bottomTop;
  ctx.save();
  ctx.fillStyle = "#074451";
  ctx.fillRect(0, bottom, canvas.width, ui.bottomHeight);
  ctx.fillStyle = "#052b32";
  ctx.fillRect(8, bottom + 10, ui.leftPanelW - 18, ui.bottomHeight - 18);
  ctx.fillRect(ui.midX + 10, bottom + 10, canvas.width - ui.midX - 18, ui.bottomHeight - 18);
  ctx.restore();
}

// 繪製遊戲外框與分隔線。
function drawFrame() {
  const bottom = ui.bottomTop;
  ctx.save();
  ctx.strokeStyle = "#7b2417";
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, canvas.width - 6, bottom - 4);
  ctx.strokeRect(3, bottom, canvas.width - 6, canvas.height - bottom - 4);
  ctx.beginPath();
  ctx.moveTo(ui.midX, bottom);
  ctx.lineTo(ui.midX, canvas.height - 4);
  ctx.stroke();
  for (const [x, y] of [[9, 9], [canvas.width - 9, 9], [9, bottom - 2], [canvas.width - 9, bottom - 2], [9, canvas.height - 9], [ui.midX, bottom], [ui.midX, canvas.height - 9], [canvas.width - 9, canvas.height - 9]]) {
    drawCornerGem(x, y);
  }
  ctx.restore();
}

// 繪製外框角落的圓形裝飾。
function drawCornerGem(x, y) {
  ctx.save();
  ctx.fillStyle = "#224d43";
  ctx.strokeStyle = "#d0a15b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#75c7a5";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 繪製地圖底圖、樹牆與基本場景。
function drawBoard() {
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const r = cellRect(x, y);
      const hovered = state.pointer.cell && state.pointer.cell.x === x && state.pointer.cell.y === y;
      if (hovered) {
        ctx.fillStyle = isBlockedCell(x, y) ? "rgba(255, 82, 69, .22)" : "rgba(255, 238, 124, .22)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
    }
  }

  const selected = selectedUnit();
  if (!selected) return;
  for (const n of neighbors(selected.x, selected.y)) {
    if (!inside(n.x, n.y)) continue;
    const r = cellRect(n.x, n.y);
    ctx.fillStyle = unitAt(n.x, n.y) ? "rgba(255,95,83,.26)" : "rgba(103,212,179,.20)";
    if (isBlockedCell(n.x, n.y)) ctx.fillStyle = "rgba(255,224,109,.18)";
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
}

// ===== Rendering: Units / Objects / Effects =====
// 繪製所有角色、名字、血條與手持忍術物件。
function drawUnits() {
  drawCloneDecoys();
  for (const unit of state.units) {
    if (!unit.alive) continue;
    const p = unitPosition(unit);
    const selected = unit.id === state.selectedId;
    const bob = 0;

    const isPlayer = unit.id === playerUnitId;

    // 玩家單位改用白色手指指示，不顯示黃色選取圓圈。
    if (selected && !isPlayer) {
      ctx.strokeStyle = "#ffe06d";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 4, 31, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.charging && state.pressedUnit === unit) {
      drawChargeEffect(p, "back", unit);
    }

    if (unit.hitFlash > 0) {
      unit.hitFlash = Math.max(0, unit.hitFlash - 0.06);
      ctx.save();
      ctx.globalAlpha = unit.hitFlash;
      ctx.fillStyle = "#ff5148";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 10, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const useNinjuSprite = unitUseNinjuSprite(unit);
    const sprite = useNinjuSprite || unitSprite(unit);
    // arrive 動畫播放期間隱藏靜態 sprite，由 drawMoveTrails 負責顯示殘影。
    const isMoving = unit.moveTrail && (performance.now() - unit.moveTrail.startedAt) < ARRIVE_TOTAL;
    if (!activeMoneyDartCast(unit) && !isMoving && !unit.moneyDart && sprite) {
      const auraType = activeBuffAuraType(unit);
      drawBuffAuraSpriteOutline(auraType, sprite, p, bob);
      const spritePoint = useNinjuSprite
        ? { x: p.x + useNinjuSpriteOffset.x, y: p.y + useNinjuSpriteOffset.y }
        : p;
      drawUnitImage(sprite, spritePoint, bob);
      if (useNinjuSprite) drawUnitEyes({ ...unit, facing: "down" }, p, bob);
      else drawUnitEyes(unit, p, bob);
    } else if (!activeMoneyDartCast(unit) && !isMoving && !unit.moneyDart && !isPlayer) {
      // 玩家單位不顯示色圓佔位，其他單位仍顯示。
      ctx.fillStyle = unit.team === "blue" ? "#5bb8ff" : "#b5b9b3";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 12 + bob, 24, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.charging && state.pressedUnit === unit) {
      drawChargeEffect(p, "front", unit);
    }

    // 拿標備彈時的 buff 光圈：依當前動畫階段選用對應 sprite，確保光圈形狀與角色一致
    if (unit.moneyDart && !activeMoneyDartCast(unit) && !isMoving) {
      const auraType = activeBuffAuraType(unit);
      if (auraType) {
        const elapsed = performance.now() - unit.moneyDart.startedAt;
        const pickupMs = 300;
        const key = unit.team === "blue" ? "b" : "g";
        let auraSprite;
        if (elapsed < pickupMs) {
          // pickup 階段：角色本體是 idle sprite，光圈用標準位置
          auraSprite = unitSprite(unit);
          if (auraSprite) {
            drawBuffAuraSpriteOutline(auraType, auraSprite, p, bob);
          }
        } else {
          // ready 備彈階段：b_dart 幀 + 補正偏移，光圈對齊補正後位置
          auraSprite = moneyDartReadyFrame(unit.facing, unit) || unitSprite(unit);
          const auraOff = moneyDartReadyOffsets[unit.facing] || { dx: 0, dy: 0 };
          const drawAt = { x: p.x - 31 + auraOff.dx, y: p.y - 47 + auraOff.dy + bob, w: 62, h: 62 };
          if (auraSprite) {
            drawBuffAuraSpriteOutline(auraType, auraSprite, p, bob, drawAt);
          }
        }
      }
    }

    drawHeldMoneyDart(unit, p);
    drawRespawnPointer(unit, p);

    if (isPlayer) {
      drawPlayerArrow(p);
    } else {
      drawHp(unit, p.x, p.y - 70);
      drawUnitName(unit, p.x, p.y - 50);
    }
  }
}

function drawCloneDecoys() {
  if (!state.cloneDecoys?.length) return;
  for (const decoy of state.cloneDecoys) {
    const visualDecoy = cloneDecoyVisualState(decoy);
    const p = unitPosition(decoy);
    const sprite = unitSprite(visualDecoy);
    if (!sprite) continue;
    ctx.save();
    ctx.globalAlpha = 0.92;
    const auraType = activeBuffAuraType(visualDecoy);
    drawBuffAuraSpriteOutline(auraType, sprite, p, 0);
    drawUnitImage(sprite, p);
    drawUnitEyes(visualDecoy, p, 0);
    drawHp(visualDecoy, p.x, p.y - 70);
    drawUnitName(visualDecoy, p.x, p.y - 50);
    ctx.restore();
  }
}

function cloneDecoyVisualState(decoy) {
  const caster = state.units.find((unit) => unit.id === decoy.casterId);
  if (!caster) return decoy;
  return {
    ...decoy,
    name: caster.name,
    hp: caster.hp,
    maxHp: caster.maxHp,
    controlMode: caster.controlMode,
    appearanceKey: caster.appearanceKey,
    steelUntil: caster.steelUntil,
    hotBloodUntil: caster.hotBloodUntil,
    moveSkillFreeUntil: caster.moveSkillFreeUntil,
    buffAuraType: caster.buffAuraType,
  };
}

// 集技時繪製藍色外圈與紅/黃火焰。unit 用來根據面向決定火焰位置。
function drawChargeEffect(p, layer = "all", unit = null) {
  const now = performance.now();
  const redFrame = chargeRedFrames[Math.floor(now / 120) % chargeRedFrames.length];
  const yellowFrame = chargeYellowFrames[Math.floor(now / 120) % chargeYellowFrames.length];

  // 根據角色面向決定火焰中心偏移（x/y）與傾斜角度（rot，弧度，正值順時針）。
  const facing = unit ? (unit.facing || "down") : "down";
  const fireOff = {
    up:           { x: 0,  y: -35, rot: 0    },
    down:         { x: 0,  y: -35, rot: 0    },
    right:        { x: -5, y: -35, rot: -0.3 },  // 約 17° 逆時針（向左傾）
    left:         { x: 5,  y: -35, rot: 0.3  },  // 約 17° 順時針（向右傾）
    "up-right":   { x: -3, y: -35, rot: 0.15 },
    "up-left":    { x: 3,  y: -35, rot: -0.15 },
    "down-right": { x: -3, y: -35, rot: 0.2  },
    "down-left":  { x: 3,  y: -35, rot: -0.2 },
  };
  const off = fireOff[facing] || fireOff["down"];
  const fx = p.x + off.x;
  const fy = p.y + off.y;
  const rot = off.rot;

  ctx.save();
  ctx.globalAlpha = 0.82;
  if ((layer === "all" || layer === "back") && images.chargeOuter) {
    ctx.drawImage(images.chargeOuter, p.x - 39, p.y - 55, 78, 78);
  }
  if ((layer === "all" || layer === "front") && redFrame) {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.drawImage(redFrame, -25, -30, 50, 60);
    ctx.restore();
  }
  if ((layer === "all" || layer === "front") && yellowFrame) {
    ctx.globalAlpha = 0.72;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.drawImage(yellowFrame, -16, -19, 32, 38);
    ctx.restore();
  }
  ctx.restore();
}

// 鋼鐵防禦的藍光描邊：用角色 sprite 本身當遮罩，往外偏移 3px 畫出貼角色輪廓的細線。
function drawSteelSpriteOutline(sprite, p, bob = 0, drawAt = null) {
  drawBuffSpriteOutline(sprite, p, bob, steelOutlineCache, "#5feeff", "#39e8ff", 2, 7, drawAt); // 鋼鐵外圈：fill 顏色、shadow 顏色、線寬、發光強度。
}

function drawHotBloodSpriteOutline(sprite, p, bob = 0, drawAt = null) {
  drawBuffSpriteOutline(sprite, p, bob, hotBloodOutlineCache, "#ff2d24", "#ff1f1a", 2, 7, drawAt); // 熱血外圈：紅色系，線寬目前跟鋼鐵一致。
}

function drawSake4SpriteOutline(sprite, p, bob = 0, drawAt = null) {
  drawBuffSpriteOutline(sprite, p, bob, sake4OutlineCache, "#ffd94d", "#ffbf1f", 2, 9, drawAt); // 神酒外圈：金黃色，沿用鋼鐵的角色輪廓罩光。
}

function drawBuffAuraSpriteOutline(auraType, sprite, p, bob = 0, drawAt = null) {
  if (auraType === "steel") drawSteelSpriteOutline(sprite, p, bob, drawAt);
  if (auraType === "hotBlood") drawHotBloodSpriteOutline(sprite, p, bob, drawAt);
  if (auraType === "sake4") drawSake4SpriteOutline(sprite, p, bob, drawAt);
}

// drawAt: 可選的自訂繪製區域 { x, y, w, h }，供射出動畫等非標準位置使用。
function drawBuffSpriteOutline(sprite, p, bob, cache, fill, shadow, outlineWidth, shadowBlur, drawAt = null) {
  const mask = spriteColorMask(sprite, cache, fill);
  if (!mask) return;
  let x, y, w, h;
  if (drawAt) {
    ({ x, y, w, h } = drawAt);
  } else {
    const offset = { x: -31, y: 47 }; // 外圈 offset：x 正值往右、y 正值往上。
    const at = applyOffset({ x: p.x, y: p.y + bob }, offset);
    x = at.x; y = at.y; w = 62; h = 62;
  }
  const pulse = 0.66 + Math.sin(performance.now() / 170) * 0.1; // 透明度脈動強度/速度。

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.shadowColor = shadow;
  ctx.shadowBlur = shadowBlur;
  for (let dx = -outlineWidth; dx <= outlineWidth; dx++) {
    for (let dy = -outlineWidth; dy <= outlineWidth; dy++) {
      const distance = Math.hypot(dx, dy);
      if (distance <= 0 || distance > outlineWidth) continue;
      ctx.drawImage(mask, x + dx, y + dy, w, h);
    }
  }
  ctx.restore();
}

// 快取上色後的 sprite 遮罩，避免每幀重新建立。
function spriteColorMask(sprite, cache, fill) {
  if (cache.has(sprite)) return cache.get(sprite);
  const canvas = document.createElement("canvas");
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const maskCtx = canvas.getContext("2d");
  maskCtx.drawImage(sprite, 0, 0);
  maskCtx.globalCompositeOperation = "source-in";
  maskCtx.fillStyle = fill;
  maskCtx.fillRect(0, 0, canvas.width, canvas.height);
  cache.set(sprite, canvas);
  return canvas;
}

function activeBuffAuraType(unit) {
  if (unit.buffAuraType === "steel" && isSteelDefenseActive(unit)) return "steel";
  if (unit.buffAuraType === "hotBlood" && isHotBloodActive(unit)) return "hotBlood";
  if (unit.buffAuraType === "sake4" && isSake4MoveSkillFreeActive(unit)) return "sake4";
  if (isSteelDefenseActive(unit)) return "steel";
  if (isHotBloodActive(unit)) return "hotBlood";
  if (isSake4MoveSkillFreeActive(unit)) return "sake4";
  return "";
}

function isSake4MoveSkillFreeActive(unit) {
  return Boolean(unit && unit.moveSkillFreeUntil && performance.now() < unit.moveSkillFreeUntil);
}

// 統一 offset 規則：x 正值往右、y 正值往上。
function applyOffset(anchor, offset) {
  return { x: anchor.x + offset.x, y: anchor.y - offset.y };
}

// 角色平常手上顯示苦無武器。
function drawHeldKunai(unit, p) {
  if (activeMoneyDartCast(unit)) return;
  const frame = weaponFrames[unit.weaponKey || defaultWeaponKey]?.hand?.[unit.facing]?.[0];
  if (!frame) return;
  const scale = 1.25;
  const w = frame.width * scale;
  const h = frame.height * scale;
  const offsets = {
    right: { x: 8, y: 39 },
    left: { x: -8 - w, y: 39 },
    up: { x: -w / 2, y: 58 },
    down: { x: -w / 2, y: 22 },
  };
  const offset = offsets[unit.facing] || offsets.down;
  const at = applyOffset(p, offset);
  ctx.drawImage(frame, at.x, at.y, w, h);
}

// 重生後在角色上方畫大箭頭，提示玩家角色回到場上。
function drawRespawnPointer(unit, p) {
  const now = performance.now();
  if (!unit.respawnTipUntil || now >= unit.respawnTipUntil) return;
  const remaining = unit.respawnTipUntil - now;
  const elapsed = respawnPointerDuration - remaining;
  const progress = Math.min(0.999, Math.max(0, elapsed / respawnPointerDuration));
  const frame = respawnPointerFrames[Math.floor(progress * respawnPointerFrames.length)];
  if (!frame) return;

  const fade = Math.min(1, remaining / 180);
  const bounce = Math.sin(now / 70) * 3;
  const w = 142;
  const h = 125;
  const x = p.x - 24;
  const y = p.y - 126 + bounce;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.drawImage(frame, x, y, w, h);
  ctx.restore();
}

// 繪製拿標角色 sprite：前 300ms 播放 pickup 起身動畫，之後在 idle 上疊錢標圖示。
function drawHeldMoneyDart(unit, p) {
  if (!unit.moneyDart) return;
  const now = performance.now();
  const elapsed = now - unit.moneyDart.startedAt;
  const pickupMs = 300;

  ctx.save();
  if (elapsed < pickupMs) {
    // pickup 階段：顯示 idle 角色，dart 從小到完整疊加在手部位置
    const idleSprite = unitSprite(unit);
    if (idleSprite) ctx.drawImage(idleSprite, p.x - 31, p.y - 47, 62, 62);
    if (moneyDartPickupFrames.length > 0) {
      const idx = Math.min(moneyDartPickupFrames.length - 1, Math.floor(elapsed / pickupMs * moneyDartPickupFrames.length));
      const dartFrame = moneyDartPickupFrames[idx];
      // 36×36 的 dart 疊加在角色手部中央位置
      if (dartFrame) ctx.drawImage(dartFrame, p.x - 18, p.y - 25, 36, 36);
    }
    // 眼睛：依面向使用正常 eyeOffsets
    drawUnitEyes(unit, p, 0);
  } else {
    // ready 備彈階段：依面向方向顯示 b_dart 幀，套用補正偏移對齊 idle 視覺位置
    const frame = moneyDartReadyFrame(unit.facing, unit);
    const readyOff = moneyDartReadyOffsets[unit.facing] || { dx: 0, dy: 0 };
    if (frame) ctx.drawImage(frame, p.x - 31 + readyOff.dx, p.y - 47 + readyOff.dy, 62, 62);
    drawUnitEyes(unit, p, 0, moneyDartEyeOffsets);
  }
  ctx.restore();
}

// 依照面向方向取得對應隊伍的錢鏢備彈靜態影格。
function moneyDartReadyFrame(facing, unit) {
  const dirIndex = { right: 0, left: 1, up: 2, down: 3 }[facing] ?? 0;
  const key = unitLookDefinition(unit).moneyDartReadySet || (unit.team === "grey" ? "g" : "b");
  return (moneyDartReadyFrames[key] || [])[dirIndex] || null;
}

// 前 300ms 播放拿標起身動畫（dart 出現），之後顯示面向對應的備彈靜態幀。
function moneyDartPickupOrReadyFrame(unit, elapsed) {
  const pickupMs = 300;
  if (elapsed < pickupMs && moneyDartPickupFrames.length > 0) {
    const frameMs = pickupMs / moneyDartPickupFrames.length;
    const idx = Math.min(moneyDartPickupFrames.length - 1, Math.floor(elapsed / frameMs));
    return moneyDartPickupFrames[idx] || null;
  }
  return moneyDartReadyFrame(unit.facing, unit);
}

// 繪製地圖上的草、瓶子、箱子、岩石等物件。
function drawMapObjects() {
  if (!state.objects) return;
  const sorted = state.objects.filter((object) => object.alive && !object.hidden).slice().sort((a, b) => a.y - b.y || a.x - b.x);
  for (const object of sorted) {
    const img = images[object.type];
    const center = cellCenter(object.x, object.y);
    const scale = object.scale || 1;
    const width = grid.cell * (object.drawWidthCells || scale);
    const height = grid.cell * (object.drawHeightCells || scale);
    const anchorY = object.drawAnchorY ?? 0.72;
    const drawX = center.x + (object.drawOffsetX || 0);
    const drawY = center.y + (object.drawOffsetY || 0);

    if (img) {
      ctx.drawImage(img, drawX - width / 2, drawY - height * anchorY, width, height);
    } else {
      ctx.fillStyle = object.breakable ? "#d9d260" : "#245038";
      ctx.fillRect(center.x - width / 2, center.y - height / 2, width, height);
    }

    if (object.breakable && object.hp < objectHp) {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(center.x - 16, center.y - height * 0.78, 32, 4);
      ctx.fillStyle = "#ffd766";
      ctx.fillRect(center.x - 16, center.y - height * 0.78, 32 * Math.max(0, object.hp / object.maxHp), 4);
    }
  }
}

// 繪製武器揮砍的短暫攻擊動畫。
function drawAttacks() {
  if (!state.attacks) return;

  for (let i = state.attacks.length - 1; i >= 0; i--) {
    const attack = state.attacks[i];
    const age = (performance.now() - attack.startedAt) / attack.duration; // 0 到 1，代表目前揮砍動畫播放進度。
    if (age >= 1) {
      state.attacks.splice(i, 1);
      continue;
    }

    const from = cellCenter(attack.from.x, attack.from.y); // 攻擊者所在格中心。
    const to = cellCenter(attack.to.x, attack.to.y); // 動畫錨點格中心，不等於完整攻擊範圍。
    const weaponFrameSet = weaponFrames[attack.weaponKey || defaultWeaponKey] || weaponFrames[defaultWeaponKey];
    const frames = weaponFrameSet.attack[attack.direction] || []; // 依上下左右選擇對應武器組合圖。
    const handFrames = weaponFrameSet.hand[attack.direction] || []; // 依同一個方向選擇手部出招組合圖。
    const frameIndex = Math.min(frames.length - 1, Math.floor(age * frames.length)); // 依動畫進度選擇第幾張刀光圖。
    const handFrameIndex = Math.min(handFrames.length - 1, Math.floor(age * handFrames.length)); // 手部動畫和刀光同步播放。
    const frame = frames[frameIndex];
    const handFrame = handFrames[handFrameIndex];

    if (handFrame) {
      drawKunaiHandAttackFrame(handFrame, from, to, attack.direction, attack.weaponKey || defaultWeaponKey);
    }
    if (frame) {
      drawKunaiAttackFrame(frame, from, to, attack.direction, attack.weaponKey || defaultWeaponKey);
    } else {
      drawSlashArc(from, to, age, attack.side);
    }
  }
}

// 使用目前武器的方向攻擊組合圖繪製揮砍。
function drawKunaiAttackFrame(frame, from, to, direction, weaponKey = defaultWeaponKey) {
  const scale = 1.55 * weaponAttackScale(weaponKey); // 每把武器可個別調整 attack 大小。
  const w = frame.width * scale; // 實際繪製寬度。
  const h = frame.height * scale; // 實際繪製高度。
  const dx = Math.sign(to.x - from.x); // 動畫方向 X：右 1、左 -1、上下 0。
  const dy = Math.sign(to.y - from.y); // 動畫方向 Y：下 1、上 -1、左右 0。
  const anchor = {
    x: from.x + dx * 34, // 從角色中心往攻擊方向推一點，作為武器動畫基準點。
    y: from.y + dy * 31, // 角色圖的視覺中心比格子中心高，所以先往上修。
  };
  const offset = weaponAttackOffset(weaponKey, direction, w, h); // 防呆：方向異常時置中畫。
  const at = applyOffset(anchor, offset);
  ctx.drawImage(frame, at.x, at.y, w, h);
}

// 使用目前武器的手部組合圖繪製出招動畫；這組 offset 獨立於刀光位置，避免動到已校準的武器 offsets。
function drawKunaiHandAttackFrame(frame, from, to, direction, weaponKey = defaultWeaponKey) {
  const scale = 1.55 * weaponHandScale(weaponKey); // 每把武器可個別調整 hand 大小。
  const w = frame.width * scale; // 手部動畫實際繪製寬度。
  const h = frame.height * scale; // 手部動畫實際繪製高度。
  const dx = Math.sign(to.x - from.x); // 動畫方向 X：右 1、左 -1、上下 0。
  const dy = Math.sign(to.y - from.y); // 動畫方向 Y：下 1、上 -1、左右 0。
  const anchor = {
    x: from.x + dx * 34, // 和刀光使用同一個方向錨點，確保手和刀同步。
    y: from.y + dy * 31,
  };
  const offset = weaponHandOffset(weaponKey, direction, w, h);
  const at = applyOffset(anchor, offset);
  ctx.drawImage(frame, at.x, at.y, w, h);
}

// 錢鏢命中是丟出當下直線即時判定；這裡只清掉舊版殘留 projectile。
function drawProjectiles(now) {
  if (!state.projectiles) return;
  state.projectiles.length = 0;
}

// 繪製角色丟出錢鏢時的出手動畫。
function drawMoneyDartShootAnimations(now) {
  if (!state.moneyDartCasts) return;
  for (let i = state.moneyDartCasts.length - 1; i >= 0; i--) {
    const cast = state.moneyDartCasts[i];
    const progress = (now - cast.startedAt) / cast.duration;
    if (!Number.isFinite(progress) || progress >= 1 || now - cast.startedAt > 1000) {
      state.moneyDartCasts.splice(i, 1);
      continue;
    }

    const unit = state.units.find((u) => u.id === cast.unitId && u.alive);
    if (!unit) {
      state.moneyDartCasts.splice(i, 1);
      continue;
    }
    const teamKey = unitLookDefinition(unit).moneyDartShootSet || (unit.team === "blue" ? "b" : "g");
    const frames = ((moneyDartShootFrames[teamKey] || {})[cast.dir] || []).filter(f => f && f.naturalWidth > 0);
    if (frames.length === 0) continue; // 圖片未載入時跳過這幀，保留 cast
    const frameIdx = Math.max(0, Math.min(frames.length - 1, Math.floor(progress * frames.length)));
    const frame = frames[frameIdx];
    const p = unitPosition(unit);
    const placement = moneyDartShootPlacement(cast.dir, frame, p, frameIdx);

    // 射出時 buff 光圈：使用當前 shoot 幀作為遮罩來源，並對齊 shoot 幀的位置與大小
    const shootAuraType = activeBuffAuraType(unit);
    if (shootAuraType) {
      const drawAt = { x: placement.x, y: placement.y, w: placement.w, h: placement.h };
      drawBuffAuraSpriteOutline(shootAuraType, frame, p, 0, drawAt);
    }
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.drawImage(frame, placement.x, placement.y, placement.w, placement.h);
    ctx.restore();
    // 射出動畫期間補上眼睛：依當前幀的逐幀頭部座標，換算至 placement 座標系
    const headCfg = moneyDartShootFrameHeads[cast.dir] || moneyDartShootFrameHeads.down;
    const headFrameIdx = Math.max(0, Math.min(headCfg.frames.length - 1, frameIdx));
    const headPx = headCfg.frames[headFrameIdx];
    const scale = moneyDartVisualOffsets.shoot.scale;
    const eyeAnchor = {
      x: placement.x + headPx.x * scale - headCfg.w / 2,
      y: placement.y + headPx.y * scale - headCfg.h / 2,
    };
    drawMoneyDartShootEye(unit, unit.facing, eyeAnchor, headCfg);
  }
}

// 依方向決定錢鏢出手動畫的位置與尺寸。
// frameIdx：用於左右方向的逐幀 Y 補正，抵消投擲動作造成的視覺重心下移。
function moneyDartShootPlacement(direction, frame, p, frameIdx = 0) {
  const offsets = moneyDartVisualOffsets.shoot;
  const offset = offsets[direction] || offsets.down;
  const scale = offsets.scale;
  const w = frame.width * scale;
  const h = frame.height * scale;
  if (direction === "right") {
    const yCorr = (moneyDartShootYCorrection[frameIdx] || 0) * scale;
    return { x: p.x + offset.x, y: p.y - offset.y + 10 + yCorr, w, h };
  }
  if (direction === "left") {
    const yCorr = (moneyDartShootYCorrection[frameIdx] || 0) * scale;
    return { x: p.x + offset.x - w, y: p.y - offset.y + 10 + yCorr, w, h };
  }
  if (direction === "up") return { x: p.x + offset.x - w / 2, y: p.y - offset.y - h+20, w, h };
  return { x: p.x + offset.x - w / 2, y: p.y - offset.y, w, h };
}

// 依攻擊方向繪製武器揮砍弧線。
function drawSlashArc(from, to, age, side) {
  const centerX = from.x + (to.x - from.x) * 0.62;
  const centerY = from.y + (to.y - from.y) * 0.62 - 16;
  const baseAngle = Math.atan2(to.y - from.y, to.x - from.x);
  const start = baseAngle - side * (1.1 - age * 0.35);
  const end = baseAngle + side * (0.75 + age * 0.35);
  const alpha = age < 0.65 ? 1 : (1 - age) / 0.35;

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 244, 166, .95)";
  ctx.lineWidth = 9 * (1 - age * 0.35);
  ctx.beginPath();
  ctx.arc(centerX, centerY, 39 + age * 14, start, end, side < 0);
  ctx.stroke();

  ctx.strokeStyle = "rgba(115, 228, 255, .75)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 51 + age * 10, start + side * 0.1, end, side < 0);
  ctx.stroke();
  ctx.restore();
}

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

function setupRuleModeSelect() {
  if (!ruleModeSelect) return;
  const optionsHtml = `
    <option value="original">${localizedRuleModeLabel("original")}</option>
    <option value="modified">${localizedRuleModeLabel("modified")}</option>
  `;
  const current = state.ruleModeKey || "original";
  ruleModeSelect.innerHTML = optionsHtml;
  ruleModeSelect.value = current;
  if (ruleModeSelect.value !== current) ruleModeSelect.value = "original";
  ruleModeSelect.setAttribute("aria-label", localizedRuleModeLabel(ruleModeSelect.value));
}

function setupDeathModeSelect() {
  if (!deathModeSelect) return;
  const optionsHtml = `
    <option value="death_command">${localizedDeathModeLabel("death_command")}</option>
    <option value="death_heal">${localizedDeathModeLabel("death_heal")}</option>
  `;
  const current = state.deathModeKey || "death_heal";
  deathModeSelect.innerHTML = optionsHtml;
  deathModeSelect.value = current;
  if (deathModeSelect.value !== current) deathModeSelect.value = "death_heal";
  deathModeSelect.setAttribute("aria-label", localizedDeathModeLabel(deathModeSelect.value));
}

function localizedLookLabel(look) {
  if (!look) return "";
  if (look.labelKey && roomLocaleText[look.labelKey]) return roomLocaleText[look.labelKey];
  return look.label || "";
}

function battleUnitName(unit) {
  if (!unit) return "";
  const lookLabel = localizedLookLabel(unitLookDefinition(unit));
  if (lookLabel && lookLabel !== roomLocaleText.defaultLookOption) return lookLabel;
  if (unit.id === playerUnitId || unit.casterId === playerUnitId) return roomLocaleText.topHudName;
  if (unit.controlMode) return localizedControlModeLabel(unit.controlMode);
  return unit.name || roomTeamLabel(unit.team);
}

// 繪製角色名稱標籤（name_bar 背景 + 居中文字）。
function drawUnitName(unit, x, y) {
  ctx.save();
  ctx.font = "700 11px Microsoft JhengHei, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = battleUnitName(unit);
  const textW = ctx.measureText(label).width;
  const NW = Math.max(66, textW + 22);
  const NH = 16;
  if (images.nameBar) {
    ctx.drawImage(images.nameBar, x - NW / 2, y - NH / 2, NW, NH);
  } else {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(x - NW / 2, y - NH / 2, NW, NH);
  }
  ctx.fillStyle = unit.team === "blue" ? "#123f9d" : "#d2d2d2";
  ctx.fillText(label, x, y);
  ctx.restore();
}

// 在玩家角色頭上繪製白色手指指示器（bob 動畫）。
function drawPlayerArrow(p) {
  const img = images.playerPointer;
  if (!img) return;
  const now = performance.now();
  const bob = Math.sin(now / 350) * 3;
  const w = img.width, h = img.height;
  ctx.drawImage(img, p.x - w / 2, p.y - 47 - h - 4 + bob, w, h);
}

// 射出動畫專用眼睛繪製：錨點已由 placement 推算好，直接依面向畫眼睛。
function drawMoneyDartShootEye(unit, facing, anchor, cfg) {
  if (!cfg) return;
  if (unitLookDefinition(unit).drawEyes === false) return;
  if (facing === "left" || facing === "right") {
    const img = unitEyeSideSprite(unit);
    if (!img) return;
    ctx.save();
    if (facing === "left") {
      ctx.translate(anchor.x + cfg.w, anchor.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, cfg.w, cfg.h);
    } else {
      ctx.drawImage(img, anchor.x, anchor.y, cfg.w, cfg.h);
    }
    ctx.restore();
  } else if (facing === "down") {
    const img = unitEyeFrontSprite(unit);
    if (!img) return;
    ctx.drawImage(img, anchor.x, anchor.y, cfg.w, cfg.h);
  }
  // up 不顯示眼睛
}

// 疊加角色眼睛。左右只顯示單眼；上下顯示雙眼。
function drawUnitEyes(unit, p, bob = 0, offsetTable = eyeOffsets) {
  if (unitLookDefinition(unit).drawEyes === false) return;
  const facing = unit.facing || "down";
  const offset = Object.prototype.hasOwnProperty.call(offsetTable, facing) ? offsetTable[facing] : offsetTable.down;
  if (!offset) return;

  if (facing === "left" || facing === "right") {
    const sideEye = unitEyeSideSprite(unit);
    if (!sideEye) return;
    ctx.save();
    if (facing === "left") {
      // 左向改用鏡像（依目前素材方向做對調）。
      ctx.translate(p.x + offset.x + offset.w, p.y - offset.y + bob);
      ctx.scale(-1, 1);
      ctx.drawImage(sideEye, 0, 0, offset.w, offset.h);
    } else {
      // 右向改用原圖（依目前素材方向做對調）。
      ctx.drawImage(sideEye, p.x + offset.x, p.y - offset.y + bob, offset.w, offset.h);
    }
    ctx.restore();
    return;
  }

  const frontEyes = unitEyeFrontSprite(unit);
  if (!frontEyes) return;
  ctx.drawImage(frontEyes, p.x + offset.x, p.y - offset.y + bob, offset.w, offset.h);
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

// 依角色移動進度計算畫面上的平滑位置。
function unitPosition(unit) {
  const target = cellCenter(unit.x, unit.y);
  if (unit.moveT >= 1) return target;
  const from = cellCenter(unit.fromX, unit.fromY);
  const t = 1 - Math.pow(1 - unit.moveT, 3);
  unit.moveT = Math.min(1, unit.moveT + 0.08);
  return { x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t };
}

function unitMoveDirection(unit) {
  const dx = unit.x - unit.fromX;
  const dy = unit.y - unit.fromY;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  if (dy !== 0) return dy > 0 ? "down" : "up";
  return unit.facing || "down";
}

function unitMoveSprite(unit, direction, progress) {
  const team = unitLookDefinition(unit).moveSet || (unit.team === "blue" ? "blue" : "grey");
  const frameSet = progress < 0.35 ? movePrearriveFrames : moveArriveFrames;
  const frames = frameSet[team]?.[direction] || [];
  const available = frames.filter(Boolean);
  if (!available.length) return null;
  const localProgress = progress < 0.35 ? progress / 0.35 : (progress - 0.35) / 0.65;
  const index = Math.min(available.length - 1, Math.floor(localProgress * available.length));
  return available[index];
}

function unitUseNinjuSprite(unit) {
  if (!unit || unit.moneyDart || !isUnitCastingNinju(unit)) return null;
  const team = unitLookDefinition(unit).useNinjuSet || (unit.team === "blue" ? "blue" : "grey");
  const frames = (useNinjuFrames[team] || []).filter(Boolean);
  if (!frames.length) return null;
  const progress = Math.min(0.999, (performance.now() - unit.ninju.startedAt) / unit.ninju.duration);
  return frames[Math.floor(progress * frames.length)];
}

function moveEffectPhase(progress) {
  return progress < 0.35 ? "prearrive" : "arrive";
}

function drawUnitImage(sprite, p, bob = 0, naturalSize = false, direction = "down", phase = "arrive") {
  if (!naturalSize) {
    ctx.drawImage(sprite, p.x - 31, p.y - 47 + bob, 62, 62);
    return;
  }
  const offset = moveEffectOffsets[phase]?.[direction] || { x: 0, y: 0 };
  const yOffset = sprite.height > sprite.width ? 78 : 26;
  ctx.drawImage(sprite, p.x - sprite.width / 2 + offset.x, p.y - yOffset + bob - offset.y);
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

function selectedLookKey(team, slot) {
  if (selectedControlMode(team, slot) === "ai_red") return "red";
  if (team !== "blue") return "default";
  const select = lookSelectEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  return lookDefinitions[select?.value] ? select.value : "default";
}

// 從房間畫面進入正式戰鬥。
function startBattleFromRoom() {
  setRoomMap(roomMapSelect?.value);
  state.inRoom = false;
  document.body.classList.remove("room-mode");
  resetRestartHold();
  resetGame();
  syncBgm();
  startBgm();
}

function returnToRoom() {
  syncRoomInventoryFromPlayerUnit();
  if (state.endSoundInstance) {
    state.endSoundInstance.pause();
    state.endSoundInstance.currentTime = 0;
    state.endSoundInstance = null;
  }
  state.inRoom = true;
  state.result = null;
  state.resultClickableAt = 0;
  state.gameOver = false;
  state.matchStart = 0;
  state.matchEnd = 0;
  state.countdownStart = 0;
  state.pressedUnit = null;
  state.dragMoved = false;
  state.charging = false;
  state.attacks = [];
  state.projectiles = [];
  state.ninjuDamageEffects = [];
  state.consumableEffects = [];
  state.moneyDartCasts = [];
  state.cloneDecoys = [];
  clearDragState();
  resetRestartHold();
  document.body.classList.add("room-mode");
  updateRuleModeUi();
  updateDeathModeUi();
  updateRoomMapUi();
  renderRoomCards();
  syncBgm();
  startBgm();
  setMessage("回到房間。");
}

// 結算畫面點一下回房間，並保留房間原本配置（卡片啟用、武器、控制模式、HP）。
function returnToRoomFromResult() {
  returnToRoom();
}

function updateRuleModeUi() {
  if (!ruleModeSelect) return;
  ruleModeSelect.value = state.ruleModeKey || "original";
  if (ruleModeSelect.value !== (state.ruleModeKey || "original")) ruleModeSelect.value = "original";
  ruleModeSelect.setAttribute("aria-label", localizedRuleModeLabel(ruleModeSelect.value));
}

function updateDeathModeUi() {
  if (!deathModeSelect) return;
  deathModeSelect.value = state.deathModeKey || "death_heal";
  if (deathModeSelect.value !== (state.deathModeKey || "death_heal")) deathModeSelect.value = "death_heal";
  deathModeSelect.setAttribute("aria-label", localizedDeathModeLabel(deathModeSelect.value));
}

function updateRoomMapUi() {
  if (!roomMapSelect) return;
  roomMapSelect.value = state.roomMapKey || defaultRoomMapKey;
  if (roomMapSelect.value !== (state.roomMapKey || defaultRoomMapKey)) roomMapSelect.value = defaultRoomMapKey;
  state.roomMapKey = roomMapSelect.value;
  roomMapSelect.setAttribute("aria-label", roomLocale().mapSelect);
}

function roomMapOptionLabel(mapDefinition, key) {
  return mapDefinition.label || key;
}

function setupRoomMapSelect() {
  if (!roomMapSelect) return;
  const previousValue = roomMapSelect.value || state.roomMapKey || defaultRoomMapKey;
  roomMapSelect.innerHTML = roomMapDefinitionEntries().map(([key, mapDefinition]) => {
    const selected = key === previousValue ? " selected" : "";
    return `<option value="${key}"${selected}>${roomMapOptionLabel(mapDefinition, key)}</option>`;
  }).join("");
  roomMapSelect.value = roomMapDefinitions[previousValue] ? previousValue : defaultRoomMapKey;
  updateRoomMapUi();
}

function startRestartHold(event) {
  if (event.code !== "KeyR" || state.inRoom) return;
  if (!restartHoldStartedAt) restartHoldStartedAt = performance.now();
}

function stopRestartHold(event) {
  if (event.code !== "KeyR") return;
  resetRestartHold();
}

function resetRestartHold() {
  restartHoldStartedAt = 0;
  restartHoldTriggered = false;
}

function updateRestartHold(now) {
  if (!restartHoldStartedAt || restartHoldTriggered || state.inRoom) return;
  if (now - restartHoldStartedAt < 3000) return;
  restartHoldTriggered = true;
  returnToRoom();
}

function setRuleMode(modeKey) {
  state.ruleModeKey = modeKey === "modified" ? modeKey : "original";
  updateRuleModeUi();
}

function setRoomMap(mapKey) {
  const nextMapKey = roomMapDefinitions[mapKey] ? mapKey : defaultRoomMapKey;
  const mapChanged = state.roomMapKey !== nextMapKey;
  state.roomMapKey = nextMapKey;
  updateRoomMapUi();
  if (mapChanged && state.inRoom) state.objects = buildMapObjects();
}

function openNinjuEditor() {
  if (!ninjuEditorEl) return;
  closeRoomShop();
  editNinjuDraft = [...selectedNinjuLoadout];
  editNinjuSlotIndex = 0;
  renderNinjuEditor();
  ninjuEditorEl.hidden = false;
}

function closeNinjuEditor() {
  if (ninjuEditorEl) ninjuEditorEl.hidden = true;
}

function openRoomShop() {
  if (!roomShopEl) return;
  closeNinjuEditor();
  renderRoomShopBag();
  roomShopEl.hidden = false;
}

function closeRoomShop() {
  if (roomShopEl) roomShopEl.hidden = true;
}

function renderRoomShopBag() {
  roomShopBagSlotEls.forEach((slotEl, index) => {
    const itemType = state.roomItemSlots[index] || "";
    delete slotEl.dataset.shopItem;
    slotEl.replaceChildren();
    if (!itemType) return;
    const src = itemIconSourceByType(itemType);
    if (!src) return;
    slotEl.dataset.shopItem = itemType;
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    slotEl.appendChild(img);
  });
}

function purchaseShopItem(itemEl) {
  if (!itemEl) return;
  const itemType = itemEl.dataset.shopItem || "";
  if (!isImplementedConsumable(itemType)) return;
  const slotIndex = firstEmptyItemSlot(state.roomItemSlots);
  if (slotIndex < 0) {
    setMessage("道具欄已滿。");
    return;
  }
  state.roomItemSlots[slotIndex] = itemType;
  applyRoomInventoryToPlayerUnit();
  notifyRoomInventoryChanged();
  playSound("shopMoveItem");
  setMessage(`購買${itemLabel(itemType)}。`);
}

function removeRoomShopBagItem(index) {
  const itemType = state.roomItemSlots[index] || "";
  if (!itemType) return;
  state.roomItemSlots[index] = "";
  applyRoomInventoryToPlayerUnit();
  notifyRoomInventoryChanged();
  playSound("shopMoveItem");
  setMessage(`移除${itemLabel(itemType)}。`);
}

function saveNinjuEditor() {
  selectedNinjuLoadout = normalizedNinjuLoadout(editNinjuDraft);
  window.localStorage.setItem(ninjuLoadoutStorageKey, JSON.stringify(selectedNinjuLoadout));
  closeNinjuEditor();
}

function loadSavedNinjuLoadout() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(ninjuLoadoutStorageKey) || "null");
    if (Array.isArray(saved) && saved.length === 6 && saved.every((type) => !type || ninjuByType[type])) return normalizedNinjuLoadout(saved);
  } catch (_) {
    // Ignore broken localStorage data and fall back to the default six slots.
  }
  return [...defaultNinjuLoadout];
}

function normalizedNinjuLoadout(loadout) {
  return Array.from({ length: 6 }, (_, index) => (ninjuByType[loadout[index]] ? loadout[index] : null));
}

function resetNinjuEditorLoadout() {
  editNinjuDraft = Array(6).fill(null);
  editNinjuSlotIndex = 0;
  renderNinjuEditor();
}

function renderNinjuEditor() {
  if (!ninjuEditorSlotsEl || !ninjuEditorListEl) return;
  ninjuEditorSlotsEl.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const type = editNinjuDraft[i];
    const ninju = ninjuByType[type] || { label: roomLocale().emptySlot, editorRow: "" };
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ninju-slot-choice${i === editNinjuSlotIndex ? " selected" : ""}${type ? "" : " empty"}`;
    if (type) button.dataset.ninjuType = type;
    if (ninju.editorRow) button.dataset.editorRow = ninju.editorRow;
    button.textContent = localizedNinjuLabel(ninju);
    button.style.fontSize = `${localizedNinjuFontSize(18)}px`;
    button.addEventListener("click", () => {
      editNinjuDraft[i] = null;
      editNinjuSlotIndex = i;
      renderNinjuEditor();
    });
    ninjuEditorSlotsEl.appendChild(button);
  }

  ninjuEditorListEl.innerHTML = "";
  for (const ninju of ninjuEditorCatalog) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ninju-option ${ninju.group}${editNinjuDraft.includes(ninju.type) ? " selected" : ""}`;
    button.dataset.ninjuType = ninju.type;
    button.dataset.editorRow = ninju.editorRow;
    button.style.setProperty("--editor-order", ninju.editorOrder);
    button.textContent = localizedNinjuLabel(ninju);
    button.style.fontSize = `${localizedNinjuFontSize(18)}px`;
    button.addEventListener("click", () => {
      const existingIndex = editNinjuDraft.indexOf(ninju.type);
      if (existingIndex >= 0) editNinjuDraft[existingIndex] = null;
      const emptyIndex = editNinjuDraft.findIndex((type) => !type);
      if (emptyIndex < 0) return;
      editNinjuDraft[emptyIndex] = ninju.type;
      const nextEmptyIndex = editNinjuDraft.findIndex((type) => !type);
      editNinjuSlotIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : emptyIndex;
      renderNinjuEditor();
    });
    ninjuEditorListEl.appendChild(button);
  }
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

