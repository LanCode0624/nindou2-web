# 忍豆風雲2單機版：專案說明與 AI 接手指南

這是一個用 `HTML + Canvas + JavaScript` 製作的《忍豆風雲2》單機版原型。

目前目標不是做成完整商業版，而是先把戰鬥、房間、武器、忍術、AI 和素材整理到可以持續修改、測試與擴充的狀態。

---

## 1. 目前專案狀態

- 房間畫面和戰鬥畫面可以正常切換。
- 房間卡片可新增、刪除、設定 HP、控制模式、武器。
- 預設只有 `blue1` 和 `grey1` 啟用，其他卡片中間會顯示「新增」。
- `slot 1` 不能刪除。
- 玩家可以在「編輯」介面自選 6 種忍術帶進戰鬥。
- 角色可以拖曳移動、攻擊、衝撞。
- 有血量系統、技量系統、魂系統。
- 可以選不同 AI。
- 戰鬥結束會進入結算畫面，再回房間。
- 回房間後，會保留開戰前的房間設定。
- 地圖已放大到貼近畫面邊緣，畫面上的資訊列會蓋在地圖上。

---

## 2. 使用者偏好與開發注意事項

- 回覆素材位置時，請給實際 Windows 路徑。
- 不要再嘗試用圖片卡給資料夾路徑。
- UI、offset、數值調整，要給明確檔案、函式、變數。
- 使用者常自己微調數值，所以中文註解要寫清楚。
- 程式註解要保留中文。
- 如果中文出現亂碼，請修正檔案編碼或寫入方式，不要改成英文避開問題。
- 文件和程式註解都要能正常顯示中文。

---

## 3. 主要檔案入口

```text
index.html
style.css
game.js
scripts/data/config.js
scripts/data/weapons.js
scripts/data/rule-modes.js
scripts/data/assets.js
scripts/systems/movement.js
scripts/systems/combat.js
scripts/systems/ninjutsu.js
scripts/systems/ai.js
```

---

## 4. 房間畫面與忍術編輯

房間與忍術編輯相關位置：

- `index.html`
- `style.css`
- `game.js -> renderNinjuEditor()`

房間畫面規則：

- 每張卡都能設定：
  - HP
  - 控制模式
  - 武器
- 右上角 `X` 可以刪掉卡片，但 `slot 1` 不能刪。
- 點「編輯」可以打開忍術配置畫面，自選這場要帶的 6 個忍術。
- 房間上方有 `ENG` / `中文` 切換按鈕，目前先只切換按鈕文字；後續合併英文版時再接實際語系邏輯。
- 房間文字按鈕共用 `style.css -> .room-text-button` 外觀；單一按鈕 class 只保留位置與尺寸，例如 `.team-edit-btn`、`.room-lang-toggle-btn`。

忍術編輯介面規則：

- 玩家可自選 6 種忍術。
- 點上排忍術會卸下。
- 點下排忍術會裝到第一個空格。
- 「重來」會清空上排。
- 上排排序就是戰鬥畫面中忍術列的排序。
- 下排分類順序：
  - 回復系：元氣、活氣、神氣
  - 輔助系：鋼鐵、熱血
  - 攻擊系：閃光、野火、死神、急凍
  - 特殊系：錢鏢
  - 變身系：預留

---

## 5. 戰鬥畫面規則

- 玩家主要用拖曳來移動。
- 攻擊、移動、忍術都會受到技量或狀態限制。
- 戰鬥中長按 `R` 3 秒可以直接中止並回房間。
- 結算畫面要等 2 秒後點滑鼠才會回房間。
- 回房間後，會保留開戰前的房間設定。

---

## 6. 素材規則

正式素材資料夾：

- `assets/characters`
- `assets/ninju`
- `assets/weapon`
- `assets/map`
- `assets/ui`
- `assets/sounds`

候選素材資料夾：

- `assets/_candidates`

武器音效規則：

```text
weaponX -> assets/sounds/weapon/X.ogg
```

例如：

```text
weapon8 -> assets/sounds/weapon/8.ogg
```

注意：

- 有些忍術已經有圖和按鈕，但在某些模式下可能是停用狀態。
- 詳情參照 `武器、忍術.xlsx`。

---

## 7. 武器修改位置

武器資料與戰鬥相關位置：

- 武器列表：`scripts/data/weapons.js`
- 模式傷害：`scripts/data/rule-modes.js`
- 武器範圍：`scripts/systems/combat.js -> weaponAreaCells()`
- 武器音效選擇：`scripts/systems/combat.js -> slashSoundKeyForWeapon()`
- 音效資產：`scripts/data/assets.js -> slash`
- attack 圖大小：`game.js -> attackScaleByWeapon`
- hand 圖大小：`game.js -> handScaleByWeapon`
- attack offset：`game.js -> drawKunaiAttackFrame() -> offsetsByWeapon`
- hand offset：`game.js -> drawKunaiHandAttackFrame() -> offsetsByWeapon`

