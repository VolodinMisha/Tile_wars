import test from 'node:test';
import assert from 'node:assert/strict';
import { areHexesAdjacent, getHexDistance, generateHexCoords } from './hex';
import {
  resolveCombat,
  validateMove,
  calculateReinforcements,
  distributeReinforcements,
  checkGameState,
  checkAndExecuteEmergencyTransfer,
  canReinforceCell,
  applyManualReinforcement,
  MAX_CELL_UNITS,
} from './rules';
import { getStaticCampaignMap, CAMPAIGN_LEVELS } from './campaign';
import { HexCell } from './types';

test('hex math: axial distance and adjacency calculate correctly', () => {
  const origin = { q: 0, r: 0 };
  const neighbor = { q: 1, r: -1 };
  const distant = { q: 2, r: 2 };

  assert.equal(getHexDistance(origin, neighbor), 1);
  assert.equal(areHexesAdjacent(origin, neighbor), true);
  assert.equal(getHexDistance(origin, distant), 4);
  assert.equal(areHexesAdjacent(origin, distant), false);
});

test('hex math: hex grid generation produces expected ring node counts', () => {
  assert.equal(generateHexCoords(2).length, 19); // S scale
  assert.equal(generateHexCoords(3).length, 37); // M scale
  assert.equal(generateHexCoords(4).length, 61); // L scale
});

test('combat: direct subtraction rule - 3 units attack 5 units reduces defender to 2 units', () => {
  // Attacker 3 units vs defender 5 units (A < E)
  // Direct subtraction: defender drops from 5 to 5 - 3 = 2 units!
  const result = resolveCombat(3, 5, false);
  assert.equal(result.success, false);
  assert.equal(result.captured, false);
  assert.equal(result.attackerUnitsRemaining, 1);
  assert.equal(result.defenderUnitsRemaining, 2); // 5 - 3 = 2!
  assert.equal(result.defenderLosses, 3);
});

test('combat: direct subtraction rule - 5 units attack 3 units captures cell with surviving 2 units', () => {
  // Attacker 5 units vs defender 3 units (A > E)
  // Direct subtraction: surviving units = 5 - 3 = 2 units occupy the target!
  const result = resolveCombat(5, 3, false);
  assert.equal(result.success, true);
  assert.equal(result.captured, true);
  assert.equal(result.attackerUnitsRemaining, 1); // 1 stays in origin
  assert.equal(result.defenderUnitsRemaining, 2); // 5 - 3 = 2
  assert.equal(result.defenderLosses, 3);
});

test('combat: 3 units vs 3 units reflects balanced 50/50 engagement', () => {
  // Deterministic seed >= 0.5 -> win
  const winResult = resolveCombat(3, 3, false, 0.7);
  assert.equal(winResult.success, true);
  assert.equal(winResult.captured, true);
  assert.equal(winResult.attackerUnitsRemaining, 1);
  assert.equal(winResult.defenderUnitsRemaining, 1);

  // Deterministic seed < 0.5 -> loss
  const lossResult = resolveCombat(3, 3, false, 0.3);
  assert.equal(lossResult.success, false);
  assert.equal(lossResult.captured, false);
  assert.equal(lossResult.attackerUnitsRemaining, 1);
  assert.equal(lossResult.defenderUnitsRemaining, 1);
});

test('combat: overclock gives attack boost to tip equal forces into guaranteed victory', () => {
  // Attacker 3 units vs defender 3 units with overclock:
  // 3 + bonus 2 = effective 5 vs 3 -> guaranteed victory!
  const ocResult = resolveCombat(3, 3, true);
  assert.equal(ocResult.success, true);
  assert.equal(ocResult.captured, true);
  assert.equal(ocResult.overclockUsed, true);
  assert.equal(ocResult.overclockBackfired, false);
  assert.equal(ocResult.defenderUnitsRemaining, 2); // (3 + 2) - 3 = 2
});

test('combat: overclock failure triggers critical burnout and unit drop to 1', () => {
  // Attacker 3 units vs defender 10 units (effective 5 vs 10 -> fails)
  const result = resolveCombat(3, 10, true);
  assert.equal(result.success, false);
  assert.equal(result.captured, false);
  assert.equal(result.overclockUsed, true);
  assert.equal(result.overclockBackfired, true);
  assert.equal(result.attackerUnitsRemaining, 1);
  assert.equal(result.defenderUnitsRemaining, 5); // 10 - (3 + 2) = 5
});

test('move validation: blocks friendly transfers, non-adjacent, unit <= 1, and storm-active targets', () => {
  const origin: HexCell = {
    id: '0_0',
    q: 0,
    r: 0,
    owner: 0,
    units: 5,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };

  const friendlyTarget: HexCell = {
    id: '0_1',
    q: 0,
    r: 1,
    owner: 0,
    units: 3,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };

  const stormTarget: HexCell = {
    id: '1_0',
    q: 1,
    r: 0,
    owner: 1,
    units: 2,
    stormActive: true,
    stormTurnsRemaining: 3,
    burnedOutTurns: 0,
    revealed: true,
  };

  const enemyTarget: HexCell = {
    id: '1_-1',
    q: 1,
    r: -1,
    owner: 1,
    units: 2,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };

  // Friendly cell move is blocked (friendly troop transfer removed)
  const friendlyCheck = validateMove(origin, friendlyTarget);
  assert.equal(friendlyCheck.valid, false);
  assert.equal(friendlyCheck.reason, 'friendly_cell');

  // Target has active storm
  const stormCheck = validateMove(origin, stormTarget);
  assert.equal(stormCheck.valid, false);
  assert.equal(stormCheck.reason, 'storm_blocked');

  // Valid enemy target
  const validCheck = validateMove(origin, enemyTarget);
  assert.equal(validCheck.valid, true);

  // Origin with 1 unit cannot attack
  origin.units = 1;
  const insufficientCheck = validateMove(origin, enemyTarget);
  assert.equal(insufficientCheck.valid, false);
  assert.equal(insufficientCheck.reason, 'insufficient_units');
});

