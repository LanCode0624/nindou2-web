# 忍豆風雲2單機版：專案說明與接手指南

這份文件是這個 repo 的 canonical handoff。用途只有兩個：

- 快速對齊目前遊戲規則、檔案職責、常改入口。
- 避免之後功能繼續無限制堆進 `game.js`，或把已經抽出的資料層又塞回流程內。

---

## 1. 基本工作規範

- 與使用者對話預設使用繁體中文。
- 程式碼註解盡量用中文，避免為了躲亂碼直接改成英文。
- 說明要短，但路徑、函式、資料 key、參數名稱要寫明確。
- 如果文件或註解出現亂碼，優先修 UTF-8 讀寫方式，不要改寫成別的語言逃避問題。
- 這個 repo 的 handoff 以這份 `readme/skill.md` 為主；如果文件和 live code 不一致，以 live code 為準，再回來修文件。

---

## 2. Git 與操作習慣

- 功能做完一段就 commit，不要把很多無關變更混成一包。
- 新功能先開分支，不直接推 `main` / `master`。
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

如果有畫面或互動調整：

- 優先直接打開 `index.html` 看實際畫面。
- 如果這一輪無法做瀏覽器驗證，要明講「未做畫面驗證」，不要假稱看過。

---

## 4. 專案目前狀態

這是用 `HTML + Canvas + JavaScript` 做的《忍豆風雲2》單機版瀏覽器原型，沒有 bundler、沒有框架、沒有 ES module。所有腳本以 `<script>` 依序載入，直接共享全域狀態。

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
- 房間與戰鬥 HUD 都有中英切換。
- 已接入最小 consumable 系統，目前只有 `backup3`。

---

## 5. 載入順序與檔案職責

### `index.html` 腳本載入順序

```text
scripts/data/config.js
scripts/data/weapons.js
scripts/data/ninjutsu-definitions.js
scripts/data/locales.js
scripts/data/assets.js
scripts/data/rule-modes.js
scripts/systems/grid.js
scripts/data/map.js
scripts/systems/state-helpers.js
scripts/systems/ninjutsu.js
scripts/systems/combat.js
scripts/systems/movement.js
scripts/systems/ai.js
scripts/systems/match.js
game.js
```

### 各檔案職責

```text
scripts/data/config.js                 -> 共用常數、忍術數值、掉落設定、道具欄位置
scripts/data/weapons.js                -> weaponDefinitions、武器靜態資料、動畫時長工具
scripts/data/ninjutsu-definitions.js   -> ninjuCatalog、editor 分類排序、defaultNinjuLoadout
scripts/data/locales.js                -> 房間/HUD/武器/忍術文字與中英切換
scripts/data/assets.js                 -> 圖片、音效、動畫影格來源、attackNinjuConfigs
scripts/data/rule-modes.js             -> original / modified / n3 規則查詢入口
scripts/data/map.js                    -> 地圖物件初始資料
scripts/systems/grid.js                -> 格子、座標轉換
scripts/systems/state-helpers.js       -> 共用狀態工具
scripts/systems/ninjutsu.js            -> 忍術施放、chain、錢鏢、變身流程
scripts/systems/combat.js              -> 近戰攻擊、範圍、命中、傷害、物件破壞
scripts/systems/movement.js            -> 移動、消耗技量、衝撞
scripts/systems/ai.js                  -> AI profile 與決策流程
scripts/systems/match.js               -> 勝負判定、結算
game.js                                -> DOM、房間 UI、Canvas 繪製、輸入、主迴圈、HUD
```

### 新功能放置原則

- 資料先放 `scripts/data/*`，不要把表、數值、素材 key 散塞進 `game.js`。
- 行為先放 `scripts/systems/*`，不要把流程全部堆回 `game.js`。
- 只有直接碰 DOM、Canvas、輸入、房間 UI 協調、主迴圈時，才進 `game.js`。
- 同一份規則不要在多個檔案維護兩套；例如模式差異統一經過 `scripts/data/rule-modes.js`。

---

## 6. 主迴圈與遊戲流程

### `game.js -> draw()` 每幀大致順序

