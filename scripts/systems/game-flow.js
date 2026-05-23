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

function returnToRoomFromResult() {
  returnToRoom();
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
