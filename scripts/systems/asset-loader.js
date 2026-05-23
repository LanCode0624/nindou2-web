// ===== Asset Loading =====
// 載入所有遊戲圖片與動畫影格。
function loadImages() {
  const frameGroups = [
    [defUpFrameSources, defUpFrames],
    [atkUpFrameSources, atkUpFrames],
    [regenHpSmallFrameSources, regenHpSmallFrames],
    [regenHpLargeFrameSources, regenHpLargeFrames],
    [consumableRegenSpFrameSources, consumableRegenSpFrames],
    [smallThunderSummonFrameSources, smallThunderSummonFrames],
    [smallThunderDamagedFrameSources, smallThunderDamagedFrames],
    [smallFireSummonFrameSources, smallFireSummonFrames],
    [smallFireDamagedFrameSources, smallFireDamagedFrames],
    [deathSummonFrameSources, deathSummonFrames],
    [deathDamagedFrameSources, deathDamagedFrames],
    [smallIceSummonFrameSources, smallIceSummonFrames],
    [smallIceDamagedFrameSources, smallIceDamagedFrames],
    [smallIceBreakFrameSources, smallIceBreakFrames],
    [damageFailFrameSources, damageFailFrames],
    [faintedFrameSources, faintedFrames],
    [damageSuccessSmallFrameSources, damageSuccessSmallFrames],
    [damageSuccessMiddleFrameSources, damageSuccessMiddleFrames],
    [damageSuccessBigFrameSources, damageSuccessBigFrames],
    [damageSuccessNinjuSuccessFrameSources, damageSuccessNinjuSuccessFrames],
    [sevenNinjuFrameSources, sevenNinjuFrames],
    [cloneNinjuFrameSources, cloneNinjuFrames],
    [cloneRedNinjuFrameSources, cloneRedNinjuFrames],
    [cloneGreyNinjuFrameSources, cloneGreyNinjuFrames],
    [angelNinjuFrameSources, angelNinjuFrames],
    [mouryoNinjuFrameSources, mouryoNinjuFrames],
    [mouryoNinjuHitFrameSources, mouryoNinjuHitFrames],
    [moneyDartPickupFrameSources, moneyDartPickupFrames],
    [respawnPointerFrameSources, respawnPointerFrames],
    [chargeRedFrameSources, chargeRedFrames],
    [chargeYellowFrameSources, chargeYellowFrames],
  ];

  return Promise.all([
    ...loadStaticImages(),
    ...loadFrameGroups(frameGroups),
    ...loadKeyedFrameGroups(moneyDartReadyFrameSources, moneyDartReadyFrames),
    ...loadKeyedFrameGroups(dragArrowFrameSources, dragArrowFrames),
    ...loadKeyedFrameGroups(useNinjuFrameSources, useNinjuFrames),
    ...loadNestedFrameGroups(movePrearriveFrameSources, movePrearriveFrames),
    ...loadNestedFrameGroups(moveArriveFrameSources, moveArriveFrames),
    ...loadNestedFrameGroups(moneyDartShootFrameSources, moneyDartShootFrames),
    ...loadWeaponFrames(),
  ]);
}

function loadStaticImages() {
  return Object.entries(imageSources).map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      resolve();
    };
    img.onerror = resolve;
    img.src = src;
  }));
}

function loadFrameGroups(groups) {
  return groups.flatMap(([sources, target]) => loadFrameGroup(sources, target));
}

function loadFrameGroup(sources, target) {
  return sources.map((src, index) => loadFrame(src, target, index));
}

function loadKeyedFrameGroups(sourceGroups, targetGroups) {
  return Object.entries(sourceGroups).flatMap(([key, sources]) => (
    loadFrameGroup(sources, targetGroups[key])
  ));
}

function loadNestedFrameGroups(sourceGroups, targetGroups) {
  return Object.entries(sourceGroups).flatMap(([groupKey, directions]) => (
    Object.entries(directions).flatMap(([direction, sources]) => (
      loadFrameGroup(sources, targetGroups[groupKey][direction])
    ))
  ));
}

function loadWeaponFrames() {
  return weaponDefinitions.flatMap((weapon) => (
    ["right", "left", "up", "down"].flatMap((direction) => (
      ["hand", "attack"].flatMap((kind) => (
        Array.from({ length: weapon.frameCount }, (_, index) => {
          const src = weaponFrameSource(weapon, direction, kind, index);
          return loadFrame(src, weaponFrames[weapon.key][kind][direction], index);
        })
      ))
    ))
  ));
}

// 載入單張動畫影格，成功後放到指定陣列位置。
function loadFrame(src, target, index) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      target[index] = img;
      resolve();
    };
    img.onerror = resolve;
    img.src = src;
  });
}

globalThis.NindouAssetLoader = {
  loadImages,
  loadStaticImages,
  loadFrameGroups,
  loadFrameGroup,
  loadKeyedFrameGroups,
  loadNestedFrameGroups,
  loadWeaponFrames,
  loadFrame,
};