1. `updateMatchState`
2. `updateCharging` / `updateNinju` / `updateAi` / `updateProjectiles`
3. 繪製 `backdrop -> board -> drag -> mapObjects -> moveTrails -> units -> ninjuEffects -> moneyDartShoot -> projectiles -> attacks -> gameHud -> ninjuBar`
4. 覆蓋層 `countdownOverlay -> resultOverlay`

### 遊戲流程

房間畫面 -> `startBattleFromRoom()` -> 戰鬥 -> `checkVictory()` -> `finishMatch()` -> 結算 -> `returnToRoomFromResult()`

---

## 7. 座標系

- 玩家座標 `[1,1]` 是左下角第一格。
- 往右是 `[2,1]`。
- 往上是 `[1,2]`。
- `internalCellCoord()` / `displayCellCoord()` 負責玩家座標與內部座標互轉。
- 地圖、阻擋格、出生點、圖層與素材細節已拆到 `readme/maps.md`。

### 地圖系統

- 地圖選單：`index.html -> #roomMapSelect`
- 地圖定義：`scripts/data/config.js -> roomMapDefinitions`、`roomMapDefinitionEntries()`
- 固定出生點：`scripts/data/config.js -> startingDisplayCellsBySlot`
- 地圖素材：`scripts/data/assets.js -> imageSources`
- 地圖物件：`scripts/data/map.js -> mapObjectBuilders`、`buildMapObjects()`
- 座標/阻擋：`scripts/systems/grid.js -> currentRoomMapDefinition()`、`isPermanentObstacle()`
- 圖層順序：`game.js -> draw()`、`drawBackdrop()`、`drawMapMaskOverlay()`、`drawMapObjects()`
- `#roomMapSelect` 的選項會由 `roomMapDefinitions` 自動生成；新增地圖不要手改 HTML option。
- 新地圖若有物件配置，先在 `scripts/data/map.js` 新增 builder，再把 `roomMapDefinitions[*].objectLayout` 指到 `mapObjectBuilders` 的 key。

目前地圖：

- `極惡城之一` -> `evil-castle-1`，目前預設地圖。
- `鄉野之十` -> `country-10`，舊地圖，仍可從房間下拉選單切換。

---

## 8. 規則模式（Rule Mode）

房間左上角現在是下拉選單，不是 checkbox。

模式對應：

- `忍2原版` -> `original`
- `忍2修改` -> `modified`
- `忍3` -> `n3`

目前 live code 行為：

- `original` 走原版 profile。
- `modified` 走修改版 profile。
- `n3` 有獨立 profile 入口，目前數值複製 `original`。
- 忍術數值入口：`scripts/data/config.js -> ninjutsuRuleProfiles.n3`。
- 武器覆蓋入口：`scripts/data/rule-modes.js -> modeRuleProfiles.n3.weapons`。

模式查詢入口在 `scripts/data/rule-modes.js`，常用函式：

- `currentRuleModeKey()`
- `weaponDamageForMode()`
- `steelRule()`
- `hotBloodRule()`
- `healNinjuRule()`
- `specialNinjuRule()`
- `fireToadRule()`
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
- `slot 1` 不能刪。
- 左上角規則模式用下拉選單。
- 右上角可切換 `ENG / 中文`。
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

- 玩家可自選 6 種忍術。
- 點上排已裝忍術會卸下。
- 點下排可選忍術會裝到第一個空格。
- 「重來」會清空上排。
- 上排順序就是戰鬥中的忍術列順序。

忍術分類與排序資料：

- `scripts/data/ninjutsu-definitions.js -> ninjuCatalog`
- `scripts/data/ninjutsu-definitions.js -> ninjuEditorCatalog`
- `scripts/data/ninjutsu-definitions.js -> defaultNinjuLoadout`

目前 editor 分類順序：

- 回復系：`genki`、`kakki`、`shinki`
- 輔助系：`steel`、`hotBlood`
- 攻擊系：`flash`、`wildfire`、`death`、`freeze`、`angel`、`mouryo`、`butsu`
- 特殊系：`moneyDart`、`seven`、`clone`
- 變身系：`fireToad`

