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

test('combat: standard attack with overwhelming force succeeds and captures cell', () => {
  // Attacker 8 units vs defender 2 units
  const result = resolveCombat(8, 2, false, 0); // deterministic 0 variance
  assert.equal(result.success, true);
  assert.equal(result.captured, true);
  assert.equal(result.attackerUnitsRemaining, 1);
  assert.ok(result.defenderUnitsRemaining >= 1);
  assert.equal(result.overclockUsed, false);
  assert.equal(result.overclockBackfired, false);
});

test('combat: underpowered attack fails and retains defender control', () => {
  // Attacker 2 units vs defender 8 units
  const result = resolveCombat(2, 8, false, 0);
  assert.equal(result.success, false);
  assert.equal(result.captured, false);
  assert.equal(result.attackerUnitsRemaining, 1);
  assert.ok(result.defenderUnitsRemaining > 0);
});

test('combat: overclock gives attack boost to tip close battle into victory', () => {
  // Attacker 6 units vs defender 6 units.
  // Without overclock: committed = 5, defender = 6 -> fails.
  const normalResult = resolveCombat(6, 6, false, 0);
  assert.equal(normalResult.success, false);

  // With overclock: committed = 5 + bonus 2 = 7 -> wins!
  const ocResult = resolveCombat(6, 6, true, 0);
  assert.equal(ocResult.success, true);
  assert.equal(ocResult.overclockUsed, true);
  assert.equal(ocResult.overclockBackfired, false);
});

test('combat: overclock failure triggers critical burnout and unit drop to 1', () => {
  // Attacker 3 units vs defender 10 units (hopeless even with OC)
  const result = resolveCombat(3, 10, true, 0);
  assert.equal(result.success, false);
  assert.equal(result.captured, false);
  assert.equal(result.overclockUsed, true);
  assert.equal(result.overclockBackfired, true);
  assert.equal(result.attackerUnitsRemaining, 1);
});

test('move validation: blocks non-adjacent, unit <= 1, and storm-active targets', () => {
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

  const validTarget: HexCell = {
    id: '0_1',
    q: 0,
    r: 1,
    owner: 1,
    units: 2,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };

  // Target has active storm
  const stormCheck = validateMove(origin, stormTarget);
  assert.equal(stormCheck.valid, false);
  assert.equal(stormCheck.reason, 'storm_blocked');

  // Valid target
  const validCheck = validateMove(origin, validTarget);
  assert.equal(validCheck.valid, true);

  // Origin with 1 unit cannot attack
  origin.units = 1;
  const insufficientCheck = validateMove(origin, validTarget);
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
    id: '1_0',
    q: 1,
    r: 0,
    owner: 0,
    units: MAX_CELL_UNITS,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: true,
  };

  const burnedOutCell: HexCell = {
    id: '0_1',
    q: 0,
    r: 1,
    owner: 0,
    units: 2,
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 2,
    revealed: true,
  };

  const cells = [cellA, cellB, burnedOutCell];
  const bonus = distributeReinforcements(cells, 0);

  assert.ok(bonus >= 2);
  assert.ok(cellA.units > 3);
  assert.equal(cellB.units, MAX_CELL_UNITS); // Capped
  assert.equal(burnedOutCell.units, 2); // Burned out cell receives no reinforcement
});

test('game state: detects victory, defeat, and in_progress', () => {
  const cells: HexCell[] = [
    {
      id: '0_0',
      q: 0,
      r: 0,
      owner: 0,
      units: 4,
      stormActive: false,
      stormTurnsRemaining: 0,
      burnedOutTurns: 0,
      revealed: true,
    },
    {
      id: '1_0',
      q: 1,
      r: 0,
      owner: 1,
      units: 3,
      stormActive: false,
      stormTurnsRemaining: 0,
      burnedOutTurns: 0,
      revealed: true,
    },
  ];

  assert.equal(checkGameState(cells, 0), 'in_progress');

  // Human eliminated
  cells[0].owner = 1;
  assert.equal(checkGameState(cells, 0), 'defeat');

  // Human takes all
  cells[0].owner = 0;
  cells[1].owner = 0;
  assert.equal(checkGameState(cells, 0), 'victory');
});

test('alliances: emergency transfer triggers when faction units fall below 10%', () => {
  const cells: HexCell[] = [
    {
      id: '0_0',
      q: 0,
      r: 0,
      owner: 0,
      units: 25,
      stormActive: false,
      stormTurnsRemaining: 0,
      burnedOutTurns: 0,
      revealed: true,
    },
    {
      id: '1_0',
      q: 1,
      r: 0,
      owner: 0,
      units: 25,
      stormActive: false,
      stormTurnsRemaining: 0,
      burnedOutTurns: 0,
      revealed: true,
    },
    {
      id: '0_1',
      q: 0,
      r: 1,
      owner: 1, // Bot 1 has only 1 unit out of 51 total (< 10%)
      units: 1,
      stormActive: false,
      stormTurnsRemaining: 0,
      burnedOutTurns: 0,
      revealed: true,
    },
  ];

  const result = checkAndExecuteEmergencyTransfer(cells, true);
  assert.equal(result.transferred, true);
  assert.equal(result.fromOwner, 1);
  assert.equal(result.toOwner, 0);
  assert.equal(cells[2].owner, 0); // Cell transferred!
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

test('campaign: 20 progressive campaign missions are configured', async () => {
  const { CAMPAIGN_LEVELS } = await import('./campaign');
  assert.equal(CAMPAIGN_LEVELS.length, 20);
  assert.equal(CAMPAIGN_LEVELS[0].level, 1);
  assert.equal(CAMPAIGN_LEVELS[19].level, 20);
});
