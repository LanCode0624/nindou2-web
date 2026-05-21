# 忍豆風雲2單機版：地圖與座標說明

這份文件集中記錄地圖、座標、阻擋格、地圖物件、出生點與地圖測試。`readme/skill.md` 只保留入口摘要。

---

## 座標系

- 玩家座標 `[1,1]` 是左下角第一格。
- 往右是 `[2,1]`。
- 往上是 `[1,2]`。
- `internalCellCoord()` / `displayCellCoord()` 負責玩家座標與內部座標互轉。
- `buildMapObjects()` 內：
- `add()` 用玩家視角座標。
- `addInternal()` 用內部陣列座標。

---

## 地圖系統入口

主要位置：

- 地圖選單：`index.html -> #roomMapSelect`
- 地圖定義：`scripts/data/config.js -> roomMapDefinitions`
- 固定出生點：`scripts/data/config.js -> startingDisplayCellsBySlot`
- 地圖素材：`scripts/data/assets.js -> imageSources`
- 地圖物件：`scripts/data/map.js -> buildMapObjects()`
- 座標/阻擋：`scripts/systems/grid.js -> currentRoomMapDefinition()`、`isPermanentObstacle()`
- 圖層順序：`game.js -> draw()`、`drawBackdrop()`、`drawMapMaskOverlay()`、`drawMapObjects()`

目前地圖：

- `極惡城之一` -> `evil-castle-1`，目前預設地圖。
- `鄉野之十` -> `country-10`，舊地圖，仍可從房間下拉選單切換。

---

## 極惡城之一

素材 key：

- 地板：`assets/map/極惡城/1/1.png`，key 是 `evilCastleGround`。
- 遮罩：`assets/map/極惡城/1/2.png`，key 是 `evilCastleMask`。
- 033 障礙物：`assets/map/極惡城/1/033-01.png`，key 是 `evilCastleBlock033`。
- 035 障礙物：`assets/map/極惡城/1/035-01.png`，key 是 `evilCastleBlock035`。
- 036 障礙物：`assets/map/極惡城/1/036-01.png`，key 是 `evilCastleBlock036`。
- door1 障礙物：`assets/map/map/極惡城1/door-overlay.png`，key 是 `evilCastleDoor1`。

圖層與座標：

- 圖層順序是地板最底層、遮罩次之、玩家/攻擊/特效在遮罩上方。
- `coordinateBottomInternalY: 11`，所以極惡城的玩家座標比舊地圖往下偏移一格。
- 可走內部列是 `playableInternalYMin: 2` 到 `playableInternalYMax: 11`。
- 玩家座標 `[5,10]` 可走；`[5,11]`、`[5,12]` 不可走。
- 額外不可走玩家座標：`[1,1]`、`[18,1]`、`[1,10]`、`[18,10]`、`[1,18]`、`[18,18]`。

固定出生點：

- `blue1 [9,3]`
- `blue2 [8,1]`
- `blue3 [9,1]`
- `blue4 [10,1]`
- `grey1 [6,9]`
- `grey2 [8,8]`
- `grey3 [11,8]`
- `grey4 [13,9]`

障礙物：

- 033 障礙物只擋路、不破壞、不掉落道具。
- 033 左側擋路範圍：`[3,3]` 到 `[5,4]`，共 6 格。
- 033 右側擋路範圍：`[14,3]` 到 `[16,4]`，共 6 格。
- 035 障礙物只擋路、不破壞、不掉落道具；每個物件佔 1 格，位置是 `[2,5]`、`[17,5]`、`[5,2]`、`[14,2]`、`[3,7]`、`[16,7]`。
- 036 障礙物只擋路、不破壞、不掉落道具；每個物件佔 1 格，位置是 `[7,8]`、`[7,9]`、`[7,10]`、`[12,8]`、`[12,9]`、`[12,10]`。
- door1 障礙物只擋路、不破壞、不掉落道具；佔 8 格，區間是 `[8,12]` 到 `[11,11]`，也就是 x=8..11、y=11..12。

視覺調整：

- 033 顯示大小與偏移在 `scripts/data/map.js -> addBlockRect()` 內：`drawWidthCells`、`drawHeightCells`、`drawOffsetX`、`drawOffsetY`、`drawAnchorY`。
- 033 的視覺 scale / offset 是人工校準值，不要用碰撞格去推圖片大小。
- 目前 033 顯示值：`drawWidthCells: 4.5`、`drawHeightCells: 4`、`drawOffsetX: 10`、`drawOffsetY: -80`、`drawAnchorY: 0.5`。

---

## 近期紀錄

### 2026-05-21 極惡城地圖

- 房間地圖下拉選單已接到實際地圖切換，預設是 `極惡城之一`。
- 極惡城用 `assets/map/極惡城/1/1.png` 當地板、`assets/map/極惡城/1/2.png` 當遮罩。
- 極惡城的遮罩在地板之上、玩家之下；不要再把遮罩畫到玩家/攻擊/特效上方。
- 極惡城座標系比舊圖往下偏移一格：舊底部那列顯示成 y=2，新的最底列是 y=1。
- 極惡城 033 障礙物用 `assets/map/極惡城/1/033-01.png`，目前兩個物件各擋 6 格：`[3,3]` 到 `[5,4]`、`[14,3]` 到 `[16,4]`。
- 極惡城 035 障礙物用 `assets/map/極惡城/1/035-01.png`，目前 6 個單格物件：`[2,5]`、`[17,5]`、`[5,2]`、`[14,2]`、`[3,7]`、`[16,7]`。
- 極惡城 036 障礙物用 `assets/map/極惡城/1/036-01.png`，目前 6 個單格物件：`[7,8]`、`[7,9]`、`[7,10]`、`[12,8]`、`[12,9]`、`[12,10]`。
- 極惡城 door1 障礙物用 `assets/map/map/極惡城1/door-overlay.png`，目前佔 8 格：`[8,12]` 到 `[11,11]`。
- 極惡城固定出生點：`blue1 [9,3]`、`blue2 [8,1]`、`blue3 [9,1]`、`blue4 [10,1]`、`grey1 [6,9]`、`grey2 [8,8]`、`grey3 [11,8]`、`grey4 [13,9]`。
- 極惡城地圖規則有測試覆蓋在 `tests/grid.test.js`；改座標、阻擋、物件佔格後至少跑 `node --test .\tests\grid.test.js` 和 `npm test`。