目前 editor 與上排已選忍術框圖規則：

- 攻擊系統一用 `assets/ninju/buttons/1.png`
- 輔助系統一用 `assets/ninju/buttons/2.png`
- 特殊系統一用 `assets/ninju/buttons/3.png`
- 回復系統一用 `assets/ninju/buttons/4.png`
- 變身系統一用 `assets/ninju/buttons/5.png`
- 上排 `ninju-slot-choice` 與下排 `ninju-option` 都跟著 `editorRow` 套同一套框，不要再只對個別忍術寫死

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

主要位置：

- 數值：`scripts/data/config.js -> ninjutsuRuleProfiles`
- 結果表：`scripts/data/config.js -> attackNinjuOutcomeTables`
- 定義：`scripts/data/ninjutsu-definitions.js -> ninjuCatalog`
- 素材/特效：`scripts/data/assets.js -> attackNinjuConfigs`
- 規則查詢：`scripts/data/rule-modes.js`
- 施放流程：`scripts/systems/ninjutsu.js`
- HUD 按鈕：`game.js -> drawNinjuSlot()`
- 編輯 UI：`style.css`

目前 live code 行為要點：

- `steel`、`hotBlood`、`genki`、`kakki`、`shinki` 走一般狀態/回復忍術流程。
- `moneyDart` 走獨立準備與投射流程，規則看 `moneyDartRule()`。
- 攻擊系忍術走 `attackNinjuConfigs` + `attackNinjuRule(type)`。
- `clone` 走 `triggerCloneNinju()`，會把施放者傳到一個非原位可走格，並建立兩個可穿越分身殘影。
- `clone` 施法動畫依施放者分流：赤組外觀用 `assets/characters/ai/clone/a1_clone/`，灰組用 `assets/characters/g_clone/`，其他藍方維持 `assets/characters/b_clone/`。
- `clone` 成功建立分身後 `1.5` 秒播放 `assets/sounds/ninja/clone.ogg`；所有角色使用分身都會播放。
- 分身殘影會顯示和本體相同的血條與名稱，並透過 `casterId` 即時同步本體目前的 `steel` / `hotBlood` 外觀。
- `fireToad` 走獨立變身流程，規則看 `fireToadRule()`。
- 攻擊系忍術目前會讀 `castDurationMs`、`hitChance`、`damage` 等資料，但施放門檻主要是魂，不是技量。
- `moneyDart` 與 `fireToad` 目前仍會檢查並扣除 `rule.cost`。
- `moneyDart` 在忍術施放中或 chain gap 排程時，只有第一次成功排入才扣 `rule.cost`；已經 queued 時重按不能再扣技。

目前攻擊系忍術：

- `flash`
- `wildfire`
- `death`
- `freeze`
- `angel`
- `mouryo`
- `butsu`

特別注意：

- `wildfire` 要用 `assets/ninju/status/small_fire/F/`。
- `death` 要維持獨立，不要覆蓋 `wildfire`。
- `buffAuraType` 會影響最後顯示的 buff 外圈。
- 錢鏢視覺偏移在 `game.js -> moneyDartVisualOffsets`。
- `cloneOpenCells()` 不要硬寫舊地圖邊界；它應掃全地圖，再交給 `isBlockedCell()` 排除各地圖自己的不可走範圍、封鎖格與物件。

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
- `ai_red` 與玩家同列/同行時：`15%` 分身，否則排入延遲衝撞；距離 `1/2/3...` 格分別延遲 `0.5/0.6/0.7...` 秒。
- `ai_red` 平常不太移動；只有在敵方血量低於 `30%` 時，才有 `50%` 機率追擊。
- `ai_dart_only_master` 不近戰、不撞人、不用武器，只追線丟錢鏢。
- AI 不應播放玩家專用的 `useNinju` 視覺/操作干擾。
- 不要讓錢鏢準備或投擲打斷玩家拖曳互動。

---

## 14. 道具系統（Consumables）

目前只接最小可用版本 `backup3`，來源是從 `C:\Users\lane6\Documents\Codex\eng` 挑出來的最小移植。

主要位置：

