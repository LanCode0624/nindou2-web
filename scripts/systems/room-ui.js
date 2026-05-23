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
