// ===== Ninjutsu System =====
function updateNinju(now) {
  for (const unit of state.units) {
    if (unit.fireToadTransformUntil) {
      unit.skill = maxSkill;
      if (now < unit.fireToadTransformUntil) continue;
      unit.fireToadTransformUntil = 0;
      unit.fireToadUntil = now + (unit.fireToadDurationMs || fireToadRule().durationMs);
      unit.fireToadStartedAt = now;
      playSound("fireToadChid");
      if (canControlUnit(unit)) setMessage(`${unit.name}: ${localizedNinjuTypeLabel("fireToad")}!`);
    } else if (isFireToadActive(unit)) {
      unit.skill = maxSkill;
    } else if (unit.fireToadUntil && now >= unit.fireToadUntil) {
      endFireToad(unit);
      if (canControlUnit(unit)) setMessage(`${unit.name}: ${localizedNinjuTypeLabel("fireToad")} ended.`);
    }
    if (!unit.ninju) continue;

    if (unit.ninju.phase === "active") {
      if (now - unit.ninju.startedAt < unit.ninju.duration) continue;
      if (unit.ninju.type === "fireToad") {
        unit.ninju = null;
        startFireToadTransform(unit, now);
        continue;
      }
      refreshStatusNinju(unit, unit.ninju.type, now);
      const queuedType = unit.ninju.pendingType || unit.ninju.type;

      if (unit.ninju.queue > 0) {
        // 先依點擊順序打完 queue 裡的忍術，pendingMoneyDart 延後帶著
        unit.ninju = { type: unit.ninju.type, phase: "gap", nextType: queuedType, nextAttackNinjuLevel: unit.ninju.pendingAttackNinjuLevel || 0, startedAt: now, duration: ninjuChainMaxGap, queue: unit.ninju.queue, gapMoves: 0, pendingMoneyDart: unit.ninju.pendingMoneyDart };
        if (unit.id === playerUnitId) setMessage(`${unit.name}: ninjutsu chain gap.`);
      } else if (unit.ninju.pendingMoneyDart) {
        // queue 清空後才輪到錢鏢
        unit.ninju = { type: unit.ninju.type, phase: "gap", nextType: "moneyDart", startedAt: now, duration: ninjuChainGap, queue: 0, gapMoves: 0 };
        if (unit.id === playerUnitId) setMessage(`${unit.name}: money dart chain gap.`);
      } else {
        unit.ninju = null;
        if (unit.id === playerUnitId) setMessage(`${unit.name}: ninjutsu cast finished.`);
      }
      continue;
    }

    if (unit.ninju.phase === "gap") {
      const elapsed = now - unit.ninju.startedAt;
      const firstMoveSucceeded = (unit.ninju.gapMoves || 0) > 0;
      if (!firstMoveSucceeded && elapsed < unit.ninju.duration) continue;
      if (unit.ninju.nextType === "moneyDart") {
        unit.ninju = null;
        startMoneyDart(unit, now, true);
      } else {
        const type = unit.ninju.nextType || unit.ninju.type;
        unit.ninju = { type, phase: "active", startedAt: now, duration: statusNinjuRule(type).castDurationMs, queue: Math.max(0, unit.ninju.queue - 1), chainMoves: firstMoveSucceeded ? ninjuFollowupMoveAllowance : 0, attackNinjuLevel: unit.ninju.nextAttackNinjuLevel || 0, pendingMoneyDart: unit.ninju.pendingMoneyDart };
        if (canControlUnit(unit)) playSound("useNinju");
        playStatusNinjuSound(type);
        if (unit.id === playerUnitId) setMessage(`${unit.name}: ninjutsu cast continued.`);
      }
    }
  }
}

