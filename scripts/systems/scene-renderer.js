// ===== Rendering: Scene Backdrop =====
function battleMapRect() {
  return {
    x: grid.left + battleMapDrawInset.left,
    y: grid.top + battleMapDrawInset.top,
    w: grid.cols * grid.cell - battleMapDrawInset.left - battleMapDrawInset.right,
    h: grid.rows * grid.cell - battleMapDrawInset.top - battleMapDrawInset.bottom,
  };
}

// 繪製整體背景與 UI 底板。
function drawBackdrop() {
  ctx.fillStyle = "#062f37";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawUiPanels();
  const mapDrawRect = battleMapRect();
  const mapDefinition = currentRoomMapDefinition();
  const groundImage = images[mapDefinition.groundImageKey] || images.arena;
  const fallbackImage = images[mapDefinition.fallbackImageKey] || images.bg;
  if (groundImage) {
    ctx.drawImage(groundImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
  } else if (fallbackImage) {
    ctx.globalAlpha = 0.8;
    ctx.drawImage(fallbackImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = "#74ad7f";
    ctx.fillRect(mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
  }
  drawFrame();
}

function drawMapMaskOverlay() {
  const mapDefinition = currentRoomMapDefinition();
  const maskImage = images[mapDefinition.maskImageKey];
  if (!maskImage) return;
  const mapDrawRect = battleMapRect();
  ctx.drawImage(maskImage, mapDrawRect.x, mapDrawRect.y, mapDrawRect.w, mapDrawRect.h);
}

// 繪製下方 UI 面板區塊。
function drawUiPanels() {
  const bottom = ui.bottomTop;
  ctx.save();
  ctx.fillStyle = "#074451";
  ctx.fillRect(0, bottom, canvas.width, ui.bottomHeight);
  ctx.fillStyle = "#052b32";
  ctx.fillRect(8, bottom + 10, ui.leftPanelW - 18, ui.bottomHeight - 18);
  ctx.fillRect(ui.midX + 10, bottom + 10, canvas.width - ui.midX - 18, ui.bottomHeight - 18);
  ctx.restore();
}

// 繪製遊戲外框與分隔線。
function drawFrame() {
  const bottom = ui.bottomTop;
  ctx.save();
  ctx.strokeStyle = "#7b2417";
  ctx.lineWidth = 5;
  ctx.strokeRect(3, 3, canvas.width - 6, bottom - 4);
  ctx.strokeRect(3, bottom, canvas.width - 6, canvas.height - bottom - 4);
  ctx.beginPath();
  ctx.moveTo(ui.midX, bottom);
  ctx.lineTo(ui.midX, canvas.height - 4);
  ctx.stroke();
  for (const [x, y] of [[9, 9], [canvas.width - 9, 9], [9, bottom - 2], [canvas.width - 9, bottom - 2], [9, canvas.height - 9], [ui.midX, bottom], [ui.midX, canvas.height - 9], [canvas.width - 9, canvas.height - 9]]) {
    drawCornerGem(x, y);
  }
  ctx.restore();
}

// 繪製外框角落的圓形裝飾。
function drawCornerGem(x, y) {
  ctx.save();
  ctx.fillStyle = "#224d43";
  ctx.strokeStyle = "#d0a15b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#75c7a5";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 繪製地圖底圖、樹牆與基本場景。
function drawBoard() {
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const r = cellRect(x, y);
      const hovered = state.pointer.cell && state.pointer.cell.x === x && state.pointer.cell.y === y;
      if (hovered) {
        ctx.fillStyle = isBlockedCell(x, y) ? "rgba(255, 82, 69, .22)" : "rgba(255, 238, 124, .22)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
    }
  }

  const selected = selectedUnit();
  if (!selected) return;
  for (const n of neighbors(selected.x, selected.y)) {
    if (!inside(n.x, n.y)) continue;
    const r = cellRect(n.x, n.y);
    ctx.fillStyle = unitAt(n.x, n.y) ? "rgba(255,95,83,.26)" : "rgba(103,212,179,.20)";
    if (isBlockedCell(n.x, n.y)) ctx.fillStyle = "rgba(255,224,109,.18)";
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
}
