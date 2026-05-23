function updatePanel() {
  const unit = selectedHudUnit();
  if (!unit) return;
  const text = roomLocale();
  const coord = displayCellCoord(unit);
  const skillLimit = unit.skillMax || maxSkill;
  unitInfoEl.innerHTML = `
    <div>HP: ${Math.round(unit.hp)}/${unit.maxHp || maxHp}</div>
    <div>${text.panelSkill}: ${unit.skill.toFixed(1)} / ${skillLimit}</div>
    <div>${text.panelCell}: [${coord.x}, ${coord.y}]</div>
  `;
  skillFillEl.style.width = `${Math.min(100, unit.skill / skillLimit * 100)}%`;
}

function setMessage(text) {
  state.message = text;
  statusEl.textContent = text;
}
