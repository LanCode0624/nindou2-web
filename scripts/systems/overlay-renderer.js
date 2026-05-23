// ===== Rendering: Overlays / Result =====
// 繪製開局三、二、一、開始的倒數畫面。
function drawCountdownOverlay(now) {
  if (state.result || state.matchStart || !state.countdownStart) return;
  const elapsed = now - state.countdownStart;
  const step = countdownStep(elapsed);
  if (!step) return;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, .18)";
  ctx.fillRect(grid.left, grid.top, grid.cols * grid.cell, grid.rows * grid.cell);
  const startText = localizedCountdownText(0);
  const shake = step.text === startText ? Math.sin(now / 35) * 8 : 0;
  const scale = step.text === startText ? 1 + Math.sin(now / 70) * 0.06 : 1;
  ctx.translate(canvas.width / 2 + shake, grid.top + grid.rows * grid.cell / 2 - 16);
  ctx.scale(scale, scale);
  drawOutlinedText(step.text, 0, 0, step.text === startText ? 76 : 96, step.color, "center");
  ctx.restore();
}

// 依倒數經過時間回傳目前要顯示的文字與顏色。
function countdownStep(elapsed) {
  if (elapsed < 500) return { text: localizedCountdownText(3), color: "#fff1a8" };
  if (elapsed < 1000) return { text: localizedCountdownText(2), color: "#fff1a8" };
  if (elapsed < 1500) return { text: localizedCountdownText(1), color: "#fff1a8" };
  if (elapsed < countdownTotalMs) return { text: localizedCountdownText(0), color: "#ffea4d" };
  return null;
}

// 繪製勝敗結算畫面與統計表。
function drawResultOverlay() {
  if (!state.result) return;
  ctx.save();
  ctx.fillStyle = "rgba(0, 18, 22, .82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#063d46";
  ctx.strokeStyle = "#d0a65f";
  ctx.lineWidth = 4;
  ctx.fillRect(142, 88, 676, 504);
  ctx.strokeRect(142, 88, 676, 504);

  const text = roomLocale();
  const title = state.result.winner === "blue" ? text.victory : text.defeat;
  drawOutlinedText(title, canvas.width / 2, 130, 48, state.result.winner === "blue" ? "#78ddff" : "#ff8d7d", "center");
  drawOutlinedText(`${text.gameTime} ${formatMatchTime(state.result.durationMs)}`, canvas.width / 2, 176, 22, "#f6f2d0", "center");

  ctx.font = "700 17px Microsoft JhengHei, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawResultRow(text.resultHeaders, 214, true);
  const rows = state.units.slice().sort((a, b) => a.team.localeCompare(b.team) || a.id - b.id);
  rows.forEach((unit, index) => {
    drawResultRow([
      unit.name,
      unit.team === "blue" ? "青組" : "灰組",
      String(unit.kills),
      formatDamage(unit.damageDone),
      formatDamage(unit.damageTaken),
    ], 248 + index * 42, false, unit.team);
  });
  ctx.restore();
}

// 繪製結算畫面的一列表格資料。
function drawResultRow(values, y, header = false, team = "") {
  const x = 186;
  const widths = [150, 100, 80, 140, 140];
  ctx.save();
  ctx.fillStyle = header ? "rgba(255,255,255,.14)" : team === "blue" ? "rgba(80,190,240,.13)" : "rgba(220,220,210,.12)";
  ctx.fillRect(x - 12, y - 18, 606, 34);
  ctx.fillStyle = header ? "#fff1a8" : "#f4fff8";
  ctx.font = `${header ? "700" : "600"} 17px Microsoft JhengHei, sans-serif`;
  let cursor = x;
  for (let i = 0; i < values.length; i++) {
    ctx.fillText(values[i], cursor, y);
    cursor += widths[i];
  }
  ctx.restore();
}