function updateProjectiles(now) {
  if (!state.projectiles) return;
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const projectile = state.projectiles[i];
    if (now - projectile.startedAt < projectile.duration) continue;
    if (projectile.hitUnitId) {
      const target = state.units.find((unit) => unit.id === projectile.hitUnitId);
      if (target && target.alive && !isUnitInvincible(target)) {
        damageUnit(target, moneyDartRule().damage, `${projectile.ownerName} hit ${target.name} with money dart`);
      }
    }
    state.projectiles.splice(i, 1);
  }
}

function useSteelNinju() {
  useStatusNinju("steel", "Steel");
}

function useHotBloodNinju() {
  useStatusNinju("hotBlood", "Hot blood");
}

function useFlashNinju() {
  useAttackNinju("flash");
}

function useAttackNinju(type) {
  const config = attackNinjuConfigs[type];
  useStatusNinju(type, config?.label || type);
}

function useSpecialNinju(type) {
  const config = specialNinjuConfigs[type];
  useStatusNinju(type, config?.label || type);
}

function useFireToadNinju() {
  const unit = selectedUnit();
  if (!unit || !canControlUnit(unit)) return;
  if (isUnitDisabled(unit)) {
    setMessage(`${unit.name}: cannot act now.`);
    return;
  }
  if (unit.moneyDart) {
    setMessage(`${unit.name}: cannot use ${localizedNinjuTypeLabel("fireToad")} while holding money dart.`);
    return;
  }
  if (isFireToadActive(unit) || isFireToadTransforming(unit)) {
    setMessage(`${unit.name}: already transformed.`);
    return;
  }
  if (isUnitCastingNinju(unit) || isUnitInNinjuGap(unit)) {
    setMessage(`${unit.name}: cannot use ${localizedNinjuTypeLabel("fireToad")} while another ninjutsu is casting.`);
    return;
  }
  const rule = fireToadRule();
  if (unit.skill < rule.cost) {
    setMessage(`${localizedNinjuTypeLabel("fireToad")} needs ${rule.cost} skill.`);
    return;
  }
  unit.skill -= rule.cost;
  const now = performance.now();
  unit.ninju = { type: "fireToad", phase: "active", startedAt: now, duration: rule.castDurationMs, queue: 0 };
  unit.moneyDart = null;
  playSound("useNinju");
  playStatusEnergyUpSequence();
  clearDragState();
  setMessage(`${unit.name} used ${localizedNinjuTypeLabel("fireToad")}.`);
}

function startFireToadTransform(unit, now = performance.now()) {
  const rule = fireToadRule();
  unit.fireToadTransformUntil = now + rule.transformMs;
  unit.fireToadTransformStartedAt = now;
  unit.fireToadDurationMs = rule.durationMs;
  unit.fireToadUntil = 0;
  unit.fireToadStartedAt = 0;
  unit.fireToadFacing = unit.facing || "down";
  unit.moneyDart = null;
  clearDragState();
  setMessage(`${unit.name} is transforming into ${localizedNinjuTypeLabel("fireToad")}.`);
}

function endFireToad(unit) {
  if (!unit) return;
  unit.fireToadTransformUntil = 0;
  unit.fireToadTransformStartedAt = 0;
  unit.fireToadUntil = 0;
  unit.fireToadStartedAt = 0;
  unit.fireToadFacing = "";
  unit.fireToadDurationMs = 0;
  unit.skill = maxSkill * 0.2;
}

function useGenkiNinju() {
  useStatusNinju("genki", localizedNinjuTypeLabel("genki"));
}

function useKakkiNinju() {
  useStatusNinju("kakki", localizedNinjuTypeLabel("kakki"));
}

function useShinkiNinju() {
  useStatusNinju("shinki", localizedNinjuTypeLabel("shinki"));
}

