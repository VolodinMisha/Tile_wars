import { HexCell, CombatResult, CellOwner, HexCoord } from './types';
import { areHexesAdjacent, getNeighbors } from './hex';

export const MAX_CELL_UNITS = 12;
export const BURNOUT_PENALTY_TURNS = 2;
export const STORM_DURATION_TURNS = 3;

/**
 * Resolves combat using direct subtraction combat rules between attacker and defender.
 * Direct subtraction:
 * - When A attacks E:
 *   - A > E: Attacker wins! Defender eliminated (-E). Surviving units (A - E) occupy target. Origin retains 1.
 *   - A < E: Attacker repulsed! Defender drops directly to (E - A). Origin retains 1.
 *   - A == E: Balanced 50/50 engagement.
 * - Overclock: grants +ATK bonus (+2 or +35%). If attack fails with overclock, backfires with burnout cooldown.
 */
export function resolveCombat(
  attackerUnits: number,
  defenderUnits: number,
  overclock: boolean,
  deterministicSeed?: number
): CombatResult {
  const committedUnits = attackerUnits;

  // Attack power calculation
  let effectiveAttackPower = committedUnits;
  let overclockBonus = 0;
  if (overclock) {
    overclockBonus = Math.max(2, Math.round(committedUnits * 0.35));
    effectiveAttackPower += overclockBonus;
  }

  let success = false;
  let overclockBackfired = false;

  if (effectiveAttackPower > defenderUnits) {
    success = true;
  } else if (effectiveAttackPower < defenderUnits) {
    success = false;
    if (overclock) {
      overclockBackfired = true;
    }
  } else {
    // Exactly equal forces (e.g. 3 vs 3): balanced 50/50 engagement
    const roll = deterministicSeed !== undefined ? deterministicSeed : Math.random();
    success = roll >= 0.5;
    if (!success && overclock) {
      overclockBackfired = true;
    }
  }

  if (success) {
    // Attacker captures target! Defender is eliminated.
    const defenderLosses = defenderUnits;
    // Direct subtraction: surviving units occupy target (minimum 1, capped at MAX_CELL_UNITS)
    const survivingUnits = Math.min(MAX_CELL_UNITS, Math.max(1, effectiveAttackPower - defenderUnits));
    const attackerLosses = Math.min(attackerUnits - 1, defenderUnits);

    return {
      success: true,
      attackerUnitsRemaining: 1, // 1 minimal garrison remains in origin
      defenderUnitsRemaining: survivingUnits, // surviving units occupy target
      overclockUsed: overclock,
      overclockBackfired: false,
      attackerLosses,
      defenderLosses,
      captured: true,
    };
  } else {
    // Defender holds!
    // Direct subtraction: attacker committed forces subtract directly from defender
    // e.g., 3 units attacking 5 units -> defender drops to 2 units (5 - 3 = 2)
    const defenderUnitsRemaining = Math.max(1, defenderUnits - effectiveAttackPower);
    const defenderLosses = defenderUnits - defenderUnitsRemaining;
    const attackerLosses = attackerUnits - 1;

    return {
      success: false,
      attackerUnitsRemaining: 1, // origin cell depleted to 1 minimal garrison
      defenderUnitsRemaining,
      overclockUsed: overclock,
      overclockBackfired,
      attackerLosses,
      defenderLosses,
      captured: false,
    };
  }
}

/**
 * Validates whether an attack order is legal. Friendly cell transfers are strictly forbidden.
 */
export function validateMove(
  origin: HexCell,
  target: HexCell
): { valid: boolean; reason?: 'not_adjacent' | 'insufficient_units' | 'storm_blocked' | 'same_cell' | 'friendly_cell' } {
  if (origin.id === target.id) {
    return { valid: false, reason: 'same_cell' };
  }
  if (!areHexesAdjacent(origin, target)) {
    return { valid: false, reason: 'not_adjacent' };
  }
  if (origin.owner === target.owner) {
    return { valid: false, reason: 'friendly_cell' };
  }
  if (origin.units <= 1) {
    return { valid: false, reason: 'insufficient_units' };
  }
  if (target.stormActive) {
    return { valid: false, reason: 'storm_blocked' };
  }
  return { valid: true };
}

/**
 * Updates Fog of War visibility
 */
export function updateFogOfWar(cells: HexCell[], humanOwner: CellOwner = 0): void {
  const visibleCoordKeys = new Set<string>();

  // Any cell owned by player, plus all direct neighbors
  cells.forEach(cell => {
    if (cell.owner === humanOwner) {
      visibleCoordKeys.add(`${cell.q}_${cell.r}`);
      getNeighbors(cell).forEach(n => {
        visibleCoordKeys.add(`${n.q}_${n.r}`);
      });
    }
  });

  cells.forEach(cell => {
    cell.revealed = visibleCoordKeys.has(`${cell.q}_${cell.r}`);
  });
}

/**
 * Validates whether manual reinforcement can be applied to a cell
 */
