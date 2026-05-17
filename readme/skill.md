# 忍豆風雲2單機版：專案說明與 AI 接手指南

這份文件合併了原本的 `skill.md` 與 `AGENTS.md`，同時保留目前專案的實際規則與工作方式。

---

## 1. 對話與程式碼風格

- 跟使用者對話一律使用繁體中文。
- 程式碼註解使用中文，避免只寫英文簡稱。
- 說明盡量簡潔，但數值、路徑、函式名稱要明確。
- 如果中文出現亂碼，應修正編碼或寫入方式，不要改成英文逃避問題。

---

## 2. Git Workflow 規範

- 每完成一組功能就提交一次 commit。
- 提交訊息要能涵蓋實際變更範圍，保持簡潔。
- 開始新功能前要建立並切換到新分支。
- 永遠不要直接推送到 `main` / `master`。
- 工作樹可能有使用者自己的未提交檔案，不要順手清掉。

---

## 3. 驗證規範

修改任何 JS 後至少要執行：

```powershell
node --check .\game.js
```

如有需要一起確認規則與戰鬥邏輯，再執行：

```powershell
npm test
```

若有視覺改動，優先直接打開 `index.html` 檢查畫面；若工具環境無法做實際瀏覽器驗證，要明講，不要假稱看過畫面。

---

## 4. 專案目前狀態

這是一個用 `HTML + Canvas + JavaScript` 製作的《忍豆風雲2》單機版原型。

目前已整理到可以持續修改、測試與擴充的狀態，重點包括：

- 房間畫面與戰鬥畫面可正常切換。
- 房間卡片可新增、刪除、設定 HP、控制模式、武器。
- 預設只有 `blue1` 和 `grey1` 啟用。
- `slot 1` 不能刪除。
- 玩家可在房間的「編輯」介面自選 6 種忍術。
- 戰鬥中可移動、攻擊、衝撞、施放忍術。
- 有 HP、技量、魂系統。
- 可切換不同 AI。
- 戰鬥結束會進入結算，再返回房間。
- 回房間後會保留開戰前的房間設定。
- 房間與戰鬥 HUD 已有中英切換。

---

## 5. 架構總覽

這是純瀏覽器 Canvas 遊戲，無框架、無模組系統。所有 JS 都用 `<script>` 依序載入，共享全域命名空間。

### 載入順序（index.html）

```text
scripts/data/config.js
scripts/data/weapons.js
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
scripts/data/config.js        -> 遊戲常數（grid、maxHp、maxSkill、倒數時間等）
scripts/data/weapons.js       -> weaponDefinitions、武器動畫時長工具
scripts/data/assets.js        -> 圖片、音效、動畫影格來源
scripts/data/rule-modes.js    -> 規則模式與各種查詢函式
scripts/systems/grid.js       -> 格子與座標換算
scripts/data/map.js           -> 地圖物件初始位置
scripts/systems/state-helpers.js -> 共用狀態工具
scripts/systems/ninjutsu.js   -> 忍術施放流程
scripts/systems/combat.js     -> 武器攻擊、命中、傷害
scripts/systems/movement.js   -> 移動與衝撞
scripts/systems/ai.js         -> AI 決策
scripts/systems/match.js      -> 勝負判定與結算
game.js                       -> DOM、主迴圈、繪圖、輸入、房間 UI
```

### 主迴圈（game.js `draw()`）

每幀大致順序：

1. `updateMatchState`
2. `updateCharging` / `updateNinju` / `updateAi` / `updateProjectiles`
3. 繪製 `backdrop -> board -> drag -> mapObjects -> moveTrails -> units -> ninjuEffects -> moneyDartShoot -> projectiles -> attacks -> gameHud -> ninjuBar`
4. 覆蓋層 `countdownOverlay -> resultOverlay`

### 遊戲流程

房間畫面 → `startBattleFromRoom()` → 戰鬥 → `checkVictory()` → `finishMatch()` → 結算 → `returnToRoomFromResult()`

---

## 6. 座標系

使用者說的座標是玩家座標，不是內部陣列座標。

- 玩家 `[1,1]` = 左下角第一格
- 往右是 `[2,1]`
- 往上是 `[1,2]`
- `internalCellCoord()` / `displayCellCoord()` 負責互轉
- `buildMapObjects()` 中：
  - `add()` 用玩家座標
  - `addInternal()` 用內部座標

---

## 7. 規則模式（Rule Mode）

房間左上角目前是下拉選單，不是 checkbox。

可選模式：

- `忍2原版` -> `original`
- `忍2修改` -> `modified`
- `忍3` -> `n3`

目前規則對應：

- `original` 使用原版規則
- `modified` 使用修改版規則
- `n3` 目前暫時沿用 `original`