function useStatusNinju(type, label) {
  const unit = selectedUnit();
  if (!unit || !canControlUnit(unit)) return;
  const rule = statusNinjuRule(type);
  if (rule.available === false) return;
  if (isUnitDisabled(unit)) {
    setMessage(`${unit.name}: cannot act now.`);
    return;
  }
  if (unit.moneyDart) {
    setMessage(`${unit.name}: cannot use ninjutsu while holding money dart.`);
    return;
  }
  if ((unit.ninjuLockedUntil || 0) > performance.now()) {
    setMessage(`${unit.name}: cannot use ninjutsu yet.`);
    return;
  }
  const isAttackNinju = isAttackNinjuType(type);
  const skillCost = isAttackNinju ? 0 : rule.cost;
  if (unit.skill < skillCost) {
    setMessage(`${label} needs ${rule.cost} skill.`);
    return;
  }

  const attackNinjuLevel = isAttackNinju ? consumeAttackNinjuSoulLevel(unit) : 0;
  if (isAttackNinju && attackNinjuLevel < 1) {
    setMessage(`${label} needs soul 1.`);
    return;
  }

  unit.skill -= skillCost;
  const now = performance.now();

  if (unit.ninju && isStatusNinjuType(unit.ninju.type)) {
    unit.ninju.pendingType = type;
    if (isAttackNinju) unit.ninju.pendingAttackNinjuLevel = attackNinjuLevel;
    unit.ninju.queue = (unit.ninju.queue || 0) + 1;
    setMessage(`${unit.name} queued ${label}.`);
  } else {
    unit.ninju = { type, phase: "active", startedAt: now, duration: rule.castDurationMs, queue: 0, attackNinjuLevel };
    playStatusNinjuSound(type);
    setMessage(`${unit.name} used ${label}.`);
  }
  playSound("useNinju");
  clearDragState();
}

function useMoneyDart() {
  const unit = selectedUnit();
  if (!unit || !canControlUnit(unit)) return;
  const rule = moneyDartRule();
  if (isUnitDisabled(unit)) {
    setMessage(`${unit.name}: cannot act now.`);
    return;
  }
  if (unit.skill < rule.cost) {
    setMessage(`${localizedNinjuTypeLabel("moneyDart")} needs ${rule.cost} skill.`);
    return;
  }
  if (unit.moneyDart) {
    setMessage(`${unit.name}: money dart is already ready.`);
    return;
  }
  if (unit.moveTrail && (performance.now() - unit.moveTrail.startedAt) < ARRIVE_TOTAL) {
    setMessage(`${unit.name}: cannot use ninjutsu while moving.`);
    return;
  }
  if ((unit.ninjuLockedUntil || 0) > performance.now()) {
    setMessage(`${unit.name}: cannot use ninjutsu yet.`);
    return;
  }
  if (isUnitCastingNinju(unit)) {
    if (unit.ninju.pendingMoneyDart) {
      setMessage(`${unit.name}: money dart is already queued.`);
      return;
    }
    unit.skill -= rule.cost;
    unit.ninju.pendingMoneyDart = true;
    playSound("useNinju");
    // takeDart 音效延後到實際拿起錢標時（startMoneyDart）才播放
    clearDragState();
    setMessage(`${unit.name}: money dart queued after ninjutsu.`);
    return;
  }
  if (isUnitInNinjuGap(unit)) {
    if (unit.ninju.nextType === "moneyDart") {
      setMessage(`${unit.name}: money dart is already queued.`);
      return;
    }
    unit.skill -= rule.cost;
    unit.ninju.nextType = "moneyDart";
    playSound("useNinju");
    // takeDart 音效延後到實際拿起錢標時（startMoneyDart）才播放
    clearDragState();
    setMessage(`${unit.name}: money dart queued in the chain gap.`);
    return;
  }
  unit.skill -= rule.cost;
  playSound("useNinju");
  startMoneyDart(unit, performance.now(), true);
}

