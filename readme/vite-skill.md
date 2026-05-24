# Vite / ES module 遷移指南

這份文件只記 Vite 與 ES module 遷移。遊戲規則、地圖、忍術、道具細節仍以 `readme/skill.md` 和各拆分文件為主。改 Vite 相關內容後，優先更新本文件。

---

## 1. 遷移目標

最終目標是讓遊戲用 Vite 作為 dev/build 工具，並逐步把 classic script runtime 收斂成 ES module runtime。

大方向：

1. 先加 Vite 作為 dev/build 工具，但保持行為不變。
2. 從低風險資料檔開始轉 ES module，例如 `weapons.js`、`config.js`、`map.js`。
3. 系統檔逐步改成 `import` / `export`，不要再依賴 `<script>` 載入順序。
4. 最後把 `index.html` 底部的多個 classic `<script>` 收斂成一個 `type="module"` entry。
5. 測試要同步改；目前 `npm test` 很多測試仍靠 `tests/helpers/script-loader.js` 模擬舊 script 順序，轉 module 後要逐步改成直接 `import` 測試。

---

## 2. 目前狀態

目前是過渡期，不是全面 ES module 化：

- 目前建議先暫停繼續拆 helper。Vite 骨架與 module mirror 已足夠支援後續開發；短期如果要做幾十種模式、武器、地圖，優先回到玩法內容。
- 已加入 Vite skeleton：`npm run dev`、`npm run build`、`npm run preview`。
- `index.html` 仍保留舊 `<script>` 載入順序，最後才載入 `scripts/main.module.js` 做 module probe。
- 舊 runtime 仍由 classic scripts 執行；module 版目前是 mirror / probe，不接管主遊戲流程。
- `vite.config.js` 目前只打包 module entry，並複製 `assets/`、`scripts/`、`game.js`、`index.html`、`style.css` 到 `dist/`。
- 目前 production build 會轉換 18 個 modules。
- 想用本機 Vite server 玩/測，可雙擊 repo 根目錄的 `啟動遊戲.cmd`。黑色視窗需保持開著，關掉 server 就停止。
- `weapons` 已切成單一來源：只手改 `scripts/data/weapons.module.mjs`，再跑 `npm run sync:weapons` 產生 `scripts/data/weapons.js`。
- `config` 已先切一段單一來源：`ninjutsuRuleProfiles + attackNinjuOutcomeTables + 六顆忍術按鈕 rect + itemSlot/defaultConsumable 常數 + mapItemDrop 常數 + soul/ninjuChain 常數 + 核心戰鬥常數(weapon/maxSkill/objectHp) + NindouConfig` 段落由 `scripts/data/config.module.mjs` 回填，改完要跑 `npm run sync:config-nindou`。
- `ninjutsu-definitions` 已切成單一來源：只手改 `scripts/data/ninjutsu-definitions.module.mjs`，再跑 `npm run sync:ninjutsu-definitions` 產生 `scripts/data/ninjutsu-definitions.js`。
- `locales` 已切成單一來源：只手改 `scripts/data/locales.module.mjs`，再跑 `npm run sync:locales` 產生 `scripts/data/locales.js`。
- `map` 已切成單一來源：只手改 `scripts/data/map.module.mjs`，再跑 `npm run sync:map` 產生 `scripts/data/map.js`。
- `rule-modes` 已切成單一來源：只手改 `scripts/data/rule-modes.module.mjs`，再跑 `npm run sync:rule-modes` 產生 `scripts/data/rule-modes.js`。

目前頁面 probe 檢查：

- `config`
- `weapons`
- `ninjutsu`
- `locales`
- `ruleModes`
- `maps`
- `assets`
- `appearance`
- `stateHelpers`
- `grid`
- `audio`
- `match`
- `consumables`
- `movement`
- `ai`
- `combat`

上述 probe 目前都應該是 `isSynced: true`。

---

## 3. 已完成

### Vite skeleton

- `package.json`：新增 `dev`、`build`、`preview` scripts，加入 `vite`。
- `vite.config.js`：設定 `base: "./"`，build entry 指向 `scripts/main.module.js`，並用 copy plugin 複製 classic runtime 需要的檔案。
- `index.html`：在舊 classic scripts 後載入 `scripts/main.module.js`。
- `啟動遊戲.cmd`：雙擊啟動 `npm run dev` 並開 `http://127.0.0.1:5173/index.html`；使用自身所在資料夾作為工作目錄，搬到其他電腦路徑不同也可用。若第一次沒有 `node_modules`，會先執行 `npm install`。

### Data modules

- `scripts/data/config.module.mjs`
- `scripts/data/weapons.module.mjs`
- `scripts/data/ninjutsu-definitions.module.mjs`
- `scripts/data/locales.module.mjs`
- `scripts/data/rule-modes.module.mjs`
- `scripts/data/map.module.mjs`
- `scripts/data/assets.module.mjs`

### Systems modules

- `scripts/systems/appearance.module.mjs`
- `scripts/systems/state-helpers.module.mjs`
- `scripts/systems/grid.module.mjs`
- `scripts/systems/audio.module.mjs`
- `scripts/systems/match.module.mjs`
- `scripts/systems/consumables.module.mjs`
- `scripts/systems/movement.module.mjs`：目前只 mirror 低風險移動 helper，`skillMove()` 主流程仍留在 classic runtime。
- `scripts/systems/ai.module.mjs`：目前只 mirror AI profile、AI 類型判斷、太刀達人魂/移動 readiness、紅組幾何 helper，`updateAi()` 主流程仍留在 classic runtime。
- `scripts/systems/combat.module.mjs`：目前只 mirror 武器傷害、範圍格、方向選擇、命中收集、揮砍紀錄 helper，`attack()` / `attackCell()` / 扣血破物件流程仍留在 classic runtime。