所有傷害、冷卻、忍術效果查詢，應透過 `scripts/data/rule-modes.js`：

- `weaponDamageForMode()`
- `steelRule()`
- `hotBloodRule()`
- `healNinjuRule()`
- `moneyDartRule()`
- `flashRule()` / `wildfireRule()` / `deathRule()` / `freezeRule()`

不要直接跳過這層去硬讀 fallback 常數。

---

## 8. 房間畫面與忍術編輯

相關位置：

- `index.html`
- `style.css`
- `game.js`
- `game.js -> renderNinjuEditor()`

### 房間畫面規則

- 每張卡都能設定 `HP / 控制模式 / 武器`
- `slot 1` 不能刪
- 點「編輯」打開忍術配置介面
- 左上角規則模式使用下拉選單
- 右上角有 `ENG / 中文` 語系切換
- 房間文字按鈕共用 `style.css -> .room-text-button`

### 忍術編輯規則

- 玩家可自選 6 種忍術
- 點上排忍術會卸下
- 點下排忍術會裝到第一個空格
- 「重來」會清空上排
- 上排順序就是戰鬥畫面中的忍術列順序

### 忍術編輯分類順序

- 回復系：元氣、活氣、神氣
- 輔助系：鋼鐵、熱血
- 攻擊系：閃光、野火、死神、急凍
- 特殊系：錢鏢
- 變身系：預留

---

## 9. 戰鬥畫面規則

- 玩家主要用拖曳移動
- 攻擊、移動、忍術都受技量與狀態限制
- 戰鬥中長按 `R` 3 秒可直接中止回房間
- 結算畫面要等 2 秒後點滑鼠才回房間
- 返回房間後保留開戰前設定

---

## 10. 素材規則與命名

正式素材資料夾：

- `assets/characters`
- `assets/ninju`
- `assets/weapon`
- `assets/map`
- `assets/ui`
- `assets/sounds`

候選素材資料夾：

- `assets/_candidates`

素材命名慣例：

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

不要把 BGM 改回系統絕對路徑：

- 房間 BGM：`assets/sounds/bgm/lobby.mp3`
- 戰鬥 BGM：`assets/sounds/bgm/bgm.mp3`

---

## 11. 武器修改位置

相關位置：

- 武器列表：`scripts/data/weapons.js`
- 模式傷害：`scripts/data/rule-modes.js`
- 攻擊範圍：`scripts/systems/combat.js -> weaponAreaCells()`
- 武器音效：`scripts/systems/combat.js -> slashSoundKeyForWeapon()`
- 音效資產：`scripts/data/assets.js`
- attack 圖大小：`game.js -> attackScaleByWeapon`
- hand 圖大小：`game.js -> handScaleByWeapon`
- attack offset：`game.js -> drawKunaiAttackFrame()`
- hand offset：`game.js -> drawKunaiHandAttackFrame()`

常改欄位：

- 攻速：`cooldownMs`
- 基礎傷害：`damage`
- 模式傷害：`modeRuleProfiles`
- 範圍：`weaponAreaCells()`

### 目前已接入武器

| ID | 名稱 | area | 備註 |
| --- | --- | --- | --- |
| `weapon1` | 苦無 | `single` | 預設武器 |
| `weapon3` | 忍太刀 | `nodachi` | 使用既有 fallback 範圍 |
| `weapon4` | 伊賀密刀 | `line2` | modified 有覆蓋傷害 |
| `weapon6` | 鐵扇不知火 | `fan` | modified 有覆蓋傷害 |
| `weapon7` | 極冰鬼切丸 | `line2` | 已接 1 秒揮砍動畫 |
| `weapon8` | 伊賀溜溜球 | `ring8` | modified / original 有差異 |
| `weapon10` | 風魔手裏劍 | `line6` | 正前方 6 格 |
| `weapon44` | 滅魂之劍 | `NinjaS` | 前方橫列 3 格 |
| `weapon106` | 光劍 | `NinjaS` | 前方橫列 3 格 |

### 武器新增方式

- 在 `scripts/data/weapons.js` 的 `weaponDefinitions` 新增資料
- 在 `scripts/systems/combat.js -> weaponAreaCells()` 補對應 `area`
- 補齊 `assets/weapon/...` 動畫素材
- 補齊 `assets/sounds/weapon/<編號>.ogg`

### 武器動畫注意事項

`game.js` 的 `drawKunaiAttackFrame()` 與 `drawKunaiHandAttackFrame()` 內 offset 是人工校準值，除非使用者明確要求，否則不要改。

---

## 12. 魂系統

- 玩家移動會累積魂
- 攻擊命中、被攻擊、撞人、死亡也會加魂
- 魂最多 4 級
- 攻擊系忍術需要至少魂 1
- 攻擊系忍術目前只消耗魂，不消耗技

