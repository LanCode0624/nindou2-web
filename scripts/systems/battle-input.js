// ===== Battle Input =====
// 處理滑鼠按下：忍術按鈕、選角色、攻擊或開始拖曳。
function pointerDown(event) {
  if (state.inRoom) return;
  if (state.result) {
    if (performance.now() < (state.resultClickableAt || 0)) return;
    returnToRoomFromResult();
    return;
  }
  startBgm();
  pointerMove(event);
  if (!isMatchActive()) return;
  const cell = state.pointer.cell;
  for (let index = 0; index < 10; index++) {
    if (pointInRect(state.pointer.x, state.pointer.y, itemSlotRect(index))) {
      useItemSlot(index);
      return;
    }
  }
  for (const button of currentNinjuButtonList()) {
    if (pointInRect(state.pointer.x, state.pointer.y, button)) {
      useNinjuByType(button.type);
      return;
    }
  }
  if (!cell || state.gameOver) return;

  const unitRaw = unitAt(cell.x, cell.y);
  // 移動動畫播放中視為不可點擊，等動畫結束才能再次操作。
  const unitMoving = unitRaw && unitRaw.moveTrail && (performance.now() - unitRaw.moveTrail.startedAt) < ARRIVE_TOTAL;
  const unit = unitMoving ? null : unitRaw;
  const selected = selectedUnit();
  state.pressedUnit = unit && canControlUnit(unit) && !unit.moneyDart ? unit : null;
  state.pressTime = performance.now();
  state.dragMoved = false;
  state.charging = false;

  if (selected && selected.moneyDart) {
    if (cell.x !== selected.x || cell.y !== selected.y) {
      throwMoneyDart(selected, cell);
    } else {
      setMessage(`${selected.name}：請選擇上、下、左、右其中一個方向丟出錢鏢。`);
    }
    return;
  }

  if (unit && canControlUnit(unit)) {
    state.selectedId = unit.id;
    setMessage(`${unit.name}：請持續按住以累積技量。`);
    return;
  }

  if (unit && selected && unit.team !== selected.team) {
    if (manhattan(selected, unit) === 1) {
      attack(selected, unit);
    } else {
      attackAimedWeapon(selected, cell);
    }
    return;
  }

  if (selected && (cell.x !== selected.x || cell.y !== selected.y)) {
    attackAimedWeapon(selected, cell);
    return;
  }

  setMessage("移動必須先按住角色集氣，再拖到目標格。");
}

// 處理滑鼠移動並更新目前指向的格子。
function pointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = (event.clientX - rect.left) * canvas.width / rect.width;
  state.pointer.y = (event.clientY - rect.top) * canvas.height / rect.height;
  state.pointer.cell = pointToCell(state.pointer.x, state.pointer.y);

  const lookUnit = state.pressedUnit || selectedUnit();
  if (lookUnit && canControlUnit(lookUnit) && lookUnit.alive && !isUnitDisabled(lookUnit)) {
    updateFacingFromPointer(lookUnit);
  }

  if (!state.pressedUnit || !event.buttons) return;
  const start = cellCenter(state.pressedUnit.x, state.pressedUnit.y);
  const dx = state.pointer.x - start.x;
  const dy = state.pointer.y - start.y;
  if (Math.hypot(dx, dy) > 12) {
    state.dragMoved = true;
  }
}

// 處理滑鼠放開，決定是否執行拖曳移動。
function pointerUp(event) {
  startBgm();
  pointerMove(event);
  const cell = state.pressedUnit ? dragMoveTargetCell(state.pressedUnit) : null;
  if (state.charging && state.dragMoved && state.pressedUnit && cell) {
    skillMove(state.pressedUnit, cell);
  } else if (state.pressedUnit) {
    setMessage(`${state.pressedUnit.name}：已集到 ${state.pressedUnit.skill.toFixed(1)} 技。`);
  }

  state.pressedUnit = null;
  state.dragMoved = false;
  state.charging = false;
}
