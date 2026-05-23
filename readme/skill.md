# 忍豆風雲2單機版：專案說明與接手指南

Do not assume this document is fully up to date. Verify against the current code before making changes.

---

## 1. 基本工作規範

- 程式碼註解盡量用中文，避免為了躲亂碼直接改成英文。
- 路徑、函式、資料 key、參數名稱要寫明確。
- 如果文件或註解出現亂碼，優先修 UTF-8 讀寫方式，不要改寫成別的語言逃避問題。

---

## 2. Git 與操作習慣

- 功能做完一段就 commit，不要把很多無關變更混成一包。
- 新功能先開分支，不直接推 `main`。
- 工作樹可能本來就有使用者自己的修改，不要順手清掉。
- 預設可忽略不影響執行的檔案，例如 `readme/**`、`*.md`、`*.xlsx`、暫存筆記；除非使用者明確要求整理。
- 但只要有被程式實際引用，就不能當成「只是素材」忽略。像 `index.html`、`game.js`、`scripts/**`、`scripts/data/assets.js` 參照到的圖片、音效、動畫影格，都要一起處理。

---

## 3. 驗證最低標準

修改 JS 後至少先跑：

```powershell
node --check .\game.js
```

如果有碰規則、座標、戰鬥、武器、測試 scaffold，再跑：

```powershell
npm test
```

如果有碰 Vite、`.module.mjs`、legacy bridge、`scripts/main.module.js`、`index.html` 腳本載入或啟動檔，再跑：

```powershell
npm test
npm run build
```

並用 Vite 頁面確認 `globalThis.NindouModuleProbe` 內所有 `isSynced` 都是 `true`。
---

## 4. 專案目前狀態

這是用 `HTML + Canvas + JavaScript` 做的《忍豆風雲2》單機版瀏覽器原型，目前已加入 Vite 作為 dev/build 工具，並處於 classic script runtime + ES module mirror/probe 的過渡期。

目前重要架構狀態：