function startMoneyDart(unit, now = performance.now(), playActivationSound = true) {
  const rule = moneyDartRule();
  if (isUnitDisabled(unit)) return;
  if (unit.moneyDart) return;
  unit.moneyDart = { startedAt: now, invincibleUntil: now + rule.readyMs };
  if (playActivationSound) playSound("takeDart");
  if (canControlUnit(unit)) clearDragState();
  setMessage(`${unit.name}: money dart ready. Choose up, down, left, or right.`);
}

function throwMoneyDart(unit, targetCell) {
  if (!unit.moneyDart) return;
  const now = performance.now();
  if (isUnitDisabled(unit)) {
    setMessage(`${unit.name}: cannot act now.`);
    return;
  }
  if (now < unit.moneyDart.invincibleUntil) {
    setMessage(`${unit.name}: money dart is ready after the invincible moment.`);
    return;
  }
  if (isUnitCastingNinju(unit)) {
    setMessage(`${unit.name}: cannot throw while using ninjutsu.`);
    return;
  }
  if (!weaponIsReady(unit)) {
    setMessage(`${unit.name}: cannot throw money dart while weapon is recovering.`);
    return;
  }

  const dir = directionFromTarget(unit, targetCell);
  if (!dir) {
    setMessage(`${unit.name}: choose a straight direction for money dart.`);
    return;
  }

  const shot = traceMoneyDart(unit, dir);
  updateFacing(unit, targetCell);
  playSound("shootDart");
  unit.moneyDart = null;
  state.moneyDartCasts = state.moneyDartCasts.filter((cast) => cast.unitId !== unit.id);
  if (shot.hitUnit && shot.hitUnit.alive && !isUnitInvincible(shot.hitUnit)) {
    damageUnit(shot.hitUnit, moneyDartRule().damage, `${unit.name} hit ${shot.hitUnit.name} with money dart`, true, unit);
  }
  state.projectiles.push({
    from: { x: unit.x, y: unit.y },
    to: shot.to,
    dir: dir.name,
    hitUnitId: null,
    ownerName: unit.name,
    startedAt: now,
    duration: Math.max(160, shot.distance * grid.cell / moneyDartRule().speed * 1000),
  });
  state.moneyDartCasts.push({
    unitId: unit.id,
    dir: dir.name,
    team: unit.team,
    startedAt: now,
    duration: 300,
  });
  unit.ninjuLockedUntil = now + moneyDartRule().postThrowNinjuLockMs;
  setMessage(`${unit.name} threw money dart.`);
}

function traceMoneyDart(unit, dir) {
  let x = unit.x + dir.dx;
  let y = unit.y + dir.dy;
  let last = { x: unit.x, y: unit.y };
  let distance = 0;

  while (inside(x, y)) {
    if (isPermanentObstacle(x, y) || objectAt(x, y)) break;
    distance += 1;
    last = { x, y };
    const other = unitAt(x, y);
    if (other && other.id !== unit.id) {
      if (other.team !== unit.team) return { to: { x, y }, hitUnit: other, distance };
    }
    x += dir.dx;
    y += dir.dy;
  }

  if (distance === 0) {
    return { to: { x: unit.x + dir.dx, y: unit.y + dir.dy }, hitUnit: null, distance: 1 };
  }
  return { to: last, hitUnit: null, distance };
}

function isUnitCastingNinju(unit) {
  return Boolean(unit && unit.ninju && isStatusNinjuType(unit.ninju.type) && unit.ninju.phase === "active" && performance.now() - unit.ninju.startedAt < unit.ninju.duration);
}

function canUnitMoveNow(unit) {
  if (isUnitDisabled(unit)) return false;
  if (unit.moneyDart) return false; // 拿標中不能回技或拖曳
  if (!isUnitCastingNinju(unit)) return true;
  return Boolean(unit.ninju && unit.ninju.chainMoves > 0);
}

function isUnitInvincible(unit) {
  return isFireToadTransforming(unit) || isUnitCastingNinju(unit) || isUnitInNinjuGap(unit) || isMoneyDartInvincible(unit) || isFlashInvincible(unit);
}

