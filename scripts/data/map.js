// Current arena object placement. Coordinates here use the player-facing grid.
const mapObjectBuilders = {
  "country-10": buildCountry10Objects,
  "evil-castle-1": buildEvilCastleObjects,
};

function buildMapObjects() {
  const mapDefinition = currentRoomMapDefinition();
  const builder = mapObjectBuilders[mapDefinition.objectLayout];
  if (!builder) return [];
  return builder();
}

function buildCountry10Objects() {
  const objects = [];
  const addInternal = (type, x, y, breakable = true, scale = 1.15, hp = objectHp) => {
    objects.push({ type, x, y, hp: breakable ? hp : Infinity, maxHp: breakable ? hp : Infinity, breakable, scale, alive: true });
  };
  const add = (type, displayX, displayY, breakable = true, scale = 1.15, hp = objectHp) => {
    const internal = internalCellCoord({ x: displayX, y: displayY });
    addInternal(type, internal.x, internal.y, breakable, scale, hp);
  };

  for (let x = 1; x <= 18; x++) {
    add("hay", x, 9, true, 1.08);
    add("hay", x, 2, true, 1.08);
  }

  for (let y = 3; y <= 4; y++) {
    add("hay", 1, y, true, 1.08);
    add("hay", 18, y, true, 1.08);
  }
  [[1, 10], [18, 10], [1, 1], [18, 1], [1, 8], [18, 8]].forEach(([x, y]) => add("hay", x, y, true, 1.08));

  [[3, 10], [4, 10], [15, 10], [16, 10], [3, 1], [4, 1], [15, 1], [16, 1]].forEach(([x, y]) => add("barrel", x, y, true, 1.05));
  [[2, 10], [5, 10], [14, 10], [17, 10], [2, 1], [5, 1], [14, 1], [17, 1], [1, 7], [1, 6], [1, 5], [18, 7], [18, 6], [18, 5]].forEach(([x, y]) => add("vase", x, y, true, 1.05));
  [[9, 10], [10, 10], [9, 1], [10, 1]].forEach(([x, y]) => add("stump", x, y, true, 1.04, 200));
  [[9, 6], [10, 5]].forEach(([x, y]) => add("chest", x, y, true, 1.08, 200));
  [[10, 6], [9, 5]].forEach(([x, y]) => add("rock", x, y, false, 1.08));
  [[2, 8], [17, 8]].forEach(([x, y]) => add("flower", x, y, true, 1.04));

  for (let y = 1; y <= 10; y++) {
    add("tree", 0, y, false, 1.08);
    add("tree", 19, y, false, 1.08);
  }
  for (let x = 1; x <= 18; x++) {
    add("tree", x, 11, false, 1.08);
    add("tree", x, 0, false, 1.08);
  }
  [[0, 11], [19, 11], [0, 0], [19, 0]].forEach(([x, y]) => add("tree", x, y, false, 1.08));

  return objects;
}

function buildEvilCastleObjects() {
  const objects = [];
  const addInternal = (object) => {
    objects.push({
      hp: Infinity,
      maxHp: Infinity,
      breakable: false,
      alive: true,
      ...object,
    });
  };
  const addDisplayCell = (type, displayX, displayY, options = {}) => {
    const internal = internalCellCoord({ x: displayX, y: displayY });
    addInternal({ type, x: internal.x, y: internal.y, ...options });
  };
  const addBlockRect = (type, xMin, yMin, xMax, yMax) => {
    const centerX = Math.floor((xMin + xMax) / 2);
    const centerY = Math.floor((yMin + yMax) / 2);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const isCenter = x === centerX && y === centerY;
        addDisplayCell(type, x, y, {
          hidden: !isCenter,
          drawWidthCells: 4.5,
          drawHeightCells: 4,
          drawOffsetX: 10,
          drawOffsetY: -80,
          drawAnchorY: 0.5,
        });
      }
    }
  };
  const addHiddenRect = (type, x1, y1, x2, y2, options = {}) => {
    const xMin = Math.min(x1, x2);
    const xMax = Math.max(x1, x2);
    const yMin = Math.min(y1, y2);
    const yMax = Math.max(y1, y2);
    const centerX = Math.floor((xMin + xMax) / 2);
    const centerY = Math.floor((yMin + yMax) / 2);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        addDisplayCell(type, x, y, {
          hidden: !(x === centerX && y === centerY),
          ...options,
        });
      }
    }
  };

  addBlockRect("evilCastleBlock033", 3, 3, 5, 4);
  addBlockRect("evilCastleBlock033", 14, 3, 16, 4);
  [[2, 5], [17, 5], [5, 2], [14, 2], [3, 7], [16, 7]].forEach(([x, y]) => {
    addDisplayCell("evilCastleBlock035", x, y, {
      scale: 1.15,
    });
  });
  [[7, 8], [7, 9], [7, 10], [12, 8], [12, 9], [12, 10]].forEach(([x, y]) => {
    addDisplayCell("evilCastleBlock036", x, y, {
      scale: 1.15,
    });
  });
  addHiddenRect("evilCastleDoor1", 8, 12, 11, 11, {
    // door-overlay.png 視覺調整：寬高用格數當 scale；offset 用像素微調位置。
    // drawWidthCells 越大越寬，drawHeightCells 越大越高。
    // drawOffsetX 正數往右、負數往左；drawOffsetY 正數往下、負數往上。
    drawWidthCells: 5,
    drawHeightCells: 2,
    drawOffsetX: 27,
    drawOffsetY: -20,
    drawAnchorY: 0.5,
  });

  return objects;
}
