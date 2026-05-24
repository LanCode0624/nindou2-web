import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const modulePath = path.join(repoRoot, "scripts", "data", "config.module.mjs");
const classicPath = path.join(repoRoot, "scripts", "data", "config.js");

const startMarker = "// NINDOU_CONFIG_BRIDGE_START";
const endMarker = "// NINDOU_CONFIG_BRIDGE_END";

function toLiteral(value) {
  return JSON.stringify(value, null, 2);
}

function buildBridgeBlock(configModule) {
  const profileLiteral = toLiteral(configModule.ninjutsuRuleProfiles);
  return `${startMarker}
// AUTO-GENERATED SECTION.
// Source: scripts/data/config.module.mjs
// Run: npm run sync:config-nindou
const ninjutsuRuleProfiles = ${profileLiteral};
const attackNinjuOutcomeTables = ${toLiteral(configModule.attackNinjuOutcomeTables)};
const moneyDartButtonRect = ${toLiteral(configModule.moneyDartButtonRect)};
const steelButtonRect = ${toLiteral(configModule.steelButtonRect)};
const hotBloodButtonRect = ${toLiteral(configModule.hotBloodButtonRect)};
const genkiButtonRect = ${toLiteral(configModule.genkiButtonRect)};
const kakkiButtonRect = ${toLiteral(configModule.kakkiButtonRect)};
const shinkiButtonRect = ${toLiteral(configModule.shinkiButtonRect)};
const itemSlotStartX = ${configModule.itemSlotStartX};
const itemSlotY = ${configModule.itemSlotY};
const itemSlotW = ${configModule.itemSlotW};
const itemSlotH = ${configModule.itemSlotH};
const itemSlotGap = ${configModule.itemSlotGap};
const defaultConsumableDisableMs = ${configModule.defaultConsumableDisableMs};
const defaultConsumableInvincibleMs = ${configModule.defaultConsumableInvincibleMs};
const sake4MoveSkillFreeMs = ${configModule.sake4MoveSkillFreeMs};
const mapItemDropChance = ${configModule.mapItemDropChance};
const mapItemDropTypes = ${toLiteral(configModule.mapItemDropTypes)};
const mapGoldDropTypes = ${toLiteral(configModule.mapGoldDropTypes)};
const mapConsumableDropTypes = ${toLiteral(configModule.mapConsumableDropTypes)};

globalThis.NindouConfig = {
  weaponCooldownMs,
  weaponDamage,
  objectHp,
  maxSkill,
  tachiMasterSkillMax,
  soulStepsPerLevel,
  soulMaxLevel,
  ninjuFollowupMoveAllowance,
  ninjutsuRuleProfiles,
};
${endMarker}`;
}

async function main() {
  const configModule = await import(pathToFileURL(modulePath).href);
  const source = await fs.readFile(classicPath, "utf8");
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Config bridge markers not found in scripts/data/config.js");
  }
  const before = source.slice(0, start);
  const after = source.slice(end + endMarker.length);
  const block = buildBridgeBlock(configModule);
  await fs.writeFile(classicPath, `${before}${block}${after}`, "utf8");
}

await main();