function isUnitDisabled(unit) {
  return Boolean(unit && unit.disabledUntil && performance.now() < unit.disabledUntil);
}

function isFlashInvincible(unit) {
  return Boolean(unit && unit.invincibleUntil && performance.now() < unit.invincibleUntil);
}

function isMoneyDartInvincible(unit) {
  return Boolean(unit && unit.moneyDart && performance.now() < unit.moneyDart.invincibleUntil);
}

function isUnitInNinjuGap(unit) {
  return Boolean(unit && unit.ninju && isStatusNinjuType(unit.ninju.type) && unit.ninju.phase === "gap" && performance.now() - unit.ninju.startedAt < unit.ninju.duration);
}

function isSteelDefenseActive(unit) {
  return Boolean(unit && unit.steelUntil && performance.now() < unit.steelUntil);
}

function isHotBloodActive(unit) {
  return Boolean(unit && unit.hotBloodUntil && performance.now() < unit.hotBloodUntil);
}

function isFireToadActive(unit) {
  return Boolean(unit && unit.fireToadUntil && performance.now() < unit.fireToadUntil);
}

function isFireToadTransforming(unit) {
  return Boolean(unit && unit.fireToadTransformUntil && performance.now() < unit.fireToadTransformUntil);
}

function refreshStatusNinju(unit, type, now = performance.now()) {
  if (isAttackNinjuType(type)) {
    triggerAttackNinju(unit, type, unit.ninju?.attackNinjuLevel || 0, now);
    return;
  }
  if (isSpecialNinjuType(type)) {
    triggerSpecialNinju(unit, type, now);
    return;
  }
  if (isHealNinjuType(type)) {
    const rule = healNinjuRule(type);
    if (rule.effect === "steelNoDefense") return;
    if (rule.effect === "teamHeal") {
      for (const teammate of state.units) {
        if (teammate.team === unit.team && teammate.alive) {
          teammate.hp = Math.min(teammate.maxHp, teammate.hp + rule.healAmount);
        }
      }
      return;
    }
    unit.hp = Math.min(unit.maxHp, unit.hp + rule.healAmount);
    return;
  }
  if (type === "steel") {
    unit.steelUntil = now + steelRule().durationMs;
    unit.buffAuraType = "steel";
  }
  if (type === "hotBlood") {
    unit.hotBloodUntil = now + hotBloodRule().durationMs;
    unit.buffAuraType = "hotBlood";
  }
}

function triggerAttackNinju(caster, type, attackNinjuLevel, now = performance.now()) {
  const config = attackNinjuConfigs[type];
  const rule = attackNinjuRule(type);
  const targets = attackNinjuTargets(caster, attackNinjuLevel);
  if (targets.length > 0 && config?.hitSound) playSound(config.hitSound);
  for (const target of targets) {
    const outcome = attackNinjuOutcome(type, rule);
    const hit = Boolean(outcome);
    const disableMs = hit ? (outcome.hitDisableMs || rule.hitDisableMs) : rule.missDisableMs;
    target.disabledUntil = now + disableMs;
    target.invincibleUntil = target.disabledUntil;
    target.moneyDart = null;
    target.hitFlash = hit ? 0.65 : 0.25;
    cancelDragIfPressed(target);
    if (typeof addNinjuDamageEffect === "function") {
      addNinjuDamageEffect(type, target, now, hit && config?.holdHitLastFrame ? disableMs : (hit ? 1500 : 0), config?.holdHitLastFrame ? { frameDuration: 1500 } : {});
      if (hit) {
        if (config?.hitBodyEffect !== null) addNinjuDamageEffect(config?.hitBodyEffect || "flashHit", target, now + 1500, 2000);
        addNinjuDamageEffect(outcome.headEffect || "flashHitHead", target, now + 1500, 2000);
        if (config?.breakEffect) addNinjuDamageEffect(config.breakEffect, target, now + disableMs, 350);
      } else {
        addNinjuDamageEffect("flashMiss", target, now + 1500, 1000);
      }
    }
    if (hit) damageUnit(target, outcome.damage, `${caster.name} hit ${target.name} with ${config?.label || type}`, true, caster);
  }
}