常改位置：

- 攻速：`scripts/data/weapons.js -> cooldownMs`
- 基礎傷害：`scripts/data/weapons.js -> damage`
- 模式傷害：`scripts/data/rule-modes.js -> modeRuleProfiles`
- 範圍：`scripts/systems/combat.js -> weaponAreaCells()`
- 音效：`scripts/data/assets.js -> slashX`

目前已接入武器：

| ID | 名稱 | area | 備註 |
| --- | --- | --- | --- |
| `weapon1` | 苦無 | `single` | 預設武器。 |
| `weapon3` | 忍太刀 | `nodachi` | 使用既有 fallback 範圍。 |
| `weapon4` | 伊賀密刀 | `line2` | modified 模式傷害另有覆蓋。 |
| `weapon6` | 鐵扇不知火 | `fan` | modified 模式傷害另有覆蓋。 |
| `weapon7` | 極冰鬼切丸 | `line2` | 從大力三搬入。 |
| `weapon8` | 伊賀溜溜球 | `ring8` | modified / original 模式傷害另有覆蓋。 |
| `weapon10` | 風魔手裏劍 | `line6` | 從大力三搬入，正前方 6 格。 |
| `weapon44` | 滅魂之劍 | `NinjaS` | 從大力三搬入，前方橫列 3 格。 |
| `weapon106` | 光劍 | `NinjaS` | 從大力三搬入，前方橫列 3 格。 |

新增武器時要檢查：

- 選單有沒有出現。
- `assets/weapon/<編號名稱>` 是否有：
  - `right_attack`
  - `right_hand`
  - `left_attack`
  - `left_hand`
  - `up_attack`
  - `up_hand`
  - `down_attack`
  - `down_hand`
- `assets/sounds/weapon/<編號>.ogg` 是否存在。
- `rule-modes.js` 是否需要模式傷害差異。

---

## 8. 魂系統

- 玩家移動會累積魂。
- 攻擊命中、被攻擊、撞人、死亡，也會依規則增加魂。
- 魂最多到 4 級。
- 攻擊系忍術需要至少魂 1 才能使用。
- 攻擊系忍術目前只消耗魂，不消耗技。

攻擊系忍術魂量規則：

- 魂 1 打 1 人。
- 魂 2 打 2 人。
- 魂 3 打 3 人。
- 魂 4 打 4 人。
- 使用後魂歸零。
- 目標命中或失敗期間都無法行動，且期間不受傷。

---

## 9. 忍術修改位置

忍術相關位置：

- 忍術清單：`game.js -> ninjuCatalog`
- 預設忍術：`game.js -> defaultNinjuLoadout`
- 忍術按鈕：`game.js -> drawNinjuSlot()`
- 忍術規則：`scripts/data/rule-modes.js`
- 忍術常數：`scripts/data/config.js`
- 攻擊系忍術設定：`scripts/data/assets.js -> attackNinjuConfigs`
- 忍術流程：`scripts/systems/ninjutsu.js`
- 忍術編輯 UI：`style.css`

目前攻擊系忍術：

- 閃光。
- 野火。
- 死神。
- 急凍。

攻擊系忍術素材重點：

- 野火：召喚素材必須使用 `assets/ninju/status/summon/small_fire/F/`，受擊素材必須使用 `assets/ninju/status/small_fire/F/`。
- 死神：召喚素材使用 `assets/ninju/status/summon/death/`，受擊素材使用 `assets/ninju/status/damaged/death/`。
- 不要讓野火改回 `small_fire` 根目錄；目前根目錄素材和死神會重疊。
- 死神是獨立忍術 `death`，不要覆蓋或改名 `wildfire`。

攻擊系忍術開發規則：

- 新增攻擊系忍術時，優先加到 `scripts/data/assets.js -> attackNinjuConfigs`。
- 共通規則是需要魂、魂幾打幾、使用後魂歸零。
- 攻擊系忍術只消耗魂，不消耗技。
- 命中或失敗期間，目標無敵且無法行動。
- 不要複製 `triggerAttackNinju()` 流程。

狀態 / 輔助忍術：

- 鋼鐵和熱血共用施放節奏。
- 鋼鐵只影響防禦。
- 熱血只影響武器傷害，不影響衝撞和錢鏢。
- `buffAuraType` 決定最後完成的 buff 外圈優先顯示。

錢鏢：

- 拿著錢鏢不能移動、攻擊、使用忍術。
- AI 可以拿鏢與丟鏢，但不播放玩家專用的 `useNinju`。
- 錢鏢相關 offset 在 `game.js -> moneyDartVisualOffsets`。

---

## 10. AI 修改位置

AI 主要位置：

- `scripts/systems/ai.js`
- `scripts/systems/ai.js -> aiProfiles`

目前 AI 類型：