- 道具素材：`assets/ninju/consumables/`
- 道具圖示：`scripts/data/assets.js -> backup3Item`
- 掉落設定：`scripts/data/config.js -> mapItemDropChance`、`mapItemDropTypes`、`mapGoldDropTypes`
- 道具欄位置：`scripts/data/config.js -> itemSlotStartX`、`itemSlotY`、`itemSlotW`、`itemSlotH`、`itemSlotGap`
- 單位資料：`game.js -> makeUnit()` 內的 `items`、`itemSlots`、`gold`
- HUD：`game.js -> drawInventoryHud()`、`drawInventoryItemHud()`、`itemIconByType()`
- 點擊使用：`game.js -> pointerDown()`、`itemSlotRect(index)`、`useItemSlot(index)`
- 背包增減：`game.js -> addInventoryItem()`、`removeInventoryItem()`
- 掉落流程：`scripts/systems/combat.js -> damageObject()` 內呼叫 `maybeGrantMapItem(object, attacker)`

目前 `backup3` 行為：

- 可破壞物件被打壞後，依 `mapItemDropChance` 機率掉落。
- 使用後把目前玩家 `skill` 補到 `maxSkill`。
- 使用一次消耗 1 個 `backup3`。
- 火蛙變身中或變身狀態不能使用。

新增 consumable 至少要同步：

- `assets/ninju/consumables/<item>.png`
- `scripts/data/assets.js` 的圖示 key
- `game.js -> itemIconByType(type)`
- `game.js -> useItemSlot(index)` 分支
- 實際效果函式，例如 `useBackupItem()`

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

---

## 16. 高風險區與不要做的事

這些值通常是人工調好的，改之前先確認使用者真的要動：

- `eyeOffsets`
- `useNinjuSpriteOffset`
- `moveEffectOffsets`
- `moneyDartVisualOffsets`

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

- `scripts/data/config.js -> ninjutsuRuleProfiles`
- `scripts/data/config.js -> attackNinjuOutcomeTables`
- `scripts/data/rule-modes.js`
- `scripts/systems/ninjutsu.js`
- `scripts/data/assets.js`

想改忍術清單或 editor 排序：

- `scripts/data/ninjutsu-definitions.js`
- `style.css`
- `game.js -> renderNinjuEditor()`

想改 AI：

- `scripts/systems/ai.js`

想改道具：

