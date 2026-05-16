// 武器資料集中在這裡；新增武器時要同步確認 assets/weapon 和 assets/sounds/weapon。
const defaultWeaponKey = "weapon1";
const weaponDefinitions = [
  { key: "weapon1", label: "苦無", folder: "1苦無", frameCount: 12, cooldownMs: 500, area: "single", damage: 50 },
  { key: "weapon3", label: "忍太刀", folder: "3忍太刀", frameCount: 24, cooldownMs: 1000, area: "nodachi", damage: 50 },
  { key: "weapon4", label: "伊賀密刀", folder: "4伊賀密刀", frameCount: 13, cooldownMs: 500, area: "line2", damage: 50 },
  { key: "weapon6", label: "鐵扇不知火", folder: "6鐵扇不知火", frameCount: 9, cooldownMs: 300, area: "fan", damage: 25 },
  { key: "weapon7", label: "極冰鬼切丸", folder: "7極冰鬼切丸", frameCount: 22, cooldownMs: 1060, area: "line2", damage: 100 },
  { key: "weapon8", label: "伊賀溜溜球", folder: "8伊賀溜溜球", frameCount: 13, cooldownMs: 500, area: "ring8", damage: 20 },
  { key: "weapon10", label: "風魔手裏劍", folder: "10風魔手裏劍", frameCount: 13, cooldownMs: 500, area: "line6", damage: 30 },
  { key: "weapon44", label: "滅魂之劍", folder: "44滅魂之劍", frameCount: 6, cooldownMs: 260, area: "NinjaS", damage: 25 },
  { key: "weapon106", label: "光劍", folder: "106光劍", frameCount: 8, cooldownMs: 330, area: "NinjaS", damage: 30 },
];
const weaponDefinitionByKey = Object.fromEntries(weaponDefinitions.map((weapon) => [weapon.key, weapon]));
const weaponFrames = Object.fromEntries(weaponDefinitions.map((weapon) => [
  weapon.key,
  {
    hand: { right: [], left: [], up: [], down: [] },
    attack: { right: [], left: [], up: [], down: [] },
  },
]));
