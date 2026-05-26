import { resolveRuntimeState } from "./runtime-state-access.module.mjs";

function canvasContext(target) {
  const canvas = target.document?.querySelector?.("#game");
  return {
    canvas,
    ctx: canvas?.getContext?.("2d"),
  };
}

function now(target) {
  return target.performance?.now?.() ?? performance.now();
}

export function installEffectsRendererGlobals(target = globalThis) {
  const consumableEffectFrames = (type) => {
    if (type === "regen_sp") return target.consumableRegenSpFrames;
    return [];
  };

  const ninjuCastFrames = (type, unit = null) => {
    if (type === "clone") {
      if (unit?.controlMode === "ai_red" || unit?.appearanceKey === "red") return target.cloneRedNinjuFrames;
      if (unit?.team === "grey") return target.cloneGreyNinjuFrames;
      return target.cloneNinjuFrames;
    }
    if (target.attackNinjuConfigs[type]) return target.attackNinjuConfigs[type].summonFrames;
    if (target.specialNinjuConfigs[type]) return target.specialNinjuConfigs[type].summonFrames;
    if (type === "hotBlood") return target.atkUpFrames;
    if (type === "genki") return target.regenHpSmallFrames;
    if (type === "kakki" || type === "shinki") return target.regenHpLargeFrames;
    return target.defUpFrames;
  };

  const ninjuDamageFrames = (type) => {
    if (target.attackNinjuConfigs[type]) return target.attackNinjuConfigs[type].hitFrames;
    if (target.specialNinjuConfigs[type]) return target.specialNinjuConfigs[type].hitFrames;
    if (type === "genki") return target.regenHpSmallFrames;
    if (type === "kakki" || type === "shinki") return target.regenHpLargeFrames;
    if (type === "freezeBreak") return target.smallIceBreakFrames;
    if (type === "flashMiss") return target.damageFailFrames;
    if (type === "flashHit") return target.faintedFrames;
    if (type === "flashHitHead") return target.damageSuccessSmallFrames;
    if (type === "wildfireMiddleHitHead") return target.damageSuccessMiddleFrames;
    if (type === "deathMiddleHitHead") return target.damageSuccessMiddleFrames;
    if (type === "deathBigHitHead") return target.damageSuccessBigFrames;
    if (type === "deathNinjuSuccess") return target.damageSuccessNinjuSuccessFrames;
    return [];
  };

  const ninjuDamageEffectPlacement = (type) => {
    if (type === "flashMiss") return { x: 0, y: 76, w: 87, h: 57 };
    if (type === "flashHitHead") return { x: 0, y: 78, w: 87, h: 57 };
    if (type === "wildfireMiddleHitHead") return { x: 0, y: 78, w: 87, h: 57 };
    if (type === "deathMiddleHitHead" || type === "deathBigHitHead" || type === "deathNinjuSuccess") return { x: 0, y: 50, w: 65, h: 70 };
    if (type === "flashHit") return { x: 0, y: 35, w: 74, h: 74 };
    return { x: 0, y: 22, w: 138, h: 138 };
  };

  const drawConsumableEffects = (currentNow) => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.consumableEffects || !ctx) return;
    for (let i = state.consumableEffects.length - 1; i >= 0; i--) {
      const effect = state.consumableEffects[i];
      const elapsed = currentNow - effect.startedAt;
      const frames = consumableEffectFrames(effect.type);
      if (elapsed >= effect.duration || frames.length === 0) {
        state.consumableEffects.splice(i, 1);
        continue;
      }
      const unit = state.units.find((candidate) => candidate.id === effect.unitId);
      if (!unit || !unit.alive) {
        state.consumableEffects.splice(i, 1);
        continue;
      }
      const progress = Math.min(0.999, elapsed / effect.duration);
      const frame = frames[Math.floor(progress * frames.length)];
      if (!frame) continue;
      const p = target.unitPosition(unit);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(frame, p.x - 46, p.y - 68, 92, 92);
      ctx.restore();
    }
  };

  const drawNinjuDamageEffects = (currentNow) => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state?.ninjuDamageEffects || !ctx) return;
    for (let i = state.ninjuDamageEffects.length - 1; i >= 0; i--) {
      const effect = state.ninjuDamageEffects[i];
      if (currentNow < effect.startedAt) continue;
      const frames = ninjuDamageFrames(effect.type);
      const elapsed = currentNow - effect.startedAt;
      if (elapsed >= effect.duration || frames.length === 0) {
        state.ninjuDamageEffects.splice(i, 1);
        continue;
      }
      const frameDuration = effect.frameDuration || effect.duration;
      const progress = Math.min(0.999, elapsed / frameDuration);
      const frame = frames[Math.floor(progress * frames.length)];
      if (!frame) continue;
      const effectTarget = state.units.find((unit) => unit.id === effect.targetId);
      const p = effectTarget && (effectTarget.alive || effectTarget.respawning) ? target.unitPosition(effectTarget) : effect.at;
      const placement = ninjuDamageEffectPlacement(effect.type);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(frame, p.x + placement.x - placement.w / 2, p.y - placement.y - placement.h / 2, placement.w, placement.h);
      ctx.restore();
    }
  };

  const drawNinjuEffects = (currentNow) => {
    const state = resolveRuntimeState(target);
    const { ctx } = canvasContext(target);
    if (!state || !ctx) return;
    for (const unit of state.units) {
      if (!unit.alive) continue;
      const p = target.unitPosition(unit);
      if (target.isUnitCastingNinju(unit)) {
        const progress = Math.min(0.999, (currentNow - unit.ninju.startedAt) / unit.ninju.duration);
        const frames = ninjuCastFrames(unit.ninju.type, unit);
        const frame = frames[Math.floor(progress * frames.length)];
        if (frame) {
          ctx.save();
          ctx.globalAlpha = 0.85;
          const size = target.attackNinjuConfigs[unit.ninju.type]?.castSize || target.specialNinjuConfigs[unit.ninju.type]?.castSize || 92;
          ctx.drawImage(frame, p.x - size / 2, p.y - 22 - size / 2, size, size);
          ctx.restore();
        }
      }
    }
    drawConsumableEffects(currentNow);
    drawNinjuDamageEffects(currentNow);
  };

  const addNinjuDamageEffect = (type, effectTarget, currentNow = now(target), duration = 0, options = {}) => {
    const state = resolveRuntimeState(target);
    if (!state || !effectTarget) return;
    if (!state.ninjuDamageEffects) state.ninjuDamageEffects = [];
    const frames = ninjuDamageFrames(type);
    state.ninjuDamageEffects.push({
      type,
      targetId: effectTarget.id,
      at: target.unitPosition(effectTarget),
      startedAt: currentNow,
      duration: duration || Math.max(300, frames.length * 40),
      frameDuration: options.frameDuration || 0,
    });
  };

  Object.assign(target, {
    drawNinjuEffects,
    drawConsumableEffects,
    consumableEffectFrames,
    ninjuCastFrames,
    drawNinjuDamageEffects,
    ninjuDamageFrames,
    ninjuDamageEffectPlacement,
    addNinjuDamageEffect,
  });

  target.NindouEffectsRenderer = {
    drawNinjuEffects,
    drawConsumableEffects,
    consumableEffectFrames,
    ninjuCastFrames,
    drawNinjuDamageEffects,
    ninjuDamageFrames,
    ninjuDamageEffectPlacement,
    addNinjuDamageEffect,
  };
}
