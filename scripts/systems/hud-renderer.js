// ===== Rendering: HUD =====
// 繪製遊戲中的上方與下方 HUD。
function drawGameHud() {
  drawSoulHud();
  drawTopHud();
  drawBottomPlayerHud();
  drawInventoryHud();
}

// Draws the soul HUD over the map, above the HP bar area.
function drawSoulHud() {
  const x = 16; // soul HUD X: bigger moves right.
  const y = 470; // soul HUD Y: bigger moves down.
  const w = 284; // soul HUD width.
  const h = 66; // soul HUD height.
  const barY = y + 44; // soul fill Y: bigger moves down.
  const barH = 7; // soul fill height.
  const tickXs = [61, 101, 154, 214, 275]; // soul tick X offsets: 0, soul1, soul2, soul3, soul4.
  const unit = selectedHudUnit();
  const soulSteps = Math.min(soulStepsPerLevel * soulMaxLevel, Math.max(0, unit?.soulSteps || 0));
  const totalProgress = soulSteps / (soulStepsPerLevel * soulMaxLevel);
  const completedLevel = Math.min(soulMaxLevel, Math.floor(soulSteps / soulStepsPerLevel));
  const segmentProgress = completedLevel >= soulMaxLevel ? 1 : (soulSteps % soulStepsPerLevel) / soulStepsPerLevel;
  const imageLevel = completedLevel <= 0 ? 1 : completedLevel + 1;
  const imageKey = `soulHud${Math.min(5, imageLevel)}`;
  const fillColors = ["#1b7a2d", "#1b7a2d", "#20248b", "#8c178e", "#c92116"]; // soul bar colors by completed level.
  ctx.save();
  if (images[imageKey]) {
    ctx.drawImage(images[imageKey], x, y, w, h);
  }
  if (totalProgress > 0) {
    const fromTick = tickXs[completedLevel];
    const toTick = tickXs[Math.min(soulMaxLevel, completedLevel + 1)];
    const fillEndOffset = completedLevel >= soulMaxLevel ? tickXs[soulMaxLevel] : fromTick + (toTick - fromTick) * segmentProgress;
    const barX = x + tickXs[0];
    const fillEndX = x + fillEndOffset;
    const fill = Math.max(0, fillEndX - barX);
    ctx.fillStyle = fillColors[completedLevel] || fillColors[0];
    ctx.fillRect(barX, barY, fill, barH);
  }
  ctx.restore();
}

// 繪製上方玩家名稱、段數與段位文字。
function drawTopHud() {
  const text = roomLocale();
  ctx.save();
  ctx.fillStyle = "rgba(6, 47, 55, .5)"; // 上方藍底顏色/透明度：最後的 .7 是透明度，0 完全透明，1 完全不透明。
  ctx.fillRect(0, 0, canvas.width, 32); // 上方藍底位置/大小：第一個數字 X，第二個數字 Y，第四個數字高度；數字變大會往右/往下/變高。
  ctx.textBaseline = "middle";
  drawIconImage(images.blueIcon, 38, 5, 35, 25); // 左上人頭位置/大小：X=38 往右，Y=18 往下，W=42 寬度，H=31 高度。
  drawOutlinedText(text.topHudName, 118, 18, 17, "#f4f3dd", "left"); // 上方玩家名稱位置/大小/顏色
  drawOutlinedText(text.topHudLevel, 294, 18, 18, "#f4f3dd", "center"); // 上方段數位置/大小/顏色
  drawOutlinedText(text.topHudRole, 372, 18, 18, "#f4f3dd", "center"); // 上方段位位置/大小/顏色
  const unit = state.units.find((u) => u.id === playerUnitId);
  if (unit) {
    const coord = displayCellCoord(unit);
    drawOutlinedText(`${text.cellLabel} [${coord.x},${coord.y}]`, grid.left + grid.cols * grid.cell - 52, 18, 13, "#d9f4ff", "right"); // 右上角目前角色座標位置/大小/顏色
  }
  ctx.restore();
}