function attackNinjuOutcome(type, rule) {
  const outcomes = attackNinjuConfigs[type]?.outcomes;
  if (!outcomes) {
    return Math.random() < rule.hitChance ? { damage: rule.damage, headEffect: "flashHitHead" } : null;
  }
  let roll = Math.random();
  for (const outcome of outcomes) {
    if (roll < outcome.chance) return outcome;
    roll -= outcome.chance;
  }
  return null;
}

function attackNinjuTargets(caster, attackNinjuLevel) {
  const count = Math.max(0, Math.min(soulMaxLevel, attackNinjuLevel));
  return state.units
    .filter((target) => target.alive && target.team !== caster.team && !isUnitInvincible(target))
    .sort((a, b) => manhattan(caster, a) - manhattan(caster, b) || a.id - b.id)
    .slice(0, count);
}

function triggerSpecialNinju(caster, type, now = performance.now()) {
  const config = specialNinjuConfigs[type];
  const rule = specialNinjuRule(type);
  if (type === "clone") {
    triggerCloneNinju(caster, rule, now, config);
    return;
  }
  const target = attackNinjuTargets(caster, 1)[0];
  if (!target) return;
  if (config?.hitSound) playSound(config.hitSound);
  if (typeof addNinjuDamageEffect === "function") addNinjuDamageEffect(type, target, now, 1500);
  if (rule.damage) damageUnit(target, rule.damage, `${caster.name} hit ${target.name} with ${config?.label || type}`, true, caster);
}

function triggerCloneNinju(caster, rule, now = performance.now(), config = null) {
  const origin = { x: caster.x, y: caster.y };
  const candidates = cloneOpenCells(caster);
  if (candidates.length < 3) {
    if (canControlUnit(caster)) setMessage(`${caster.name}: not enough open cells for ${config?.label || localizedNinjuTypeLabel("clone")}.`);
    return;
  }
  const teleportCell = pickRandomCloneCell(candidates, (cell) => cell.x !== origin.x || cell.y !== origin.y);
  if (!teleportCell) {
    if (canControlUnit(caster)) setMessage(`${caster.name}: not enough open cells for ${config?.label || localizedNinjuTypeLabel("clone")}.`);
    return;
  }
  const decoyA = pickRandomCloneCell(candidates);
  const decoyB = pickRandomCloneCell(candidates);
  if (!decoyA || !decoyB) {
    if (canControlUnit(caster)) setMessage(`${caster.name}: not enough open cells for ${config?.label || localizedNinjuTypeLabel("clone")}.`);
    return;
  }
  clearCloneDecoysForCaster(caster.id);
  caster.x = teleportCell.x;
  caster.y = teleportCell.y;
  caster.fromX = teleportCell.x;
  caster.fromY = teleportCell.y;
  caster.moveT = 1;
  caster.moveTrail = null;
  caster.moneyDart = null;
  state.cloneDecoys = state.cloneDecoys || [];
  state.cloneDecoys.push(makeCloneDecoy(caster, decoyA, now), makeCloneDecoy(caster, decoyB, now));
  if (typeof addNinjuDamageEffect === "function") addNinjuDamageEffect("clone", caster, now, rule.castDurationMs || 1600);
  const playCloneSoundLater = typeof window !== "undefined" && typeof window.setTimeout === "function"
    ? window.setTimeout.bind(window)
    : (typeof setTimeout === "function" ? setTimeout : null);
  if (playCloneSoundLater) {
    playCloneSoundLater(() => {
      playSound("cloneNinju");
    }, 1500);
  }
  if (canControlUnit(caster)) setMessage(`${caster.name} used ${config?.label || localizedNinjuTypeLabel("clone")}.`);
}

