// ===== Rendering: Ninjutsu Effects =====
// 繪製忍術效果，例如鋼鐵藍光與施放動畫。
function drawNinjuEffects(now) {
  for (const unit of state.units) {
    if (!unit.alive) continue;
    const p = unitPosition(unit);
    if (isUnitCastingNinju(unit)) {
      const progress = Math.min(0.999, (now - unit.ninju.startedAt) / unit.ninju.duration);
      const frames = ninjuCastFrames(unit.ninju.type, unit);
      const frame = frames[Math.floor(progress * frames.length)];
      if (frame) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        const size = attackNinjuConfigs[unit.ninju.type]?.castSize || specialNinjuConfigs[unit.ninju.type]?.castSize || 92;
        ctx.drawImage(frame, p.x - size / 2, p.y - 22 - size / 2, size, size);
        ctx.restore();
      }
    }
  }
  drawConsumableEffects(now);
  drawNinjuDamageEffects(now);
}

function drawConsumableEffects(now) {
  if (!state.consumableEffects) return;
  for (let i = state.consumableEffects.length - 1; i >= 0; i--) {
    const effect = state.consumableEffects[i];
    const elapsed = now - effect.startedAt;
    const frames = consumableEffectFrames(effect.type);
    if (elapsed >= effect.duration || frames.length === 0) {
      state.consumableEffects.splice(i, 1);
      continue;
    }
    const unit = state.units.find((target) => target.id === effect.unitId);
    if (!unit || !unit.alive) {
      state.consumableEffects.splice(i, 1);
      continue;
    }
    const progress = Math.min(0.999, elapsed / effect.duration);
    const frame = frames[Math.floor(progress * frames.length)];
    if (!frame) continue;
    const p = unitPosition(unit);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(frame, p.x - 46, p.y - 68, 92, 92);
    ctx.restore();
  }
}

function consumableEffectFrames(type) {
  if (type === "regen_sp") return consumableRegenSpFrames;
  return [];
}

function ninjuCastFrames(type, unit = null) {
  if (type === "clone") {
    if (unit?.controlMode === "ai_red" || unit?.appearanceKey === "red") return cloneRedNinjuFrames;
    if (unit?.team === "grey") return cloneGreyNinjuFrames;
    return cloneNinjuFrames;
  }
  if (attackNinjuConfigs[type]) return attackNinjuConfigs[type].summonFrames;
  if (specialNinjuConfigs[type]) return specialNinjuConfigs[type].summonFrames;
  if (type === "hotBlood") return atkUpFrames;
  if (type === "genki") return regenHpSmallFrames;
  if (type === "kakki" || type === "shinki") return regenHpLargeFrames;
  return defUpFrames;
}

function drawNinjuDamageEffects(now) {
  if (!state.ninjuDamageEffects) return;
  for (let i = state.ninjuDamageEffects.length - 1; i >= 0; i--) {
    const effect = state.ninjuDamageEffects[i];
    if (now < effect.startedAt) continue;
    const frames = ninjuDamageFrames(effect.type);
    const elapsed = now - effect.startedAt;
    if (elapsed >= effect.duration || frames.length === 0) {
      state.ninjuDamageEffects.splice(i, 1);
      continue;
    }
    const frameDuration = effect.frameDuration || effect.duration;
    const progress = Math.min(0.999, elapsed / frameDuration);
    const frame = frames[Math.floor(progress * frames.length)];
    if (!frame) continue;
    const target = state.units.find((unit) => unit.id === effect.targetId);
    const p = target && (target.alive || target.respawning) ? unitPosition(target) : effect.at;
    const placement = ninjuDamageEffectPlacement(effect.type);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.drawImage(frame, p.x + placement.x - placement.w / 2, p.y - placement.y - placement.h / 2, placement.w, placement.h);
    ctx.restore();
  }
}

function ninjuDamageFrames(type) {
  if (attackNinjuConfigs[type]) return attackNinjuConfigs[type].hitFrames;
  if (specialNinjuConfigs[type]) return specialNinjuConfigs[type].hitFrames;
  if (type === "genki") return regenHpSmallFrames;
  if (type === "kakki" || type === "shinki") return regenHpLargeFrames;
  if (type === "freezeBreak") return smallIceBreakFrames;
  if (type === "flashMiss") return damageFailFrames;
  if (type === "flashHit") return faintedFrames;
  if (type === "flashHitHead") return damageSuccessSmallFrames;
  if (type === "wildfireMiddleHitHead") return damageSuccessMiddleFrames;
  if (type === "deathMiddleHitHead") return damageSuccessMiddleFrames;
  if (type === "deathBigHitHead") return damageSuccessBigFrames;
  if (type === "deathNinjuSuccess") return damageSuccessNinjuSuccessFrames;
  return [];
}

function ninjuDamageEffectPlacement(type) {
  if (type === "flashMiss") return { x: 0, y: 76, w: 87, h: 57 };
  if (type === "flashHitHead") return { x: 0, y: 78, w: 87, h: 57 };
  if (type === "wildfireMiddleHitHead") return { x: 0, y: 78, w: 87, h: 57 };
  if (type === "deathMiddleHitHead" || type === "deathBigHitHead" || type === "deathNinjuSuccess") return { x: 0, y: 50, w: 65, h: 70 };
  if (type === "flashHit") return { x: 0, y: 35, w: 74, h: 74 };
  return { x: 0, y: 22, w: 138, h: 138 };
}

function addNinjuDamageEffect(type, target, now = performance.now(), duration = 0, options = {}) {
  if (!target) return;
  if (!state.ninjuDamageEffects) state.ninjuDamageEffects = [];
  const frames = ninjuDamageFrames(type);
  state.ninjuDamageEffects.push({
    type,
    targetId: target.id,
    at: unitPosition(target),
    startedAt: now,
    duration: duration || Math.max(300, frames.length * 40),
    frameDuration: options.frameDuration || 0,
  });
}