// 繪製左下角體、技、武器、德、金區塊。
function drawBottomPlayerHud() {
  const unit = selectedHudUnit();
  const hpRatio = unit ? Math.max(0, unit.hp / (unit.maxHp || maxHp)) : 0;
  const skillRatio = unit ? Math.max(0, unit.skill / (unit.skillMax || maxSkill)) : 0;
  const hpText = unit ? `${Math.max(0, Math.round(unit.hp))}/${Math.round(unit.maxHp || maxHp)}` : `0/${Math.round(maxHp)}`;
  const text = roomLocale();

  ctx.save();
  drawHudBar(45, 574, 165, 30, hpRatio, "#a057be", text.hpBadge, hpText); // 體條位置/大小/填滿顏色
  drawHudBar(262, 574, 165, 30, skillRatio, "#38c2f2", text.skillBadge); // 技條位置/大小/填滿顏色
  drawOutlinedText(text.weaponBadge, 35, 654, 18, "#f0f0df", "center"); // 武字位置/大小/顏色 X:35(間隔15)
  drawMoneyBox(50, 642, "", 95); // 武器名稱框位置/寬度 X:50+100=150
  drawOutlinedText(text.repBadge, 175, 654, 18, "#f0f0df", "center"); // 德字位置/大小/顏色 X:180(30)
  drawMoneyBox(190, 642, "0", 95); // 德數值框位置/寬度 195(15)
  drawOutlinedText(text.goldBadge, 315, 654, 18, "#f0f0df", "center"); // 金字位置/大小/顏色
  drawMoneyBox(330, 642, "0", 95); // 金數值框位置/寬度
  ctx.restore();
}

// 繪製體力或技力條。
function drawHudBar(x, y, w, h, ratio, color, label, valueText = "") {
  ctx.save();
  ctx.fillStyle = "#26302c"; // 體/技條外框底色
  ctx.strokeStyle = "#d4a85e"; // 體/技條外框線顏色
  ctx.lineWidth = 2; // 體/技條外框線粗細
  ctx.fillRect(x, y, w, h); // 體/技條外框位置/大小
  ctx.strokeRect(x, y, w, h); // 體/技條外框線位置/大小
  ctx.fillStyle = "#080808"; // 體/技條內部未填滿底色
  ctx.fillRect(x + 6, y + 6, w - 12, h - 12); // 體/技條內部底色位置/大小
  ctx.fillStyle = color; // 體/技條目前值填滿顏色
  ctx.fillRect(x + 6, y + 6, (w - 12) * ratio, h - 12); // 體/技條目前值位置/大小
  ctx.fillStyle = "#4a4a3d"; // 體/技圓標底色
  ctx.beginPath();
  ctx.arc(x - 10, y + h / 2, 20, 0, Math.PI * 2); // 體/技圓標位置/半徑
  ctx.fill();
  ctx.stroke();
  drawOutlinedText(label, x - 10, y + h / 2 + 1, 19, "#e9f3dc", "center"); // 體/技字位置/大小/顏色
  if (valueText) {
    // 在 HUD 條中央顯示精確數值，避免只看比例條。
    ctx.font = "700 15px Microsoft JhengHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(valueText, x + w / 2, y + h / 2 + 1);
    ctx.fillStyle = "#fff7d6";
    ctx.fillText(valueText, x + w / 2, y + h / 2 + 1);
  }
  ctx.restore();
}

// 繪製武器名稱、德、金等數值框。
function drawMoneyBox(x, y, text, w = 180) {
  ctx.save();
  if (images.moneyPanel) {
    ctx.drawImage(images.moneyPanel, x, y - 4, w, 30); // 武器/德/金框圖片位置/大小
  } else {
    ctx.fillStyle = "#2a9cca"; // 武器/德/金框底色
    ctx.fillRect(x, y - 4, w, 30); // 武器/德/金框位置/大小
  }
  ctx.strokeStyle = "#041316"; // 武器/德/金框線顏色
  ctx.lineWidth = 3; // 武器/德/金框線粗細
  ctx.strokeRect(x, y - 4, w, 30); // 武器/德/金框線位置/大小
  ctx.fillStyle = "#38c2f2"; // 武器/德/金數值文字顏色
  ctx.font = "700 18px Microsoft JhengHei, sans-serif"; // 武器/德/金數值文字大小/粗細
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + w / 2, y + 11); // 武器/德/金數值文字位置
  ctx.restore();
}