### Legacy bridges

Classic scripts 暫時會暴露 bridge 供 module probe 比對：

- `scripts/data/config.js -> globalThis.NindouConfig`
- `scripts/data/weapons.js -> globalThis.NindouWeapons`（由 `scripts/tools/generate-weapons-classic.mjs` 產生，勿手改）
- `scripts/data/locales.js -> globalThis.NindouLocales`（由 `scripts/tools/generate-locales-classic.mjs` 產生，勿手改）
- `scripts/data/ninjutsu-definitions.js -> globalThis.NindouNinjutsu`
- `scripts/data/rule-modes.js -> globalThis.NindouRuleModes`
- `scripts/data/map.js -> globalThis.NindouMaps`（由 `scripts/tools/generate-map-classic.mjs` 產生，勿手改）
- `scripts/data/assets.js -> globalThis.NindouAssets`
- `scripts/systems/appearance.js -> globalThis.NindouAppearance`
- `scripts/systems/state-helpers.js -> globalThis.NindouStateHelpers`
- `scripts/systems/grid.js -> globalThis.NindouGrid`
- `scripts/systems/audio.js -> globalThis.NindouAudio`
- `scripts/systems/match.js -> globalThis.NindouMatch`
- `scripts/systems/consumables.js -> globalThis.NindouConsumables`
- `scripts/systems/movement.js -> globalThis.NindouMovement`
- `scripts/systems/ai.js -> globalThis.NindouAi`
- `scripts/systems/combat.js -> globalThis.NindouCombat`

---

## 4. 測試狀態

目前同步測試：

- `tests/config-module.test.js`
- `tests/weapon-module.test.js`
- `tests/ninjutsu-module.test.js`
- `tests/locales-module.test.js`
- `tests/rule-modes-module.test.js`
- `tests/map-module.test.js`
- `tests/assets-module.test.js`
- `tests/appearance-module.test.js`
- `tests/state-helpers-module.test.js`
- `tests/grid-module.test.js`
- `tests/audio-module.test.js`
- `tests/match-module.test.js`
- `tests/consumables-module.test.js`
- `tests/movement-module.test.js`
- `tests/ai-module.test.js`
- `tests/combat-module.test.js`

目前驗證基準：

```powershell
npm test
npm run build
npm run check
npm audit --omit=optional
```

前端確認：

1. 啟動 Vite：`npm run dev`，或雙擊 `啟動遊戲.cmd`。
2. 開 `http://127.0.0.1:5173/index.html`。
3. 確認沒有 page error。
4. 確認 `globalThis.NindouModuleProbe` 內所有 `isSynced` 都是 `true`。

---

## 5. 下一步

目前建議先停在這個邊界：

1. 不再繼續為了轉換而拆更多 helper。
2. 保留 Vite dev/build、module mirror、legacy bridge、同步測試，作為後續安全網。
3. 如果短期目標是新增模式、武器、地圖，照既有 classic runtime 開發即可；必要時同步補 module mirror。
4. 如果之後要正式推進 ES module 化，先選一條 runtime 接管路線，不要再只做旁路 mirror。
5. 第一條正式接管路線建議從低副作用入口開始，例如讓某個資料/純 helper 呼叫點改用 module import，再移除對應 legacy 依賴。
6. `skillMove()`、`updateAi()`、`attack()`、`attackCell()`、`ninjutsu.js` 都是高副作用流程，只有在有明確接管計畫與測試時再動。
7. 測試逐步從 `script-loader.js` 改成直接 import module；同時保留少量 legacy sync 測試，直到 classic scripts 移除。
8. 最後才收斂 `index.html` 的 classic scripts，只留下單一 module entry。

武器資料日常流程：

1. 只改 `scripts/data/weapons.module.mjs`。
2. 跑 `npm run sync:weapons` 產生 classic bridge `scripts/data/weapons.js`。
3. 跑 `npm test` 與 `npm run build`，確認 probe / mirror 同步。

locales 資料日常流程：

1. 只改 `scripts/data/locales.module.mjs`。
2. 跑 `npm run sync:locales` 產生 classic bridge `scripts/data/locales.js`。
3. 跑 `npm test` 與 `npm run build`，確認 probe / mirror 同步。

map 資料日常流程：

1. 只改 `scripts/data/map.module.mjs`。
2. 跑 `npm run sync:map` 產生 classic bridge `scripts/data/map.js`。
3. 跑 `npm test` 與 `npm run build`，確認 probe / mirror 同步。

暫時不要做：

- 不要直接把 `game.js` 全量改成 module。
- 不要繼續無目標地新增 mirror module。
- 不要移除 classic scripts 載入順序。
- 不要刪 bridge，除非對應 runtime 已正式改用 import。
- 不要讓 module import 時建立 `Audio`、讀 DOM、啟動主迴圈或修改全域 `state`。

---

## 6. 轉換原則

- module 版優先使用依賴注入：`stateLike`、`gridLike`、`mapDefinition`、`imageMap`、callbacks。
- classic script 保持目前遊戲行為，只補 `globalThis.Nindou*` bridge。
- `scripts/main.module.js` 只做 probe，不接管流程。
- 每個 module 都要有 `summarize*()` helper，供 browser probe 和 Node test 比對。
- 如果 browser probe 和 Node test 不一致，優先相信 browser probe，因為 browser 裡 top-level `const` / `let` 不一定掛在 `globalThis`。
