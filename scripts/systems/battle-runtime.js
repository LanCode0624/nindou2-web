// ===== Battle Runtime =====
// 處理玩家長按角色時的集技規則。
function updateCharging(dt) {
  if (!state.pressedUnit || state.gameOver) return;
  if (!canDraggedUnitMoveNow(state.pressedUnit)) return;
  const held = (performance.now() - state.pressTime) / 1000;
  if (held < holdSeconds) return;
  if (!pointerIsOnUnit(state.pressedUnit)) {
    state.charging = true;
    setMessage(`${state.pressedUnit.name}：請把滑鼠移回角色身上才能繼續集氣。`);
    return;
  }

  state.charging = true;
  const skillLimit = state.pressedUnit.skillMax || maxSkill;
  state.pressedUnit.skill = Math.min(skillLimit, state.pressedUnit.skill + chargePerSecond * dt);
  setMessage(`${state.pressedUnit.name} 集氣中 ${state.pressedUnit.skill.toFixed(1)} / ${skillLimit}`);
}

function canDraggedUnitMoveNow(unit) {
  return canUnitMoveNow(unit) || canUseConsumableFollowupMove(unit);
}

// 處理開場倒數結束後正式開始比賽。
function updateMatchState(now) {
  if (state.matchStart || state.result) return;
  if (!state.countdownStart) state.countdownStart = now;
  if (now - state.countdownStart >= countdownTotalMs) {
    state.matchStart = state.countdownStart + countdownTotalMs;
    state.lastFrame = now;
    if (!state.startSoundPlayed) {
      playSound("gameStarted");
      state.startSoundPlayed = true;
    }
    setMessage("開始。");
  }
}

// 判斷目前是否在可以操作與 AI 行動的正式對戰中。
function isMatchActive() {
  return Boolean(!state.inRoom && state.matchStart && !state.result);
}

function useNinjuByType(type) {
  if (type === "moneyDart") useMoneyDart();
  else if (type === "steel") useSteelNinju();
  else if (type === "hotBlood") useHotBloodNinju();
  else if (attackNinjuConfigs[type]) useAttackNinju(type);
  else if (specialNinjuConfigs[type]) useSpecialNinju(type);
  else if (type === "genki") useGenkiNinju();
  else if (type === "kakki") useKakkiNinju();
  else if (type === "shinki") useShinkiNinju();
}