function cloneOpenCells(caster) {
  const cells = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (x === caster.x && y === caster.y) continue;
      if (isBlockedCell(x, y) || unitAt(x, y)) continue;
      cells.push({ x, y });
    }
  }
  return cells;
}

function pickRandomCloneCell(pool, predicate = null) {
  const candidates = predicate ? pool.filter(predicate) : pool;
  if (!candidates.length) return null;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const poolIndex = pool.findIndex((cell) => cell.x === chosen.x && cell.y === chosen.y);
  if (poolIndex >= 0) pool.splice(poolIndex, 1);
  return chosen;
}

function makeCloneDecoy(caster, cell, now = performance.now()) {
  return {
    casterId: caster.id,
    name: caster.name,
    team: caster.team,
    x: cell.x,
    y: cell.y,
    fromX: cell.x,
    fromY: cell.y,
    moveT: 1,
    hp: caster.hp,
    maxHp: caster.maxHp,
    controlMode: caster.controlMode,
    appearanceKey: caster.appearanceKey || "default",
    steelUntil: caster.steelUntil || 0,
    hotBloodUntil: caster.hotBloodUntil || 0,
    buffAuraType: caster.buffAuraType || "",
    facing: "down",
    fireToadActive: isFireToadActive(caster) || isFireToadTransforming(caster),
    fireToadFacing: "down",
    createdAt: now,
  };
}

function clearCloneDecoysForCaster(casterId) {
  if (!state.cloneDecoys) return;
  state.cloneDecoys = state.cloneDecoys.filter((decoy) => decoy.casterId !== casterId);
}

function consumeAttackNinjuSoulLevel(unit) {
  const level = Math.min(soulMaxLevel, Math.floor((unit.soulSteps || 0) / soulStepsPerLevel));
  if (level > 0) unit.soulSteps = 0;
  return level;
}

function statusNinjuRule(type) {
  if (isAttackNinjuType(type)) return attackNinjuRule(type);
  if (isSpecialNinjuType(type)) return specialNinjuRule(type);
  if (type === "fireToad") return fireToadRule();
  if (isHealNinjuType(type)) return healNinjuRule(type);
  return type === "hotBlood" ? hotBloodRule() : steelRule();
}

function isStatusNinjuType(type) {
  return type === "steel" || type === "hotBlood" || type === "fireToad" || isAttackNinjuType(type) || isSpecialNinjuType(type) || isHealNinjuType(type);
}

function isAttackNinjuType(type) {
  return Boolean(attackNinjuConfigs[type]);
}

function isSpecialNinjuType(type) {
  return Boolean(specialNinjuConfigs[type]);
}

function isHealNinjuType(type) {
  return type === "genki" || type === "kakki" || type === "shinki";
}

function defendedDamage(unit, baseDamage) {
  return isSteelDefenseActive(unit) ? baseDamage / steelRule().defenseMultiplier : baseDamage;
}

function playStatusEnergyUpSequence() {
  const first = playSound("statusEnergyUp1");
  if (!first) return;
  const onFirstEnded = () => {
    first.removeEventListener("ended", onFirstEnded);
    playSound("statusEnergyUp2");
  };
  first.addEventListener("ended", onFirstEnded);
}

function playStatusNinjuSound(type) {
  if (isAttackNinjuType(type)) {
    const sound = attackNinjuConfigs[type]?.castSound;
    if (sound) playSound(sound);
    return;
  }
  if (isSpecialNinjuType(type)) {
    const sound = specialNinjuConfigs[type]?.castSound;
    if (sound) playSound(sound);
    return;
  }
  if (type === "genki") {
    playSound("regenHpSmall");
    return;
  }
  if (type === "kakki" || type === "shinki") {
    playSound("regenHpLarge");
    return;
  }
  playStatusEnergyUpSequence();
}
