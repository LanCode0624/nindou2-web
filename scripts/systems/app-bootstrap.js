// ===== App Bootstrap =====
function bindGameEvents() {
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("keydown", startRestartHold);
  window.addEventListener("keyup", stopRestartHold);
  resetBtn.addEventListener("click", resetGame);
  resetBtn.addEventListener("click", startBgm);
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
}

function setupRoomUi() {
  setupRuleModeSelect();
  setupDeathModeSelect();
  setupWeaponSelects();
  setupControlSelects();
  setupHpInputs();
  setupSkillInputs();
  setupRoomSlots();
  state.onRoomInventoryChanged = renderRoomShopBag;
  applyRoomLanguage();
}

function startGameApp() {
  bindGameEvents();
  setupRoomUi();
  loadImages().then(() => {
    updateRuleModeUi();
    updateDeathModeUi();
    updateRoomMapUi();
    applyVolumeControls();
    resetGame();
    startBgm();
    draw();
  });
}

startGameApp();
