const ninjuCatalog = [
  { type: "moneyDart", label: "\u9322\u93e2", enLabel: "Dart", group: "projectile", editorRow: "special", editorOrder: 1 },
  { type: "steel", label: "\u92fc\u9435", enLabel: "Steel", group: "buff", editorRow: "support", editorOrder: 1 },
  { type: "hotBlood", label: "\u71b1\u8840", enLabel: "Rage", group: "buff", editorRow: "support", editorOrder: 2 },
  { type: "flash", label: "\u9583\u5149", enLabel: "Flash", group: "attack", editorRow: "attack", editorOrder: 1 },
  { type: "wildfire", label: "\u91ce\u706b", enLabel: "Wildfire", group: "attack", editorRow: "attack", editorOrder: 2 },
  { type: "death", label: "\u6b7b\u795e", enLabel: "Death", group: "attack", editorRow: "attack", editorOrder: 3 },
  { type: "freeze", label: "\u6025\u51cd", enLabel: "Freeze", group: "attack", editorRow: "attack", editorOrder: 4 },
  { type: "angel", label: "\u5929\u4f7f", enLabel: "Angel", group: "attack", editorRow: "attack", editorOrder: 5 },
  { type: "mouryo", label: "\u9b4d\u9b4e", enLabel: "Mouryo", group: "attack", editorRow: "attack", editorOrder: 6 },
  { type: "butsu", label: "\u4f5b", enLabel: "Butsu", group: "attack", editorRow: "attack", editorOrder: 7 },
  { type: "genki", label: "\u5143\u6c23", enLabel: "Genki", group: "heal", editorRow: "heal", editorOrder: 1 },
  { type: "kakki", label: "\u6d3b\u6c23", enLabel: "Kakki", group: "heal", editorRow: "heal", editorOrder: 2 },
  { type: "shinki", label: "\u795e\u6c23", enLabel: "Shinki", group: "heal", editorRow: "heal", editorOrder: 3 },
  { type: "seven", label: "\u4e03\u9053", enLabel: "Seven", group: "special", editorRow: "special", editorOrder: 2 },
  { type: "clone", label: "\u5206\u8eab", enLabel: "Clone", group: "special", editorRow: "special", editorOrder: 3 },
  { type: "fireToad", label: "\u706b\u86d9", enLabel: "Toad", group: "transform", editorRow: "transform", editorOrder: 1 },
];
const ninjuByType = Object.fromEntries(ninjuCatalog.map((ninju) => [ninju.type, ninju]));
const ninjuEditorRowOrder = { heal: 1, support: 2, attack: 3, special: 4, transform: 5 };
const ninjuEditorCatalog = [...ninjuCatalog].sort((a, b) => (
  (ninjuEditorRowOrder[a.editorRow] || 99) - (ninjuEditorRowOrder[b.editorRow] || 99)
  || a.editorOrder - b.editorOrder
));
const defaultNinjuLoadout = ["moneyDart", "steel", "hotBlood", "genki", "flash", "death"];
