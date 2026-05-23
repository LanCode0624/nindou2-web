// ===== Appearance =====
function lookDefinitionByKey(key) {
  return lookDefinitions[key] || lookDefinitions.default;
}

function baseLookDefinitionForTeam(team) {
  return baseTeamLookDefinitions[team] || baseTeamLookDefinitions.blue || lookDefinitions.default;
}

function unitLookDefinition(unit) {
  if (!unit) return baseLookDefinitionForTeam("blue");
  if (unit.controlMode === "ai_red" || unit.appearanceKey === "red") return lookDefinitionByKey("red");
  if (unit.team !== "blue") return baseLookDefinitionForTeam(unit.team);
  return lookDefinitionByKey(unit.appearanceKey || "default");
}

function unitEyeFrontSprite(unit) {
  const look = unitLookDefinition(unit);
  return images[look.eyeFrontImageKey] || images.eyesFront;
}

function unitEyeSideSprite(unit) {
  const look = unitLookDefinition(unit);
  return images[look.eyeSideImageKey] || images.eyeSide || images.eyesFront;
}

globalThis.NindouAppearance = {
  lookDefinitionByKey,
  baseLookDefinitionForTeam,
  unitLookDefinition,
  unitEyeFrontSprite,
  unitEyeSideSprite,
};