// 繪製右下道具列、忍術列與存活人數。
function drawInventoryHud() {
  const itemY = itemSlotY; // 道具列 Y 位置
  const ninjuY = 600; // 忍術列 Y 位置
  const startX = itemSlotStartX; // 道具格起始 X 位置
  const slotW = itemSlotW; // 道具格寬度
  const gap = itemSlotGap; // 道具格間距
  const text = roomLocale();
  const unit = selectedHudUnit();

  ctx.save();
  drawOutlinedText(text.itemBadge, 482, itemY + 14, 22, "#f0f0df", "center"); // 道字位置/大小/顏色
  drawOutlinedText(text.ninjuBadge, 482, ninjuY + 15, 22, "#f0f0df", "center"); // 術字位置/大小/顏色

  for (let i = 0; i < 10; i++) {
    const x = startX + i * (slotW + gap); // 第 i 個道具格 X 位置
    const itemType = unit?.itemSlots?.[i] || "";
    drawItemSlot(x, itemY, slotW, itemSlotH, Boolean(itemType)); // 道具格位置/大小
    drawInventoryItemHud(itemType, x, itemY);
  }

  const ninjuLabels = ["", "", "", "", "", ""];
  for (let i = 0; i < ninjuLabels.length; i++) {
    const x = 510 + i * 75; // 第 i 個忍術格 X 位置/間距
    drawNinjuSlot(x, ninjuY, 60, 30, ninjuLabels[i], false); // 忍術空框位置/大小，先畫在按鈕後面
  }

  for (const button of currentNinjuButtonList()) {
    drawNinjuSlot(button.x, button.y, button.w, button.h, button.label, button.type);
  }

  drawSmallCounter(476, 644, "#2479a9", String(teamAliveCount("blue"))); // blue 存活數位置/顏色
  drawSmallCounter(476, 670, "#d8d8d8", String(teamAliveCount("grey"))); // grey 存活數位置/顏色
  ctx.restore();
}

function itemSlotRect(index) {
  return {
    x: itemSlotStartX + index * (itemSlotW + itemSlotGap),
    y: itemSlotY,
    w: itemSlotW,
    h: itemSlotH,
  };
}

// 繪製單一空道具格。
function drawItemSlot(x, y, w, h, filled) {
  ctx.save();
  ctx.fillStyle = filled ? "#12626d" : "#163f49";
  ctx.strokeStyle = "#5eb5b3";
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(x + 4, y + 3, w - 8, 4);
  ctx.restore();
}

function drawInventoryItemHud(type, x, y) {
  if (!type) return;
  const img = itemIconByType(type);
  ctx.save();
  if (img) {
    const size = 23;
    const scale = Math.min(size / Math.max(1, img.width), size / Math.max(1, img.height));
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, x + 19 - w / 2, y + 17 - h / 2, w, h);
  }
  ctx.restore();
}

function itemIconByType(type) {
  if (type === "backup3") return images.backup3Item;
  if (type === "sake4") return images.sake4Item;
  return null;
}

function itemIconSourceByType(type) {
  if (type === "backup3") return imageSources.backup3Item;
  if (type === "sake4") return imageSources.sake4Item;
  return "";
}