export function canReinforceCell(
  cell: HexCell,
  owner: CellOwner,
  pool: number
): { valid: boolean; reason?: 'no_pool' | 'not_owner' | 'cell_maxed' | 'burned_out' } {
  if (pool <= 0) {
    return { valid: false, reason: 'no_pool' };
  }
  if (cell.owner !== owner) {
    return { valid: false, reason: 'not_owner' };
  }
  if (cell.units >= MAX_CELL_UNITS) {
    return { valid: false, reason: 'cell_maxed' };
  }
  if (cell.burnedOutTurns > 0) {
    return { valid: false, reason: 'burned_out' };
  }
  return { valid: true };
}

/**
 * Applies 1 reinforcement point from pool to cell
 */
export function applyManualReinforcement(
  cell: HexCell,
  owner: CellOwner,
  pool: number
): { success: boolean; newPool: number } {
  const check = canReinforceCell(cell, owner, pool);
  if (!check.valid) {
    return { success: false, newPool: pool };
  }
  cell.units += 1;
  return { success: true, newPool: pool - 1 };
}

/**
 * Calculates reinforcement points generated for the turn equal to the exact number of cells/hexes owned
 */
export function calculateReinforcements(controlledCount: number): number {
  return Math.max(1, controlledCount);
}

export function distributeReinforcements(cells: HexCell[], owner: CellOwner): number {
  const owned = cells.filter(c => c.owner === owner && c.burnedOutTurns <= 0);
  if (owned.length === 0) return 0;

  const totalBonus = calculateReinforcements(owned.length);
  let remaining = totalBonus;

  // Sort by lowest units first to reinforce weak points, while capping at MAX_CELL_UNITS
  owned.sort((a, b) => a.units - b.units);

  while (remaining > 0) {
    let placedAny = false;
    for (const cell of owned) {
      if (cell.units < MAX_CELL_UNITS && remaining > 0) {
        cell.units += 1;
        remaining -= 1;
        placedAny = true;
      }
    }
    if (!placedAny) break; // All cells maxed out
  }

  return totalBonus;
}

/**
 * Updates EM storms and cell burnout counters on round completion
 */
export function tickRoundHazards(
  cells: HexCell[],
  round: number,
  shouldSpawnStorm: boolean
): { spawnedStormCoord?: HexCoord; clearedCount: number } {
  let clearedCount = 0;

  // Decrement burnouts and storms
  cells.forEach(c => {
    if (c.burnedOutTurns > 0) {
      c.burnedOutTurns -= 1;
    }
    if (c.stormActive) {
      c.stormTurnsRemaining -= 1;
      if (c.stormTurnsRemaining <= 0) {
        c.stormActive = false;
        clearedCount++;
      }
    }
  });

  // Spawn new storm hazard periodically if requested
  let spawnedStormCoord: HexCoord | undefined;
  if (shouldSpawnStorm) {
    const candidates = cells.filter(c => !c.stormActive && c.units <= 8);
    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      chosen.stormActive = true;
      chosen.stormTurnsRemaining = STORM_DURATION_TURNS;
      spawnedStormCoord = { q: chosen.q, r: chosen.r };
    }
  }

  return { spawnedStormCoord, clearedCount };
}

/**
 * Emergency Transfer protocol (< 10% total unit count)
 */
export function checkAndExecuteEmergencyTransfer(
  cells: HexCell[],
  enabled: boolean
): { transferred: boolean; fromOwner?: CellOwner; toOwner?: CellOwner; nodeCount: number } {
  if (!enabled) return { transferred: false, nodeCount: 0 };

  const totalUnits = cells.reduce((sum, c) => sum + c.units, 0);
  if (totalUnits <= 0) return { transferred: false, nodeCount: 0 };

  const playerStats = new Map<CellOwner, { count: number; units: number }>();
  cells.forEach(c => {
    if (c.owner !== -1) {
      const current = playerStats.get(c.owner) || { count: 0, units: 0 };
      current.count += 1;
      current.units += c.units;
      playerStats.set(c.owner, current);
    }
  });

  // Check each faction
  for (const [owner, stats] of playerStats.entries()) {
    if (stats.units > 0 && stats.units / totalUnits < 0.10 && stats.count <= 2) {
      // Find ally or leading opposing player to gracefully gift smallest or isolated node
      // Best recipient is neighbor or leading commander
      const ownedCells = cells.filter(c => c.owner === owner);
      if (ownedCells.length > 0) {
        // Find best neighbor
        for (const cell of ownedCells) {
          const neighbors = getNeighbors(cell);
          const neighborCells = cells.filter(
            c => neighbors.some(n => n.q === c.q && n.r === c.r) && c.owner !== owner && c.owner !== -1
          );
          if (neighborCells.length > 0) {
            const recipient = neighborCells[0].owner;
            cell.owner = recipient;
            return {
              transferred: true,
              fromOwner: owner,
              toOwner: recipient,
              nodeCount: 1,
            };
          }
        }
      }
    }
  }

  return { transferred: false, nodeCount: 0 };
}

/**
 * Checks win or loss conditions
 */
export function checkGameState(
  cells: HexCell[],
  humanOwner: CellOwner = 0
): 'in_progress' | 'victory' | 'defeat' {
  const humanCells = cells.filter(c => c.owner === humanOwner);
  if (humanCells.length === 0) {
    return 'defeat';
  }

  const enemyCells = cells.filter(c => c.owner !== humanOwner && c.owner !== -1);
  if (enemyCells.length === 0) {
    return 'victory';
  }

  return 'in_progress';
}