魂量規則：

- 魂 1 打 1 人
- 魂 2 打 2 人
- 魂 3 打 3 人
- 魂 4 打 4 人
- 使用後魂歸零

---

## 13. 忍術修改位置

相關位置：

- 忍術清單：`game.js -> ninjuCatalog`
- 預設忍術：`game.js -> defaultNinjuLoadout`
- 忍術按鈕：`game.js -> drawNinjuSlot()`
- 忍術規則：`scripts/data/rule-modes.js`
- 忍術常數：`scripts/data/config.js`
- 攻擊系忍術設定：`scripts/data/assets.js -> attackNinjuConfigs`
- 忍術流程：`scripts/systems/ninjutsu.js`
- 忍術編輯 UI：`style.css`

### 目前攻擊系忍術

- 閃光
- 野火
- 死神
- 急凍

### 攻擊系忍術規則

- 優先共用 `attackNinjuConfigs`
- 需要魂
- 只消耗魂，不消耗技
- 命中或失敗期間，目標無敵且無法行動

### 狀態 / 輔助忍術

- `Steel`
- `Rage`
- `Genki`
- `Kakki`
- `Shinki`
- `Dart`

### 特別注意

- `wildfire` 要用 `small_fire/F/`
- `death` 要維持獨立，不要覆蓋 `wildfire`
- `buffAuraType` 會決定最後顯示的 buff 外圈
- 錢鏢相關 offset 在 `game.js -> moneyDartVisualOffsets`

---

## 14. AI 修改位置

主要位置：

- `scripts/systems/ai.js`
- `scripts/systems/ai.js -> aiProfiles`

目前 AI 類型：

| ID | 名稱 | 行為 |
| --- | --- | --- |
| `ai_beginner` | 初心者 | 一般近戰 AI |
| `ai_god` | AI神人 | 反應快，會拿錢鏢 |
| `ai_money_dart_master` | 錢鏢神人 | 偏重找線丟錢鏢 |
| `ai_dart_only_master` | 尬鏢神人 | 幾乎只追著人丟錢鏢 |

錢鏢 AI 相關函式：

- `aiMoneyDartAimCell()`
- `aiCanStartMoneyDartAfterLineDelay()`
- `tryAiThrowMoneyDart()`
- `aiStepToMoneyDartLine()`

---

## 15. 高風險區

### 視覺 offset 常數

這些值通常是人工調好的，改前要先確認使用者真的要改：

- `eyeOffsets`
- `useNinjuSpriteOffset`
- `moveEffectOffsets`
- `moneyDartVisualOffsets`

### 不要做的事

- 不要讓攻擊系忍術消耗技
- 不要讓熱血影響衝撞或錢鏢
- 不要讓 AI 播玩家專用的 `useNinju`
- 不要把 `death` 直接覆蓋到 `wildfire`
- 不要把野火素材改回 `assets/ninju/status/small_fire/`
- 不要用英文註解逃避中文亂碼問題

---

## 16. 如果要改東西，先看哪裡

### 想改畫面

- `game.js`
- `style.css`
- `assets/`

### 想改房間或編輯介面

- `index.html`
- `style.css`
- `game.js`
- `game.js -> renderNinjuEditor()`

### 想改武器數值

- `scripts/data/weapons.js`
- `scripts/data/rule-modes.js`
- `scripts/systems/combat.js`

### 想改忍術數值

- `game.js -> ninjuCatalog`
- `scripts/data/config.js`
- `scripts/data/rule-modes.js`
- `scripts/systems/ninjutsu.js`
- `scripts/data/assets.js`

### 想改 AI

- `scripts/systems/ai.js`

### 想改素材或音效

- `assets/`
- `assets/sounds/`
- `scripts/data/assets.js`

---

## 17. 測試與 PowerShell 設定

### PowerShell npm.ps1

如果 PowerShell 擋住 `npm.ps1`，可用：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### package.json scripts

```json
{
  "scripts": {
    "check": "node --check game.js",
    "test": "node --test"
  }
}
```

### 目前測試重點

- `tests/helpers/script-loader.js`
- `tests/rule-modes.test.js`
- `tests/grid.test.js`
- `tests/combat.test.js`
- `tests/weapon-animation-timing.test.js`

已涵蓋：

- modified / original / n3 規則切換
- 座標與障礙
- 武器傷害與範圍
- 武器揮砍動畫時長是否等於 `cooldownMs`

---

## 18. 編碼注意事項

- 中文可直接寫在 JS / HTML / Markdown，不要轉成 `\uXXXX`
- Windows PowerShell 編輯含中文檔案時，優先使用不會破壞 UTF-8 的寫法
- 文件與註解都要能正常顯示中文