- 本機開發優先用 Vite：雙擊 repo 根目錄的 `啟動遊戲.cmd`，或在 repo 內執行 `npm run dev` 後開 `http://127.0.0.1:5173/index.html`。
- `index.html` 仍保留舊 classic `<script>` 載入順序；最後再載入 `scripts/main.module.js` 做 module probe。
- 舊 runtime 仍由 classic scripts 執行；module 版目前主要是 mirror / probe，不接管主遊戲流程。
- Vite / ES module 遷移細節以 [`readme/vite-skill.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/vite-skill.md) 為準。只要改 Vite、module mirror、legacy bridge、`scripts/main.module.js`、Vite 測試或啟動方式，都要同步更新該文件。
- 目前建議暫停無目標地新增 mirror module；如果是新增模式、武器、地圖，優先照既有 runtime 開發，必要時同步補 module mirror 與 probe。
- 武器資料已改成「module 單一來源」：請只手改 `scripts/data/weapons.module.mjs`，再跑 `npm run sync:weapons` 產生 `scripts/data/weapons.js`。
- locales 資料已改成「module 單一來源」：請只手改 `scripts/data/locales.module.mjs`，再跑 `npm run sync:locales` 產生 `scripts/data/locales.js`。
- map 資料已改成「module 單一來源」：請只手改 `scripts/data/map.module.mjs`，再跑 `npm run sync:map` 產生 `scripts/data/map.js`。

目前已知可用狀態：

- 房間畫面與戰鬥畫面可正常切換。
- 房間卡片可新增、刪除、設定 `HP / 控制模式 / 武器`。
- 預設啟用角色是 `blue1` 與 `grey1`。
- `slot 1` 不能刪除。
- 玩家可在房間編輯畫面自選 6 種忍術。
- 戰鬥中可移動、近戰、衝撞、施放忍術、丟錢鏢。
- 有 HP、技量、魂系統。
- 戰鬥結束後會進入結算，再回到房間。
- 回房間後保留開戰前的房間設定。
- 房間與戰鬥 HUD 目前只保留中文顯示。
- 已接入最小 consumable 系統，目前有 `backup3`（神水）與 `sake4`（神酒）。

---

## 5. 載入順序與檔案職責

### `index.html` classic runtime 載入順序、各檔案職責

```text
scripts/data/config.js                 -> 共用常數、移動動畫 timing、忍術數值、掉落設定、道具欄位置
scripts/data/weapons.js                -> 由 module 產生的 classic bridge（勿手改）
scripts/tools/generate-weapons-classic.mjs -> 由 weapons.module.mjs 產生 weapons.js 的工具
scripts/data/ninjutsu-definitions.js   -> ninjuCatalog、editor 分類排序、defaultNinjuLoadout
scripts/data/locales.js                -> 由 module 產生的 classic bridge（勿手改）
scripts/tools/generate-locales-classic.mjs -> 由 locales.module.mjs 產生 locales.js 的工具
scripts/data/map.js                    -> 由 module 產生的 classic bridge（勿手改）
scripts/tools/generate-map-classic.mjs -> 由 map.module.mjs 產生 map.js 的工具
scripts/data/assets.js                 -> 圖片、音效、動畫影格來源、attackNinjuConfigs
scripts/data/render-tuning.js          -> Canvas 視覺微調資料：眼睛、錢鏢、移動殘影與施術 sprite offset
scripts/data/rule-modes.js             -> original / modified 規則查詢入口
scripts/systems/appearance.js          -> 外觀定義查詢、角色外觀解析、眼睛素材選擇
scripts/systems/asset-loader.js        -> classic runtime 圖片與動畫影格載入
scripts/data/map.js                    -> 地圖物件初始資料
scripts/systems/grid.js                -> 格子、座標轉換、出生格洗牌、方向判定與面向更新
scripts/systems/state-helpers.js       -> 共用狀態工具、選取角色、拖曳狀態、傷害/時間格式、隊伍存活數、魂量累積
scripts/systems/audio.js               -> BGM 切換、音量套用、短音效播放入口
scripts/systems/ninjutsu.js            -> 忍術施放、chain、錢鏢、變身流程
scripts/systems/consumables.js         -> 道具背包、掉落、使用、連用流程
scripts/systems/combat.js              -> 近戰攻擊、範圍、命中、傷害、物件破壞
scripts/systems/movement.js            -> 移動、消耗技量、衝撞
scripts/systems/movement-renderer.js   -> 移動殘影、平滑座標、拖曳箭頭與角色移動/施術 sprite 繪製 helper
scripts/systems/battle-runtime.js      -> 集技、開場倒數、對戰 active 與忍術 dispatch helper
scripts/systems/battle-input.js        -> 戰鬥滑鼠輸入、拖曳與戰鬥中點擊判定
scripts/systems/ai.js                  -> AI profile 與決策流程
scripts/systems/match.js               -> 勝負判定、結算
scripts/systems/room-ui.js             -> 房間文案套用、外觀卡、規則/地圖選單、忍術編輯器、商店、房間卡數值/下拉 DOM helper
scripts/systems/battle-setup.js        -> 開局建立角色、起始位置與整局 reset helper
scripts/systems/game-flow.js           -> 開戰/回房、重開長按、模式切換與房間流程協調
scripts/systems/scene-renderer.js      -> 戰鬥背景、地圖遮罩、外框與格子提示繪製
scripts/systems/status-ui.js           -> 狀態訊息與側邊資訊面板更新
scripts/systems/unit-renderer.js       -> 角色本體、分身、血條、名字、眼睛與 buff 外圈繪製
scripts/systems/combat-renderer.js     -> 地圖物件、武器揮砍、錢鏢射出與近戰攻擊視覺繪製
scripts/systems/effects-renderer.js    -> 忍術施放、命中與道具使用的 Canvas 特效繪製
scripts/systems/hud-renderer.js        -> 戰鬥 HUD、魂條、道具列、忍術按鈕與 HUD 文字繪製
scripts/systems/overlay-renderer.js    -> 倒數與結算 Canvas 覆蓋層繪製
scripts/systems/app-bootstrap.js       -> 啟動流程、DOM 事件綁定與房間初始化
game.js                                -> DOM 參考、runtime state、主迴圈
```

`index.html` 目前最後還會載入：

```text
scripts/main.module.js                 -> Vite / ES module probe entry，不接管主遊戲流程
```

目前 `NindouModuleProbe` 會檢查：

```text
config, weapons, ninjutsu, locales, ruleModes, maps, assets,
appearance, stateHelpers, grid, audio, match, consumables,
movement, ai, combat
```

### ES module mirror 對照

下列 `.module.mjs` 是目前 Vite 過渡期的新寫法。改到已 mirror 的資料或 helper 時，要同步維護 classic script、module mirror、legacy bridge、`scripts/main.module.js` probe 與對應 `tests/*-module.test.js`。

```text
scripts/data/config.js                 -> scripts/data/config.module.mjs
scripts/data/weapons.js                -> scripts/data/weapons.module.mjs（generated bridge，來源是 module）
scripts/data/ninjutsu-definitions.js   -> scripts/data/ninjutsu-definitions.module.mjs
scripts/data/locales.js                -> scripts/data/locales.module.mjs（generated bridge，來源是 module）
scripts/data/assets.js                 -> scripts/data/assets.module.mjs
scripts/data/rule-modes.js             -> scripts/data/rule-modes.module.mjs
scripts/data/map.js                    -> scripts/data/map.module.mjs（generated bridge，來源是 module）
scripts/systems/appearance.js          -> scripts/systems/appearance.module.mjs
scripts/systems/grid.js                -> scripts/systems/grid.module.mjs
scripts/systems/state-helpers.js       -> scripts/systems/state-helpers.module.mjs
scripts/systems/audio.js               -> scripts/systems/audio.module.mjs
scripts/systems/consumables.js         -> scripts/systems/consumables.module.mjs
scripts/systems/combat.js              -> scripts/systems/combat.module.mjs
scripts/systems/movement.js            -> scripts/systems/movement.module.mjs
scripts/systems/ai.js                  -> scripts/systems/ai.module.mjs
scripts/systems/match.js               -> scripts/systems/match.module.mjs
```

尚未正式 mirror / 接管：

```text
scripts/systems/ninjutsu.js            -> 目前只有資料層 scripts/data/ninjutsu-definitions.module.mjs；施放流程仍是 classic runtime
game.js                                -> 尚未 module 化；不要直接全量改成 module
```

### 新功能放置原則

- 資料先放 `scripts/data/*`，不要把表、數值、素材 key 散塞進 `game.js`。
- 行為先放 `scripts/systems/*`，不要把流程全部堆回 `game.js`。
- 如果對應 `.module.mjs` 已存在，新增或調整純資料/純 helper 時要同步考慮 module mirror、legacy `globalThis.Nindou*` bridge、`scripts/main.module.js` probe 與 `tests/*-module.test.js`。
- 武器資料調整後固定流程：改 `scripts/data/weapons.module.mjs` -> 跑 `npm run sync:weapons` -> 跑 `npm test`。
- locales 資料調整後固定流程：改 `scripts/data/locales.module.mjs` -> 跑 `npm run sync:locales` -> 跑 `npm test`。
- map 資料調整後固定流程：改 `scripts/data/map.module.mjs` -> 跑 `npm run sync:map` -> 跑 `npm test`。
- 不要新增依賴 classic `<script>` 載入順序的全新 helper；新 helper 優先寫成可注入依賴、可被 ES module import 測試的形式。
- 只有直接碰主迴圈與 runtime state 時，才進 `game.js`；啟動流程、DOM 事件綁定與房間初始化先看 `scripts/systems/app-bootstrap.js`，房間外觀卡、忍術編輯器、商店背包與規則/地圖選單先看 `scripts/systems/room-ui.js`，開局建立角色、起始位置與整局 reset 先看 `scripts/systems/battle-setup.js`，集技、開場倒數、對戰 active 與忍術 dispatch 先看 `scripts/systems/battle-runtime.js`，戰鬥滑鼠輸入、拖曳與戰鬥中點擊判定先看 `scripts/systems/battle-input.js`，開戰/回房、重開長按、模式切換與房間流程協調先看 `scripts/systems/game-flow.js`，戰鬥背景與格子提示先看 `scripts/systems/scene-renderer.js`，狀態訊息與側邊資訊面板先看 `scripts/systems/status-ui.js`，角色本體、分身、血條、名字、眼睛與 buff 外圈先看 `scripts/systems/unit-renderer.js`，地圖物件、武器揮砍、錢鏢射出與近戰攻擊視覺先看 `scripts/systems/combat-renderer.js`，移動殘影、平滑座標、拖曳箭頭與角色移動/施術 sprite helper 先看 `scripts/systems/movement-renderer.js`，忍術/道具特效先看 `scripts/systems/effects-renderer.js`，戰鬥 HUD 先看 `scripts/systems/hud-renderer.js`，倒數/結算覆蓋層先看 `scripts/systems/overlay-renderer.js`。
- 外觀解析、BGM/音效入口、道具流程、出生格洗牌、隊伍存活數都已拆出 `game.js`；改這些功能先找對應 `scripts/systems/*`。
- `scripts/systems/grid.js` 不處理 DOM event；滑鼠事件先由 `game.js -> pointerMove()` 換成 `state.pointer` / `pointToCell()` 結果。
- 同一份規則不要在多個檔案維護兩套；例如模式差異統一經過 `scripts/data/rule-modes.js`。

---

## 6. 主迴圈與遊戲流程

### `game.js -> draw()` 每幀大致順序

1. `updateMatchState`
2. `updateCharging` / `updateNinju` / `updateAi` / `updateProjectiles`（只清舊版殘留 projectile）
3. 繪製 `backdrop -> board -> drag -> mapObjects -> moveTrails -> units -> ninjuEffects -> moneyDartShoot -> attacks -> gameHud -> ninjuBar`
4. 覆蓋層 `countdownOverlay -> resultOverlay`

### 遊戲流程

房間畫面 -> `startBattleFromRoom()` -> 戰鬥 -> `checkVictory()` -> `finishMatch()` -> 結算 -> `returnToRoomFromResult()`

---

## 7. 座標系

- 地圖、座標、阻擋格、出生點、圖層與素材細節已拆到 [`readme/maps.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/maps.md)。
- 只記最常用規則：玩家座標 `[1,1]` 是左下角第一格，往右是 `[2,1]`，往上是 `[1,2]`。
- `internalCellCoord()` / `displayCellCoord()` 負責玩家座標與內部座標互轉。

### 地圖系統

- 入口：`index.html -> #roomMapSelect`、`scripts/data/config.js -> roomMapDefinitions`、`scripts/data/map.js -> mapObjectBuilders` / `buildMapObjects()`、`scripts/systems/grid.js`。
- 目前地圖：`country-10`（鄉野之十，預設）、`evil-castle-1`（極惡城之一）、`evil-castle-2`（極惡城之二）。
- 新增或調整地圖前先看 [`readme/maps.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/maps.md)，尤其是 offset 保護規則。

---

## 8. 規則模式（Rule Mode）

房間左上角現在是下拉選單，不是 checkbox。

模式對應：

- `忍2原版` -> `original`
- `忍2修改` -> `modified`

目前 live code 行為：

- `original` 走原版 profile。
- `modified` 走修改版 profile。

模式查詢入口在 `scripts/data/rule-modes.js`，常用函式：

- `currentRuleModeKey()`
- `weaponDamageForMode()`
- `steelRule()`
- `hotBloodRule()`
- `healNinjuRule()`
- `specialNinjuRule()`
- `moneyDartRule()`
- `attackNinjuRule()`

不要直接跳過這層去讀 fallback 常數。

---

## 9. 房間畫面與忍術編輯

主要位置：

- `index.html`
- `style.css`
- `game.js`
- `game.js -> renderNinjuEditor()`

房間畫面規則：

- 每張卡可設定 `HP / 控制模式 / 武器`。
- `blue1` 目前可設定外觀；外觀資料集中在 `scripts/data/assets.js -> lookDefinitions`。
- 左上角規則模式用下拉選單。
- 房間卡片的 `体` 框設定開戰最大 HP；`技` 框設定開戰初始技量與該角色本局技量上限，預設 `18`，可手動提高到 `9999`。
- 房間文字按鈕共用 `style.css -> .room-text-button`。

外觀新增規則：

- 新外觀先在 `lookDefinitions` 增加一個 key，設定 `labelKey / roomAvatarSrc / roomAvatarEyeSrc / eyeFrontImageKey / eyeSideImageKey / spriteSet / moveSet / useNinjuSet / moneyDartReadySet / moneyDartShootSet`。
- 新外觀的眼睛圖先加到 `imageSources`，再用 `eyeFrontImageKey / eyeSideImageKey` 指過去；不要在 `game.js` 針對單一路徑寫 `if`。
- 選單會由 `lookDefinitions` 自動產生；新增外觀只要在 `scripts/data/locales.js` 補對應 `labelKey` 文案。
- `assets/characters/ai` 這類 `a1 / a2 / a3 / a4` 結構優先用 `aiIdleImageSources()`、`aiPrearriveFrameSources()`、`aiArriveFrameSources()`、`aiUseNinjuFrameSources()`、`aiMoneyDartReadyFrameSources()`、`aiMoneyDartShootFrameSources()` 產生路徑。
- idle / move / use_ninju / dart / dart_shoot 影格仍由 `imageSources`、`movePrearriveFrameSources`、`moveArriveFrameSources`、`useNinjuFrameSources`、`moneyDartReadyFrameSources`、`moneyDartShootFrameSources` 對應到同一組資料 key。
- 如果新外觀只有部分素材，缺的先回退到預設外觀，不要為了接線硬猜方向或硬補不存在的圖。
- 如果某套素材檔名本身看不出方向，先列出辨識結果給使用者確認，再決定要不要改名或接進對應 frame set。
- 若角色本來就不需要眼睛，直接在 `lookDefinitions[*]` 設 `drawEyes: false`，房間頭像則把 `roomAvatarEyeSrc` 設成 `null`。

忍術編輯規則：

- 玩家可自選 6 種忍術，上排順序就是戰鬥中的忍術列順序。
- 編輯 UI、分類、排序、框圖規則已移到 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)。
- 主要資料入口仍是 `scripts/data/ninjutsu-definitions.js -> ninjuCatalog` / `ninjuEditorCatalog` / `defaultNinjuLoadout`。

---

## 10. 戰鬥規則與魂系統

### 戰鬥畫面規則

- 玩家主要用拖曳移動。
- 移動、攻擊、忍術都受技量與狀態限制。
- 戰鬥中長按 `R` 3 秒可中止回房間。
- 結算畫面要等 2 秒後點滑鼠才回房間。
- 回房間後保留開戰前設定。

### 魂系統

- 移動會累積魂。
- 攻擊命中、被攻擊、撞人、死亡也會加魂。
- 魂最高 4 級。
- 攻擊系忍術至少需要魂 1。
- 攻擊系忍術目前消耗魂，不消耗技。

目前魂量效果：

- 魂 1 打 1 人
- 魂 2 打 2 人
- 魂 3 打 3 人
- 魂 4 打 4 人
- 攻擊系忍術使用後魂歸零

---

## 11. 忍術系統重點

- 忍術入口、資料層、施放流程、編輯 UI、攻擊系/分身/錢鏢細節已拆到 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)。
- 忍術數值整理表維持在 [`readme/ninjutsu-table.csv`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu-table.csv)。
- 所有忍術施放中的 active 階段都可中間移動 3 段，額度由 `scripts/data/config.js -> ninjuFollowupMoveAllowance` 控制；`shinki` 雖然會在施放開始時套用全隊僵直，也必須放行施放者這 3 段移動。
- 改忍術前先看 `readme/ninjutsu.md`，避免把數值散回流程檔。
- 高風險提醒：`moneyDart` 不要改成飛行 projectile；`cloneOpenCells()` 不要硬寫舊地圖邊界；`shinki` 的隊友動畫要在施放開始時同步套用。

---

## 12. 武器系統重點

主要位置：

- 武器資料：`scripts/data/weapons.js -> weaponDefinitions`
- 模式傷害：`scripts/data/rule-modes.js -> weaponDamageForMode()`
- 攻擊範圍：`scripts/systems/combat.js -> weaponAreaCells()`
- 攻擊音效：`scripts/systems/combat.js -> slashSoundKeyForWeapon()`
- 素材與音效來源：`scripts/data/assets.js`
- attack 畫面比例：`game.js -> attackScaleByWeapon`
- hand 畫面比例：`game.js -> handScaleByWeapon`
- attack offset：`game.js -> drawKunaiAttackFrame()`
- hand offset：`game.js -> drawKunaiHandAttackFrame()`

常改欄位：

- 攻速：`cooldownMs`
- 基礎傷害：`damage`
- 模式覆蓋：`modeRuleProfiles`
- 範圍：`weaponAreaCells()`

目前已接入武器：

| ID | 名稱 | area | 備註 |
| --- | --- | --- | --- |
| `weapon1` | 苦無 | `single` | 預設武器 |
| `weapon3` | 忍太刀 | `nodachi` | 使用既有 fallback 範圍 |
| `weapon4` | 伊賀密刀 | `line2` | modified 有覆蓋傷害 |
| `weapon6` | 鐵扇不知火 | `fan` | modified 有覆蓋傷害 |
| `weapon7` | 極冰鬼切丸 | `line2` | 已接 1 秒揮砍動畫 |
| `weapon8` | 伊賀溜溜球 | `ring8` | original / modified 有差異 |
| `weapon10` | 風魔手裏劍 | `line6` | 正前方 6 格 |
| `weapon44` | 滅魂之劍 | `NinjaS` | 前方橫列 3 格 |
| `weapon106` | 光劍 | `NinjaS` | 前方橫列 3 格 |

新增武器至少要同步：

- `scripts/data/weapons.js` 新增 `weaponDefinitions`
- `scripts/systems/combat.js -> weaponAreaCells()` 補 `area`
- `assets/weapon/...` 補動畫素材
- `assets/sounds/weapon/<編號>.ogg` 補音效

高風險提醒：

- `drawKunaiAttackFrame()` 與 `drawKunaiHandAttackFrame()` 的 offset 多半是人工校準，除非使用者明確要求，不要順手改。

---

## 13. AI 系統重點

主要位置：

- `scripts/systems/ai.js`
- `scripts/systems/ai.js -> aiProfiles`

目前 AI 類型：

| ID | 名稱 | 行為 |
| --- | --- | --- |
| `ai_beginner` | 初心者 | 一般近戰 AI |
| `ai_red` | 赤組 | 固定用 `weapon8` 與赤組外觀，不受技限制，依定時/受擊/九宮格規則行動 |
| `ai_tachi_master` | 太刀達人 | 固定用 `weapon3` 忍太刀；低於 200 HP 用活氣；有鋼鐵才主動攻擊 |
| `ai_god` | AI神人 | 反應快，會拿錢鏢與野火 |
| `ai_money_dart_master` | 錢鏢神人 | 偏重找直線丟錢鏢 |
| `ai_dart_only_master` | 尬鏢神人 | 幾乎只追線丟錢鏢 |

錢鏢 AI 入口：

- `aiMoneyDartAimCell()`
- `aiCanStartMoneyDartAfterLineDelay()`
- `tryAiThrowMoneyDart()`
- `aiStepToMoneyDartLine()`

實作約束：

- `ai_red` 固定武器是 `weapon8`（伊賀溜溜球），房間武器下拉只作顯示，不影響實戰武器。
- `ai_red` 固定套用 `lookDefinitions.red` 赤組外觀；不管在藍隊或灰隊，`unitLookDefinition()` 都要讓赤組外觀優先於隊伍預設外觀。
- `ai_red` 建立角色時預設面向是 `down`。
- `ai_red` 定時忍術：`0~90` 秒隨機放 `clone`、`12~30` 秒隨機放 `steel`、`30~60` 秒隨機放 `wildfire` 或 `freeze`。
- `ai_red` 敵人在自身九宮格內時，優先使用 `weapon8` 攻擊。
- `ai_red` 被斜角攻擊時：`15%` 分身、`35%` 衝撞、`50%` 直接用溜溜球反擊。
- `ai_red` 被直線攻擊時：若攻擊者仍在同列/同行，固定在 `0.5` 秒後排入衝撞反擊，不要呆站到下一輪一般巡邏。
- `ai_red` 與玩家同列/同行時：`15%` 分身，否則排入延遲衝撞；距離 `1/2/3...` 格分別延遲 `0.5/0.6/0.7...` 秒。
- `ai_red` 平常不太移動；只有在敵方血量低於 `30%` 時，才有 `50%` 機率追擊。
- `ai_tachi_master` 固定武器是 `weapon3`（忍太刀），可用忍術是 `moneyDart`、`steel`、`kakki`、`flash`；HP 低於 `200` 且未滿血時優先施放 `kakki`。
- `ai_tachi_master` 的 `flash` 只有在 HP `150` 以下且已有至少魂一時才會施放。
- `ai_tachi_master` 沒有鋼鐵時不主動使用武器、衝撞、錢鏢或閃光攻擊；鋼鐵啟動後才會進攻。
- `ai_tachi_master` 的技量上限固定為 `18`，錢鏢準備/投擲機率是錢鏢神人的 `49%`，直線發標等待時間是 `900ms`；這些只影響 AI 何時發標，不能新增錢鏢飛行速度。
- `ai_tachi_master` 平常會盡量原地集技；只有最近 `0.5` 秒內受擊，或技量達自身上限 `90%` 以上時，才會比較積極移動換位。
- `ai_tachi_master` 的魂條改成時間累積：`30` 秒到魂一、`60` 秒到魂二，之後每 `30` 秒再升一段，最多到魂四。
- `ai_dart_only_master` 不近戰、不撞人、不用武器，只追線丟錢鏢。
- AI 不應播放玩家專用的 `useNinju` 視覺/操作干擾。
- 不要讓錢鏢準備或投擲打斷玩家拖曳互動。

---

## 14. 道具系統（Consumables）

- 道具完整規格、素材、音效、商店、背包與近期紀錄已拆到 [`readme/consumables.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/consumables.md)。
- 目前 live code 有 2 種 consumable：`backup3` 是「神水」、`sake4` 是「神酒」。
- 共通原則：道具一件一格；使用成功要播 `click_item.ogg`；神水/神酒額外播 `sp_up.ogg` 並使用 `regen_sp` 動畫。
- 所有道具使用中的 active 階段也可中間移動 3 段；續接道具仍保留和忍術相同的 queue / gap 流程。
- 忍術與道具互相連點時不能插播另一套動畫：`忍術 -> 忍術 -> 道具` 必須等兩段忍術各自 1.5 秒動畫完成後才觸發道具動畫；`道具 -> 忍術 -> 忍術` 也要等道具 1.5 秒動畫完成後才開始忍術 queue。
- 道具背包、掉落、使用與連用流程在 `scripts/systems/consumables.js`；戰鬥 HUD 繪製在 `scripts/systems/hud-renderer.js`；`game.js` 只保留商店 DOM 與房間協調。
- 高風險提醒：神水、神酒不要改用忍術音效；道具連點要維持類似忍術 chain 的排隊與 gap 行為。

---

## 15. 素材與命名規則

正式素材資料夾：

- `assets/characters`
- `assets/ninju`
- `assets/weapon`
- `assets/map`
- `assets/ui`
- `assets/sounds`

候選素材資料夾：

- `assets/_candidates`

命名慣例：

| 類型 | 路徑 |
| --- | --- |
| 角色 sprite | `assets/characters/{idle,move,charge,use-ninju,parts}/` |
| 武器動畫 | `assets/weapon/{folder}/{direction}_{hand\|attack}/{n}.png` |
| 忍術動畫 | `assets/ninju/` |
| 音效 | `assets/sounds/sfx/` |
| 房間 UI | `assets/room/` |

武器音效規則：

```text
weaponX -> assets/sounds/weapon/X.ogg
```

例如：

```text
weapon8 -> assets/sounds/weapon/8.ogg
```

素材改名補充規則：

- 如果素材檔名本身無法直接看出方向，例如只剩流水號、`Symbol xxxx.png`、或要靠排序/尺寸/資料夾結構推斷 `left/right/up/down`，不要直接批次改名。
- 先把目前辨識結果明確列給使用者確認；確認後才能動手改。
- 只有方向非常明確、且不需要主觀判讀時，才可直接改名。

不要把 BGM 改回系統絕對路徑：

- 房間 BGM：`scripts/data/assets.js -> roomBgm`，目前是 `assets/sounds/bgm/忍2大廳.mp3`。
- 預設戰鬥 BGM：`scripts/data/assets.js -> defaultBattleBgmSrc`，目前是 `assets/sounds/bgm/忍3鄉野.mp3`。
- 地圖專屬戰鬥 BGM：`scripts/data/config.js -> roomMapDefinitions[*].battleBgmSrc`，例如極惡城是 `assets/sounds/bgm/忍2鬼島戰鬥.mp3`。
- BGM 切換、音量套用與 `playSound()` / `playBreakSound()` 在 `scripts/systems/audio.js`；`game.js` 只綁定音量 slider 和互動啟動事件。

---

## 16. 高風險區與不要做的事

這些值通常是人工調好的，改之前先確認使用者真的要動：

- `scripts/data/render-tuning.js -> eyeOffsets`
- `scripts/data/render-tuning.js -> useNinjuSpriteOffset`
- `scripts/data/render-tuning.js -> moveEffectOffsets`
- `scripts/data/render-tuning.js -> moneyDartVisualOffsets`

不要做的事：

- 不要把新的資料表、規則表、素材 key 繼續堆回 `game.js`。
- 不要直接跳過 `rule-modes.js` 去硬寫模式差異。
- 不要把 `death` 直接覆蓋成 `wildfire`。
- 不要把 `wildfire` 素材改回 `assets/ninju/status/small_fire/`。
- 不要讓 `hotBlood` 影響衝撞或錢鏢。
- 不要讓 AI 播放玩家專用 `useNinju` 表現。
- 不要為了躲亂碼，把中文註解改成英文或 `\uXXXX`。

---

## 17. 如果要改某一塊，先看哪裡

想改畫面：

- `game.js`
- `style.css`
- `assets/`

想改房間或編輯介面：

- `index.html`
- `style.css`
- `game.js`
- `game.js -> renderNinjuEditor()`

想改武器數值或範圍：

- `scripts/data/weapons.js`
- `scripts/data/rule-modes.js`
- `scripts/systems/combat.js`

想改忍術數值：

- 先看 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)
- `scripts/data/config.js -> ninjutsuRuleProfiles`
- `scripts/data/config.js -> attackNinjuOutcomeTables`
- `scripts/data/rule-modes.js`
- `scripts/systems/ninjutsu.js`
- `scripts/data/assets.js`

想改忍術清單或 editor 排序：

- 先看 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)
- `scripts/data/ninjutsu-definitions.js`
- `style.css`
- `game.js -> renderNinjuEditor()`

想改地圖：

- 先看 [`readme/maps.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/maps.md)
- `scripts/data/config.js -> roomMapDefinitions`
- `scripts/data/map.js`
- `tests/grid.test.js`

想改 AI：

- `scripts/systems/ai.js`

想改道具：

- `scripts/data/config.js`
- `scripts/data/assets.js`
- `scripts/systems/consumables.js`
- `scripts/systems/combat.js`
- `game.js`

想改角色外觀：

- `scripts/data/assets.js -> lookDefinitions` / `baseTeamLookDefinitions`
- `scripts/data/locales.js -> look label`
- `scripts/systems/appearance.js -> unitLookDefinition()` / 眼睛素材選擇
- `game.js -> selectedLookKey()` / 房間外觀下拉 DOM

想改 BGM 或音效播放流程：

- `scripts/data/assets.js -> roomBgm` / `defaultBattleBgmSrc` / `soundSources`
- `scripts/data/config.js -> roomMapDefinitions[*].battleBgmSrc`
- `scripts/systems/audio.js -> syncBgm()` / `startBgm()` / `playSound()`
- `game.js` 只負責音量 slider 與使用者互動後啟動播放

想改素材或音效：

- `assets/`
- `assets/sounds/`
- `scripts/data/assets.js`

---

## 18. 測試與 PowerShell

如果 PowerShell 擋住 `npm.ps1`，可用：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

`package.json` 目前常用 scripts：

```json
{
  "scripts": {
    "check": "node --check game.js",
    "test": "node --test",
    "dev": "vite --host 127.0.0.1",
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1"
  }
}
```

目前測試重點：

- `tests/helpers/script-loader.js`
- `tests/helpers/script-loader.js -> contextValue(context, expression)` 用來讀 VM lexical scope 裡的 `const`，例如 `ARRIVE_TOTAL`；不要再為了測試把這類常數硬塞成 `context.ARRIVE_TOTAL` stub。
- `tests/rule-modes.test.js`
- `tests/grid.test.js`
- `tests/combat.test.js`
- `tests/ninjutsu.test.js`
- `tests/ai.test.js`
- `tests/assets.test.js`
- `tests/weapon-animation-timing.test.js`
- `tests/movement.test.js`

目前已覆蓋：

- `modified / original` 規則切換
- 座標與障礙
- 武器傷害與範圍
- 神酒移動不耗技、一般移動耗技、忍術/道具施放使用中間三段移動
- 攻擊忍術魂量門檻、攻擊忍術消耗魂、分身施放、分身血條/名稱/外觀資料、地圖可走格候選、死亡清理、錢鏢重複排程不重複扣技
- `scripts/data/assets.js` 靜態素材、BGM、音效、武器動畫影格、地圖圖片 key、外觀 sprite/frame set、`index.html` 與 `style.css` 直接引用路徑是否存在
- 武器揮砍動畫時長是否等於 `cooldownMs`
- `赤組` 的無技施法、斜角反擊、九宮格武器攻擊、直線延遲衝撞

---

## 19. 近期已確認的結構狀態

### 拆分後的細節文件

- 地圖、座標、素材、阻擋格、出生點與近期地圖微調：[`readme/maps.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/maps.md)
- 忍術資料層、編輯 UI、攻擊系、分身、錢鏢與近期忍術修正：[`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)
- 道具、商店、道具欄、神水、神酒與道具音效/動畫：[`readme/consumables.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/consumables.md)

### 2026-05-18 道具系統

- live code 已有 `backup3`（神水）與 `sake4`（神酒）。
- 道具採一件一格；同種道具多個時要分散到多個 `itemSlots`。
- 房間商店左側點擊已實作道具會直接加入 `state.roomItemSlots`，開戰時套到玩家戰鬥 HUD 的 `itemSlots`。

### 2026-05-22 灰組預設控制

- `game.js -> setupControlSelects()` 現在會把灰組空白控制選單預設成 `player`，藍組空白控制選單維持 `ai_red`。
- `game.js -> setupRoomSlots()` 也會讓新啟用的灰組卡片預設成 `player`，不再自動指定 `ai_red`。
- 房間玩家卡片已移除室長/準備狀態圖、段位與身份文字；不要再用 `.room-level`、`.room-owner`、`.room-ready` 回填卡片顯示。

### 2026-05-22 忍3模式移除

- 房間左上角規則模式目前只保留 `忍2原版` / `original` 與 `忍2修改` / `modified`。
- 舊 `n3` 規則入口已從 `index.html`、`game.js`、`scripts/data/locales.js`、`scripts/data/rule-modes.js`、`scripts/data/config.js` 與 `tests/rule-modes.test.js` 移除。
- 若外部狀態殘留 `ruleModeKey: "n3"`，`currentRuleModeKey()` 與 `setRuleMode()` 會回落到 `original`。

### 2026-05-23 `game.js` 拆分整理

- `scripts/systems/consumables.js` 承接道具背包、掉落、使用、連用與 `state.onRoomInventoryChanged` hook；`scripts/systems/hud-renderer.js` 承接戰鬥 HUD 繪製；`game.js` 保留商店 DOM 與房間協調。
- `scripts/data/locales.js` 承接 `roomLocale()`、武器/控制/忍術/規則/絕命模式等 localized label helpers。
- `scripts/systems/grid.js` 承接方向/面向 helper、`shuffledCellsInArea()`；不再提供或使用 DOM event helper。
- `scripts/systems/state-helpers.js` 承接 `gainSoul()`、`cancelDragIfPressed()`、`teamAliveCount()` 等狀態 helper。
- `scripts/systems/audio.js` 承接 `syncBgm()`、`startBgm()`、`applyVolumeControls()`、`playSound()`、`playBreakSound()`。
- `scripts/systems/appearance.js` 承接 `lookDefinitionByKey()`、`baseLookDefinitionForTeam()`、`unitLookDefinition()`、`unitEyeFrontSprite()`、`unitEyeSideSprite()`。
- `scripts/systems/ninjutsu.js` 承接 `activeMoneyDartCast(unit)`；錢鏢施放/命中規則不要回塞 `game.js`。
- `scripts/data/config.js` 承接移動殘影 timing：`ARRIVE_FRAME_MS`、`ARRIVE_TOTAL`、`PREARRIVE_FRAME_MS`、`PREARRIVE_TOTAL`。

### 2026-05-22 太刀達人 AI

- 新控制模式 key：`ai_tachi_master`，顯示名稱是「太刀達人」，固定武器是 `weapon3`（忍太刀）。
- `ai_tachi_master` 是偏保守 AI：低血優先 `kakki`，沒有鋼鐵時先上 `steel`，有鋼鐵後才進攻。
- 魂量以固定時間累積：`30` 秒到魂一、`60` 秒到魂二，之後每 `30` 秒再升一段，最多魂四。
- 對應測試在 `tests/ai.test.js`。

### 2026-05-21 赤組 AI 與分身外觀

- 控制模式 key：`ai_red`，顯示名稱是「赤組」，固定武器 `weapon8`，固定套用 `lookDefinitions.red`。
- 赤組 AI 有專用定時器、斜角受擊反擊、九宮格武器攻擊、直線延遲衝撞與低血追擊判定。
- 分身動畫與殘影外觀細節已移到 [`readme/ninjutsu.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/ninjutsu.md)。
- 對應測試在 `tests/ai.test.js`。

### 2026-05-21 趙活外觀

- 新外觀 key：`scripts/data/assets.js -> lookDefinitions.zhaohuo`，房間文案在 `scripts/data/locales.js -> zhaohuoLookOption`。
- 目前已接入 `assets/characters/ai/{idle,arrive,use_ninju,dart_shoot}/趙活_*`。
- `趙活_dart` 目前檔名還是 `1.png ~ 4.png`，方向未確認，所以 `moneyDartReadySet` 暫時回退到預設 `b`，不要自行猜方向。
- `趙活_prearrive` 目錄已存在，但這一輪未完成方向命名與引用；`moveSet` 暫時沿用預設 `blue` 的 prearrive，arrive 則使用 `趙活_arrive`。
- `趙活` 外觀不畫眼睛：`drawEyes: false`，`roomAvatarEyeSrc: null`。

### 2026-05-23 Vite / ES module 漸進導入

- Vite / ES module 遷移細節已拆到 [`readme/vite-skill.md`](C:/Users/lane6/Documents/Codex/忍豆風雲2單機版/readme/vite-skill.md)。
- 目前仍是過渡期：`index.html` 保留舊 classic `<script>` 載入順序，最後載入 `scripts/main.module.js` 做 module probe；遊戲流程尚未由 module entry 接管。
- 已完成 Vite skeleton、data module mirrors、部分 systems module mirrors、legacy `globalThis.Nindou*` bridges、同步測試與 browser probe。
- 目前 production build 會轉換 18 個 modules；所有 probe 應維持 `isSynced: true`。
- `啟動遊戲.cmd` 是目前雙擊啟動入口，會以自身所在資料夾為工作目錄，必要時先跑 `npm install`，再執行 `npm run dev`。
- 目前建議先停在 Vite 過渡骨架，不要繼續無目標拆 helper；若要做玩法內容，照既有 classic runtime 開發，並在碰到已 mirror 的區塊時同步補 module/probe/test。
- 若之後要正式推進 ES module 化，先選定 runtime 接管路線，再改呼叫點為 module import；不要直接全量改 `game.js`，也不要移除 classic scripts 或 bridge。
- 後續 Vite 相關變更請同步更新 `readme/vite-skill.md`，主 handoff 只保留此摘要。

---

## 20. 編碼與檔案寫入注意事項

- 中文可直接寫在 JS / HTML / Markdown，不要轉成 `\uXXXX`。
- Windows PowerShell 編輯含中文檔案時，優先使用不會破壞 UTF-8 的寫法。
- 這份 `readme/skill.md` 若再出現亂碼，先用 `Get-Content -Encoding UTF8` 重新確認，再 patch。

---

## 21. AI 工作規則

- Refer to local files and folders with clickable Markdown links, not plain paths.

### Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```