test('reinforcements: distributes units up to MAX_CELL_UNITS and ignores burned-out cells', () => {
  const cellA: HexCell = {
    id: '0_0',
    q: 0,
    r: 0,
    owner: 0,
    units: 3,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };
  const cellB: HexCell = {
    id: '0_1',
    q: 0,
    r: 1,
    owner: 0,
    units: MAX_CELL_UNITS,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };
  const cellBurned: HexCell = {
    id: '1_0',
    q: 1,
    r: 0,
    owner: 0,
    units: 2,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 2,
    revealed: true,
  };

  distributeReinforcements([cellA, cellB, cellBurned], 0);
  assert.equal(cellA.units, 5); // +2 units (total pool of 3 minus 1 maxed out)
  assert.equal(cellB.units, MAX_CELL_UNITS); // Capped at max
  assert.equal(cellBurned.units, 2); // Burned out cell receives no reinforcements
});

test('game state: detects victory, defeat, and in_progress', () => {
  const cellHuman: HexCell = {
    id: '0_0',
    q: 0,
    r: 0,
    owner: 0,
    units: 5,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };
  const cellBot: HexCell = {
    id: '1_0',
    q: 1,
    r: 0,
    owner: 1,
    units: 3,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };

  assert.equal(checkGameState([cellHuman, cellBot], 0), 'in_progress');

  // Victory: only human cells remain
  cellBot.owner = 0;
  assert.equal(checkGameState([cellHuman, cellBot], 0), 'victory');

  // Defeat: only bot cells remain (both owned by bot 1)
  cellBot.owner = 1;
  cellHuman.owner = 1;
  assert.equal(checkGameState([cellHuman, cellBot], 0), 'defeat');
});

test('manual reinforcements: player can allocate points to owned non-burned cells up to cap', () => {
  const cell: HexCell = {
    id: '0_0',
    q: 0,
    r: 0,
    owner: 0,
    units: 5,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };

  // Valid reinforcement
  const canReinforce = canReinforceCell(cell, 0, 3);
  assert.equal(canReinforce.valid, true);

  const applied = applyManualReinforcement(cell, 0, 3);
  assert.equal(applied.success, true);
  assert.equal(applied.newPool, 2);
  assert.equal(cell.units, 6);

  // Block reinforcement if no pool
  const noPool = canReinforceCell(cell, 0, 0);
  assert.equal(noPool.valid, false);
  assert.equal(noPool.reason, 'no_pool');

  // Block reinforcement if cell is burned out
  cell.burnedOutTurns = 1;
  const burned = canReinforceCell(cell, 0, 2);
  assert.equal(burned.valid, false);
  assert.equal(burned.reason, 'burned_out');

  // Block reinforcement if not owner
  cell.burnedOutTurns = 0;
  const wrongOwner = canReinforceCell(cell, 1, 2);
  assert.equal(wrongOwner.valid, false);
  assert.equal(wrongOwner.reason, 'not_owner');
});

test('reinforcement system: pool points equal exact number of controlled cells', () => {
  assert.equal(calculateReinforcements(1), 1);
  assert.equal(calculateReinforcements(5), 5);
  assert.equal(calculateReinforcements(14), 14);
});

test('campaign: all 20 campaign missions feature static handcrafted maps and contextual briefings', () => {
  assert.equal(CAMPAIGN_LEVELS.length, 20);

  for (let lvl = 1; lvl <= 20; lvl++) {
    const map = getStaticCampaignMap(lvl);
    assert.ok(map.length >= 7, `Level ${lvl} must have at least 7 cells`);
    assert.ok(map.some(c => c.owner === 0), `Level ${lvl} must have player cells`);
    assert.ok(map.some(c => c.owner > 0), `Level ${lvl} must have enemy bot cells`);

    // Level 1 static verification
    if (lvl === 1) {
      assert.equal(map.length, 7);
      const player = map.find(c => c.q === 0 && c.r === -1);
      assert.ok(player && player.owner === 0 && player.units === 5);
      const enemy = map.find(c => c.q === 0 && c.r === 1);
      assert.ok(enemy && enemy.owner === 1 && enemy.units === 4);
    }

    // Briefing check
    const levelDef = CAMPAIGN_LEVELS.find(l => l.level === lvl)!;
    assert.ok(levelDef.briefingEn.length > 20, `Level ${lvl} EN briefing must be descriptive`);
    assert.ok(levelDef.briefingUa.length > 20, `Level ${lvl} UA briefing must be descriptive`);
  }
});