// 繪製單一忍術按鈕或空忍術框。
function drawNinjuSlot(x, y, w, h, text, type) {
  const unit = selectedHudUnit();
  const isSteel = type === true || type === "steel";
  const isHotBlood = type === "hotBlood";
  const isAttackNinju = Boolean(attackNinjuConfigs[type]);
  const isSpecialNinju = Boolean(specialNinjuConfigs[type]);
  const isHeal = type === "genki" || type === "kakki" || type === "shinki";
  const isMoneyDart = type === "moneyDart";
  const isStatusButton = isSteel || isHotBlood || isHeal || isAttackNinju || isSpecialNinju;
  const statusRule = isStatusButton ? statusButtonRule(type) : null;
  const moneyDartCost = isMoneyDart ? moneyDartRule().cost : 0;
  const active = unit && (isStatusButton ? ((unit.ninju?.type === type && (isUnitCastingNinju(unit) || isUnitInNinjuGap(unit))) || (isSteel ? isSteelDefenseActive(unit) : isHotBlood ? isHotBloodActive(unit) : false)) : false);
  const hasAttackSoul = !isAttackNinju || attackNinjuSoulLevel(unit) >= 1;
  const hasRequiredSkill = !isStatusButton || isAttackNinju || unit.skill >= statusRule.cost;
  // 錢鏢：拿標中、射後鎖定期間、移動動畫中 → 暗色不可用；否則亮色可用
  const moneyDartMoving = unit.moveTrail && (performance.now() - unit.moveTrail.startedAt) < ARRIVE_TOTAL;
  const moneyDartReady = isMoneyDart && unit.skill >= moneyDartCost && !unit.moneyDart && !activeMoneyDartCast(unit) && !moneyDartMoving && performance.now() >= (unit.ninjuLockedUntil || 0);
  const canUseNinjuInput = !unit || !isUnitDisabled(unit) || canUseNinjuDuringConsumable(unit);
  const ready = !unit || (unit.alive && canUseNinjuInput && (isStatusButton ? statusRule.available !== false && hasRequiredSkill && hasAttackSoul : moneyDartReady));
  ctx.save();
  if (isAttackNinju && images.flashButton) {
    ctx.globalAlpha = ready ? 1 : 0.55;
    ctx.drawImage(images.flashButton, x, y, w, h);
    ctx.globalAlpha = 1;
    const textAt = applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 }); // text offset: x positive moves right, y positive moves up.
    drawNinjuButtonText(text, textAt.x, textAt.y, localizedNinjuFontSize(16), "#232323f8", "center");
  } else if (isSpecialNinju && images.moneyDartButton) {
    ctx.globalAlpha = ready ? 1 : 0.55;
    ctx.drawImage(images.moneyDartButton, x, y, w, h);
    ctx.globalAlpha = 1;
    const textAt = applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 });
    drawNinjuButtonText(text, textAt.x, textAt.y, localizedNinjuFontSize(16), "#232323f8", "center");
  } else if ((isSteel || isHotBlood) && images.steelButton) {
    ctx.globalAlpha = ready ? 1 : 0.55;
    ctx.drawImage(images.steelButton, x, y, w, h);
    ctx.globalAlpha = 1;
    const textAt = applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 }); // 忍術字 offset：x 正值往右、y 正值往上。
    drawNinjuButtonText(text, textAt.x, textAt.y, localizedNinjuFontSize(16), "#232323f8", "center");
  } else if (isHeal && images.healButton) {
    ctx.globalAlpha = ready ? 1 : 0.55;
    ctx.drawImage(images.healButton, x, y, w, h);
    ctx.globalAlpha = 1;
    const textAt = applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 }); // 忍術字 offset：x 正值往右、y 正值往上。
    drawNinjuButtonText(text, textAt.x, textAt.y, localizedNinjuFontSize(16), "#232323f8", "center");
  } else if (isMoneyDart && images.moneyDartButton) {
    ctx.globalAlpha = ready ? 1 : 0.55;
    ctx.drawImage(images.moneyDartButton, x, y, w, h);
    ctx.globalAlpha = 1;
    const textAt = applyOffset({ x: x + w / 2, y: y + h / 2 }, { x: -1, y: -1 }); // 忍術字 offset：x 正值往右、y 正值往上。
    drawNinjuButtonText(text, textAt.x, textAt.y, localizedNinjuFontSize(16), "#232323f8", "center");
  } else {
    ctx.fillStyle = text ? "#c78e42" : "#2d3d38";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#77bec6";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    if (text) drawOutlinedText(text, x + w / 2, y + h / 2 + 1, localizedNinjuFontSize(15), "#ffe6a6", "center");
  }
  if (active) {
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(x, y, w, h);
  }
  if ((isSteel || isHotBlood || isHeal || isAttackNinju || isSpecialNinju) && unit && unit.ninju?.type === type && unit.ninju.queue > 0) {
    drawOutlinedText(`x${unit.ninju.queue + 1}`, x + w - 10, y + 8, 12, "#fff2a8", "center");
  }
  ctx.restore();
}

function currentNinjuButtonRects() {
  return {
    moneyDart: typeof moneyDartButtonRect !== "undefined" ? moneyDartButtonRect : { x: 508, y: 600, w: 65, h: 30 },
    steel: typeof steelButtonRect !== "undefined" ? steelButtonRect : { x: 582, y: 600, w: 65, h: 30 },
    hotBlood: typeof hotBloodButtonRect !== "undefined" ? hotBloodButtonRect : { x: 656, y: 600, w: 65, h: 30 },
    genki: typeof genkiButtonRect !== "undefined" ? genkiButtonRect : { x: 730, y: 600, w: 65, h: 30 },
    kakki: typeof kakkiButtonRect !== "undefined" ? kakkiButtonRect : { x: 804, y: 600, w: 65, h: 30 },
    shinki: typeof shinkiButtonRect !== "undefined" ? shinkiButtonRect : { x: 878, y: 600, w: 65, h: 30 },
  };
}

