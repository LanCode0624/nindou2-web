const steelOutlineCache = new WeakMap();
const hotBloodOutlineCache = new WeakMap();
const sake4OutlineCache = new WeakMap();

function unitSprite(unit) {
  const prefix = unitLookDefinition(unit).spriteSet || (unit.team === "blue" ? "blue" : "grey");
  const suffix = unit.facing.charAt(0).toUpperCase() + unit.facing.slice(1);
  return images[prefix + suffix];
}

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
    up: { x: 0, y: -35, rot: 0 },
    down: { x: 0, y: -35, rot: 0 },
    right: { x: -5, y: -35, rot: -0.3 },
    left: { x: 5, y: -35, rot: 0.3 },
    "up-right": { x: -3, y: -35, rot: 0.15 },
    "up-left": { x: 3, y: -35, rot: -0.15 },
    "down-right": { x: -3, y: -35, rot: 0.2 },
    "down-left": { x: 3, y: -35, rot: -0.2 },
  };
  const off = fireOff[facing] || fireOff.down;
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

function drawSteelSpriteOutline(sprite, p, bob = 0, drawAt = null) {
  drawBuffSpriteOutline(sprite, p, bob, steelOutlineCache, "#5feeff", "#39e8ff", 2, 7, drawAt);
}

function drawHotBloodSpriteOutline(sprite, p, bob = 0, drawAt = null) {
  drawBuffSpriteOutline(sprite, p, bob, hotBloodOutlineCache, "#ff2d24", "#ff1f1a", 2, 7, drawAt);
}

function drawSake4SpriteOutline(sprite, p, bob = 0, drawAt = null) {
  drawBuffSpriteOutline(sprite, p, bob, sake4OutlineCache, "#ffd94d", "#ffbf1f", 2, 9, drawAt);
}

function drawBuffAuraSpriteOutline(auraType, sprite, p, bob = 0, drawAt = null) {
  if (auraType === "steel") drawSteelSpriteOutline(sprite, p, bob, drawAt);
  if (auraType === "hotBlood") drawHotBloodSpriteOutline(sprite, p, bob, drawAt);
  if (auraType === "sake4") drawSake4SpriteOutline(sprite, p, bob, drawAt);
}

function drawBuffSpriteOutline(sprite, p, bob, cache, fill, shadow, outlineWidth, shadowBlur, drawAt = null) {
  const mask = spriteColorMask(sprite, cache, fill);
  if (!mask) return;
  let x, y, w, h;
  if (drawAt) {
    ({ x, y, w, h } = drawAt);
  } else {
    const offset = { x: -31, y: 47 };
    const at = applyOffset({ x: p.x, y: p.y + bob }, offset);
    x = at.x;
    y = at.y;
    w = 62;
    h = 62;
  }
  const pulse = 0.66 + Math.sin(performance.now() / 170) * 0.1;

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

function applyOffset(anchor, offset) {
  return { x: anchor.x + offset.x, y: anchor.y - offset.y };
}

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

function drawHeldMoneyDart(unit, p) {
  if (!unit.moneyDart) return;
  const now = performance.now();
  const elapsed = now - unit.moneyDart.startedAt;
  const pickupMs = 300;

  ctx.save();
  if (elapsed < pickupMs) {
    const idleSprite = unitSprite(unit);
    if (idleSprite) ctx.drawImage(idleSprite, p.x - 31, p.y - 47, 62, 62);
    if (moneyDartPickupFrames.length > 0) {
      const idx = Math.min(moneyDartPickupFrames.length - 1, Math.floor(elapsed / pickupMs * moneyDartPickupFrames.length));
      const dartFrame = moneyDartPickupFrames[idx];
      if (dartFrame) ctx.drawImage(dartFrame, p.x - 18, p.y - 25, 36, 36);
    }
    drawUnitEyes(unit, p, 0);
  } else {
    const frame = moneyDartReadyFrame(unit.facing, unit);
    const readyOff = moneyDartReadyOffsets[unit.facing] || { dx: 0, dy: 0 };
    if (frame) ctx.drawImage(frame, p.x - 31 + readyOff.dx, p.y - 47 + readyOff.dy, 62, 62);
    drawUnitEyes(unit, p, 0, moneyDartEyeOffsets);
  }
  ctx.restore();
}

function moneyDartReadyFrame(facing, unit) {
  const dirIndex = { right: 0, left: 1, up: 2, down: 3 }[facing] ?? 0;
  const key = unitLookDefinition(unit).moneyDartReadySet || (unit.team === "grey" ? "g" : "b");
  return (moneyDartReadyFrames[key] || [])[dirIndex] || null;
}

function moneyDartPickupOrReadyFrame(unit, elapsed) {
  const pickupMs = 300;
  if (elapsed < pickupMs && moneyDartPickupFrames.length > 0) {
    const frameMs = pickupMs / moneyDartPickupFrames.length;
    const idx = Math.min(moneyDartPickupFrames.length - 1, Math.floor(elapsed / frameMs));
    return moneyDartPickupFrames[idx] || null;
  }
  return moneyDartReadyFrame(unit.facing, unit);
}

function drawHp(unit, x, y) {
  const W = 50;
  const H = 8;
  const hpMax = unit.maxHp || maxHp;
  const ratio = Math.max(0, unit.hp / hpMax);
  const hpText = `${Math.max(0, Math.round(unit.hp))}/${Math.round(hpMax)}`;
  if (images.barBackground) {
    ctx.drawImage(images.barBackground, x - W / 2, y, W, H);
  } else {
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(x - W / 2, y, W, H);
  }
  ctx.fillStyle = "#e02020";
  ctx.fillRect(x - W / 2, y, W * ratio, H);
  ctx.save();
  ctx.strokeStyle = "#e8c000";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - W / 2, y, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 0.6;
  ctx.strokeRect(x - W / 2 + 1, y + 1, W - 2, H - 2);
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

function drawPlayerArrow(p) {
  const img = images.playerPointer;
  if (!img) return;
  const now = performance.now();
  const bob = Math.sin(now / 350) * 3;
  const w = img.width;
  const h = img.height;
  ctx.drawImage(img, p.x - w / 2, p.y - 47 - h - 4 + bob, w, h);
}

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
}

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
      ctx.translate(p.x + offset.x + offset.w, p.y - offset.y + bob);
      ctx.scale(-1, 1);
      ctx.drawImage(sideEye, 0, 0, offset.w, offset.h);
    } else {
      ctx.drawImage(sideEye, p.x + offset.x, p.y - offset.y + bob, offset.w, offset.h);
    }
    ctx.restore();
    return;
  }

  const frontEyes = unitEyeFrontSprite(unit);
  if (!frontEyes) return;
  ctx.drawImage(frontEyes, p.x + offset.x, p.y - offset.y + bob, offset.w, offset.h);
}