| ID | 名稱 | 行為 |
| --- | --- | --- |
| `ai_beginner` | 初心者 | 一般近戰 AI。 |
| `ai_god` | AI神人 | 從大力三搬入，反應快、回技快、會積極拿錢鏢，profile 內保留 `hotBloodUseChance` / `wildfireUseChance`。 |
| `ai_money_dart_master` | 錢鏢神人 | 會積極找直線位置丟錢鏢，也會近戰和上鋼鐵。 |
| `ai_dart_only_master` | 尬鏢神人 | 幾乎只追著人丟錢鏢，不主動近戰，但卡住時會砍障礙物脫困。 |

AI 錢鏢相關函式：

- `aiMoneyDartAimCell()`
- `aiCanStartMoneyDartAfterLineDelay()`
- `tryAiThrowMoneyDart()`
- `aiStepToMoneyDartLine()`

AI 重要規則：

- 錢鏢 AI 要先走到直線位置。
- 錢鏢神人 / 尬鏢神人到直線後等 `300ms` 才能開始拿鏢。
- 錢鏢神人 / 尬鏢神人不能到線上立刻出手。
- 尬鏢神人不主動近戰、不撞人。
- 尬鏢神人被障礙物困住時，可以用武器砍障礙物脫困。
- 所有 AI 被困時要快速砍草 / 障礙物，不要長時間左右抖動。
- `ai_god` 目前照搬大力三的 profile；如果要讓它真的主動熱血或野火，需要再補 `tryAiNinjutsu()` 的使用邏輯。

---

## 11. 常見錯誤與避免事項

- 不要讓玩家拖曳被 AI 丟錢鏢取消。
- 不要讓 AI 播玩家專用的 `useNinju` 音效。
- 不要讓攻擊系忍術消耗技。
- 不要讓熱血影響衝撞或錢鏢。
- 不要複製攻擊系忍術流程，優先共用 `attackNinjuConfigs`。
- 不要把大力三的死神直接覆蓋到 `wildfire`；目前版本要保留野火，死神使用獨立 `death`。
- 不要讓野火素材走 `assets/ninju/status/small_fire/` 根目錄，應走 `small_fire/F/` 子資料夾。
- 不要用英文註解迴避中文亂碼問題，應該修正編碼或寫入方式。
- `style.css` 內不要保留亂碼註解；看不出原意時直接移除，避免之後 patch 對不上。

---

## 12. 如果要改東西，先看哪裡

### 想改畫面

- `game.js`
- `style.css`
- `assets/`

### 想改房間或編輯介面

- `index.html`
- `style.css`
- `game.js`
- `game.js -> renderNinjuEditor()`
- 語言按鈕入口：`index.html -> #roomLangToggleBtn`
- 語言按鈕事件：`game.js -> toggleRoomLangButtonLabel()`
- 房間文字按鈕外觀：`style.css -> .room-text-button`

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

## 13. 單元測試與 PowerShell 設定

### Git 狀態

- 已在專案根目錄建立 `.git`
- 開始新功能時要建立新分支，不要直接在 `main` / `master` 上實作。
- 初始提交：`f0d62a0 初始化專案並加入單元測試骨架`
- 不要直接推送到 `main` / `master`

### PowerShell npm.ps1 修正

PowerShell 原本會擋住 `npm.ps1`，原因是 execution policy 全部為 `Undefined`，導致 `.ps1` shim 不能執行。

已改用使用者層級設定修正：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

目前確認：

```powershell
Get-ExecutionPolicy -Scope CurrentUser
# RemoteSigned
```

修正後可直接執行：

```powershell
npm test
```

不需要再用 `npm.cmd test` 繞過。

### 測試指令

修改任何 JS 後至少執行：

```powershell
node --check .\game.js
npm test
```

目前 `package.json` 有：

```json
{
  "scripts": {
    "check": "node --check game.js",
    "test": "node --test"
  }
}
```

### 測試骨架

測試使用 Node 內建 `node:test`，不額外引入測試框架。

新增檔案：

- `tests/helpers/script-loader.js`
- `tests/rule-modes.test.js`
- `tests/grid.test.js`
- `tests/combat.test.js`

`tests/helpers/script-loader.js` 使用 Node `vm` 載入瀏覽器用的全域 script，模擬 `<script>` 標籤依序載入的環境。這樣第一版測試不需要把現有程式改成 module。

注意：`vm` context 回傳的物件原型不同，測試裡若要用 `deepEqual` 比對物件或陣列，先用 helper 的 `plain(value)` 轉成一般物件。

### 第一批測試範圍

目前單元測試共 12 個，涵蓋：

- `scripts/data/rule-modes.js`：modified / original 規則模式切換
- `scripts/systems/grid.js`：玩家座標與內部座標互轉、永久障礙、物件阻擋格
- `scripts/systems/combat.js`：武器傷害、熱血倍率、鋼鐵減傷、`line2`、`ring8`、`line6` 與 `NinjaS` 武器範圍

已驗證通過：

```powershell
node --check .\game.js
npm test
```

測試結果：12 pass / 0 fail。
