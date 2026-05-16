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

忍術編輯介面規則：

- 玩家可自選 6 種忍術。
- 點上排忍術會卸下。
- 點下排忍術會裝到第一個空格。
- 「重來」會清空上排。
- 上排排序就是戰鬥畫面中忍術列的排序。
- 下排分類順序：
  - 回復系：元氣、活氣、神氣
  - 輔助系：鋼鐵、熱血
  - 攻擊系：閃光、野火、急凍
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

- `small_thunder`：閃光。
- `small_fire`：野火。
- `small_ice`：急凍。

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

---

## 11. 常見錯誤與避免事項

- 不要讓玩家拖曳被 AI 丟錢鏢取消。
- 不要讓 AI 播玩家專用的 `useNinju` 音效。
- 不要讓攻擊系忍術消耗技。
- 不要讓熱血影響衝撞或錢鏢。
- 不要複製攻擊系忍術流程，優先共用 `attackNinjuConfigs`。
- 不要用英文註解迴避中文亂碼問題，應該修正編碼或寫入方式。

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
