// ===== Rendering: Movement =====
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
