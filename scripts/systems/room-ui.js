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

function selectedWeaponKey(team, slot) {
  const controlMode = selectedControlMode(team, slot);
  if (controlMode === "ai_red") return "weapon8";
  if (controlMode === "ai_tachi_master") return "weapon3";
  const select = weaponSelectEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  return weaponDefinitionByKey[select?.value] ? select.value : defaultWeaponKey;
}

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

function selectedLookKey(team, slot) {
  if (selectedControlMode(team, slot) === "ai_red") return "red";
  if (team !== "blue") return "default";
  const select = lookSelectEls.find((element) => element.dataset.team === team && Number(element.dataset.slot) === slot);
  return lookDefinitions[select?.value] ? select.value : "default";
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