- `scripts/data/config.js`
- `scripts/data/assets.js`
- `scripts/systems/combat.js`
- `game.js`

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
    "test": "node --test"
  }
}
```

目前測試重點：

- `tests/helpers/script-loader.js`
- `tests/rule-modes.test.js`
- `tests/grid.test.js`
- `tests/combat.test.js`
- `tests/ninjutsu.test.js`
- `tests/ai.test.js`
- `tests/assets.test.js`
- `tests/weapon-animation-timing.test.js`

目前已覆蓋：

- `modified / original / n3` 規則切換
- 座標與障礙
- 武器傷害與範圍
- 攻擊忍術魂量門檻、攻擊忍術消耗魂、分身施放、分身血條/名稱/外觀資料、地圖可走格候選、死亡清理、錢鏢重複排程不重複扣技
- `scripts/data/assets.js` 靜態素材、BGM、音效、武器動畫影格、地圖圖片 key、外觀 sprite/frame set、`index.html` 與 `style.css` 直接引用路徑是否存在
- 武器揮砍動畫時長是否等於 `cooldownMs`
- `赤組` 的無技施法、斜角反擊、九宮格武器攻擊、直線延遲衝撞

---

## 19. 近期已確認的結構狀態

### 2026-05-18 忍術資料層整理

- 忍術主要數值集中在 `scripts/data/config.js -> ninjutsuRuleProfiles`。
- 攻擊系忍術結果表集中在 `scripts/data/config.js -> attackNinjuOutcomeTables`。
- `scripts/data/assets.js -> attackNinjuConfigs` 主要管素材、音效、特效對應，不是第一優先的數值入口。
- `scripts/data/rule-modes.js` 主要負責依模式回傳對應規則，不應再把數值拆散回流程檔。

### 2026-05-18 忍術 UI 外觀規則

- 新增忍術時，除了資料與流程，還要同步改 `style.css` 的 editor 外觀。
- 攻擊系忍術用紅框按鈕。
- 特殊系忍術用藍框按鈕。
- 回復系與輔助系沿用既有樣式。
- `fireToad` 屬於 `transform` 列，選單位置可用 `style.css` 內對應變數微調。

### 2026-05-18 道具系統

- 目前只維護最小可用的 `backup3`。
- 如果之後再從別的 repo 移植 consumable，原則是保留目前 base，只搬必要功能切片，不要整包同步。

### 2026-05-21 極惡城地圖

- 詳細地圖、素材、阻擋格與出生點紀錄已移到 `readme/maps.md`。
- 極惡城地圖規則有測試覆蓋在 `tests/grid.test.js`；改座標、阻擋、物件佔格後至少跑 `node --test .\tests\grid.test.js` 和 `npm test`。

### 2026-05-21 忍術行為修正

- `scripts/systems/ninjutsu.js -> useMoneyDart()` 已避免重複排程錢鏢時重複扣技；排程前若 `pendingMoneyDart` 或 `nextType === "moneyDart"` 已存在，直接回報 already queued。
- `scripts/systems/ninjutsu.js -> cloneOpenCells()` 已改成掃全地圖後交給 `isBlockedCell()` 判斷，避免 `極惡城之一` 這類自訂 `playableInternalYMax` 的地圖漏掉合法底排。
- 對應測試在 `tests/ninjutsu.test.js`；完整 `npm test` 目前是 41 個測試。

### 2026-05-21 赤組 AI 與分身外觀

- 新控制模式 key：`ai_red`，房間控制選單與 `scripts/data/locales.js -> roomControlModeLabels` 已接線。
- `ai_red` 的顯示名稱是「赤組」，不是「AI赤組」。
- `game.js -> selectedWeaponKey()` 會把 `ai_red` 固定成 `weapon8`，`makeUnit()` 會讓赤組預設面向朝下。
- `game.js -> selectedLookKey()`、`unitLookDefinition()`、`updateRoomLookCard()` 會讓 `ai_red` 固定套用 `lookDefinitions.red`，赤組外觀優先於藍/灰隊預設外觀。
- `scripts/systems/ai.js` 內新增赤組專用定時器、斜角受擊反擊、九宮格武器攻擊、直線延遲衝撞與低血追擊判定。
- `scripts/systems/combat.js -> damageUnit()` 會在斜角命中時呼叫 `queueAiRedRetaliation()`。
- `game.js -> ninjuCastFrames("clone", unit)` 會讓赤組分身動畫優先於灰組判定，避免灰隊赤組誤用灰組分身動畫。
- `scripts/systems/ninjutsu.js -> makeCloneDecoy()` 會複製本體名稱、血量、控制模式、外觀與 buff 欄位；`game.js -> cloneDecoyVisualState()` 會在繪製時用 `casterId` 追本體最新的鋼鐵/熱血狀態。
- `scripts/data/assets.js -> soundSources.cloneNinju` 對應 `assets/sounds/ninja/clone.ogg`，`triggerCloneNinju()` 成功後延遲 `1500ms` 播放。
- 對應測試在 `tests/ai.test.js`。

### 2026-05-21 趙活外觀

- 新外觀 key：`scripts/data/assets.js -> lookDefinitions.zhaohuo`，房間文案在 `scripts/data/locales.js -> zhaohuoLookOption`。
- 目前已接入 `assets/characters/ai/{idle,arrive,use_ninju,dart_shoot}/趙活_*`。
- `趙活_dart` 目前檔名還是 `1.png ~ 4.png`，方向未確認，所以 `moneyDartReadySet` 暫時回退到預設 `b`，不要自行猜方向。
- `趙活_prearrive` 目錄已存在，但這一輪未完成方向命名與引用；`moveSet` 暫時沿用預設 `blue` 的 prearrive，arrive 則使用 `趙活_arrive`。
- `趙活` 外觀不畫眼睛：`drawEyes: false`，`roomAvatarEyeSrc: null`。

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
