const test = require("node:test");
const assert = require("node:assert/strict");

const { createGameContext, loadScripts, plain } = require("./helpers/script-loader");

function loadGridContext(overrides = {}) {
  const context = createGameContext(overrides);
  return loadScripts(context, [
    "scripts/data/config.js",
    "scripts/systems/grid.js",
  ]);
}

test("玩家座標與內部座標可以正確互轉", () => {
  const context = loadGridContext();

  const internal = context.internalCellCoord({ x: 1, y: 1 });
  assert.deepEqual(plain(internal), { x: 2, y: 10 });
  assert.deepEqual(plain(context.displayCellCoord(internal)), { x: 1, y: 1 });
});

test("永久障礙會擋住外框與不可走邊界", () => {
  const context = loadGridContext();

  assert.equal(context.isPermanentObstacle(0, 5), true);
  assert.equal(context.isPermanentObstacle(1, 5), true);
  assert.equal(context.isPermanentObstacle(2, 5), false);
  assert.equal(context.isPermanentObstacle(21, 5), true);
  assert.equal(context.isPermanentObstacle(20, 5), true);
  assert.equal(context.isPermanentObstacle(19, 5), false);
  assert.equal(context.isPermanentObstacle(2, 0), true);
  assert.equal(context.isPermanentObstacle(2, 11), true);
});

test("物件佔用格會被視為阻擋格", () => {
  const context = loadGridContext({
    state: {
      useOriginalMode: false,
      units: [],
      objects: [{ x: 4, y: 5, alive: true }],
    },
  });

  assert.equal(context.isBlockedCell(4, 5), true);
  assert.equal(context.isBlockedCell(4, 6), false);
});