function currentNinjuButtonList() {
  const slots = currentNinjuSlotRects();
  return selectedNinjuLoadout.map((type, index) => {
    if (!type || !ninjuByType[type]) return null;
    const source = slots[index] || slots[0];
    const ninju = ninjuByType[type] || { label: type };
    return {
      ...source,
      // Slot offset is intentional: user-tuned +0/+1/+2/+3/+4/+5 alignment.
      x: source.x + index,
      type,
      label: localizedNinjuLabel(ninju),
    };
  }).filter(Boolean);
}

function currentNinjuSlotRects() {
  const rects = currentNinjuButtonRects();
  return [rects.moneyDart, rects.steel, rects.hotBlood, rects.genki, rects.kakki, rects.shinki];
}

function statusButtonRule(type) {
  if (attackNinjuConfigs[type]) return attackNinjuRule(type);
  if (specialNinjuConfigs[type]) return specialNinjuRule(type);
  if (type === "hotBlood" && typeof hotBloodRule === "function") return hotBloodRule();
  if ((type === "genki" || type === "kakki" || type === "shinki") && typeof healNinjuRule === "function") return healNinjuRule(type);
  if (typeof steelRule === "function") return steelRule();
  return { cost: 7 };
}

function attackNinjuSoulLevel(unit) {
  return Math.min(soulMaxLevel, Math.floor((unit?.soulSteps || 0) / soulStepsPerLevel));
}

function hasReadyAttackNinjuInLoadout(unit) {
  if (!unit || attackNinjuSoulLevel(unit) < 1) return false;
  return selectedNinjuLoadout.some((type) => Boolean(attackNinjuConfigs[type]));
}

// 繪製 blue/grey 存活人數的小圓點計數。
function drawSmallCounter(x, y, color, text) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y - 5, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8f8f5";
  ctx.font = "13px Microsoft JhengHei, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 20, y - 4);
  ctx.restore();
}

function drawNinjuButtonText(text, x, y, size, color, align = "center") {
  ctx.save();
  ctx.font = `700 ${size}px DFKai-SB, KaiTi, Microsoft JhengHei, serif`; // 忍術按鈕字型與字重，size 控字大小。
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color; // 忍術按鈕文字顏色。
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 有圖片就畫圖片，沒有圖片時用灰色方塊替代。
function drawIconImage(img, x, y, w, h) {
  if (img) {
    ctx.drawImage(img, x, y, w, h);
    return;
  }
  ctx.fillStyle = "#cbd5ce";
  ctx.fillRect(x, y, w, h);
}

// 繪製帶黑邊的文字，提高 HUD 可讀性。
function drawOutlinedText(text, x, y, size, color, align = "left") {
  ctx.save();
  ctx.font = `700 ${size}px Microsoft JhengHei, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,.72)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 繪製目前忍術狀態提示條。
function drawNinjuBar() {
  const unit = selectedHudUnit();
  if (!unit) return;
  const text = roomLocale();
  const active = isUnitCastingNinju(unit);
  const gap = isUnitInNinjuGap(unit);
  const steelBuff = isSteelDefenseActive(unit);
  const hotBloodBuff = isHotBloodActive(unit);
  const buff = steelBuff || hotBloodBuff;
  const fallbackCost = hasReadyAttackNinjuInLoadout(unit) ? 0 : steelRule().cost;
  if (!active && !gap && !buff && (!unit.alive || unit.skill >= steelRule().cost)) return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(814, 636, 62, 30);
  const buffUntil = Math.max(unit.steelUntil || 0, unit.hotBloodUntil || 0);
  const displayText = active ? text.ninjuCasting : gap ? text.ninjuMovable : buff ? `${Math.ceil((buffUntil - performance.now()) / 1000)}${text.secondsSuffix}` : `${text.ninjuSkillCostPrefix} ${fallbackCost}`;
  drawOutlinedText(displayText, 845, 651, 14, "#f7f6d7", "center");
  ctx.restore();
}
