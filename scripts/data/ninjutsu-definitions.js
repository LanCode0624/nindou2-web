const ninjuCatalog = [
  { type: "moneyDart", label: "錢鏢", enLabel: "Dart", group: "projectile", editorRow: "special", editorOrder: 1 },
  { type: "steel", label: "鋼鐵", enLabel: "Steel", group: "buff", editorRow: "support", editorOrder: 1 },
  { type: "hotBlood", label: "熱血", enLabel: "Rage", group: "buff", editorRow: "support", editorOrder: 2 },
  { type: "flash", label: "閃光", enLabel: "Flash", group: "attack", editorRow: "attack", editorOrder: 1 },
  { type: "wildfire", label: "野火", enLabel: "Wildfire", group: "attack", editorRow: "attack", editorOrder: 2 },
  { type: "death", label: "死神", enLabel: "Death", group: "attack", editorRow: "attack", editorOrder: 3 },
  { type: "freeze", label: "急凍", enLabel: "Freeze", group: "attack", editorRow: "attack", editorOrder: 4 },
  { type: "genki", label: "元氣", enLabel: "Genki", group: "heal", editorRow: "heal", editorOrder: 1 },
  { type: "kakki", label: "活氣", enLabel: "Kakki", group: "heal", editorRow: "heal", editorOrder: 2 },
  { type: "shinki", label: "神氣", enLabel: "Shinki", group: "heal", editorRow: "heal", editorOrder: 3 },
];
const ninjuByType = Object.fromEntries(ninjuCatalog.map((ninju) => [ninju.type, ninju]));
const ninjuEditorRowOrder = { heal: 1, support: 2, attack: 3, special: 4, transform: 5 };
const ninjuEditorCatalog = [...ninjuCatalog].sort((a, b) => (
  (ninjuEditorRowOrder[a.editorRow] || 99) - (ninjuEditorRowOrder[b.editorRow] || 99)
  || a.editorOrder - b.editorOrder
));
const defaultNinjuLoadout = ["moneyDart", "steel", "hotBlood", "genki", "kakki", "shinki"];
