// ===== Battle Setup =====
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
