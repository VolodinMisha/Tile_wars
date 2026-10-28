import { HexCell, CombatResult, CellOwner, HexCoord } from './types';
import { areHexesAdjacent, getNeighbors } from './hex';

export const MAX_CELL_UNITS = 12;
export const BURNOUT_PENALTY_TURNS = 2;
export const STORM_DURATION_TURNS = 3;

/**
 * Resolves combat between attacker and defender.
 * Attacker commits (attackerUnits - 1) into the assault.
 */
export function resolveCombat(
  attackerUnits: number,
  defenderUnits: number,
  overclock: boolean,
  deterministicSeed?: number
): CombatResult {
  const committedUnits = Math.max(1, attackerUnits - 1);

  // Attack power calculation
  let effectiveAttackPower = committedUnits;
  if (overclock) {
    // 35% boost, minimum +2 ATK bonus
    const bonus = Math.max(2, Math.round(committedUnits * 0.35));
    effectiveAttackPower += bonus;
  }

  // Small tactical variance for exciting wargame feel
  const randVariance = deterministicSeed !== undefined
    ? deterministicSeed
    : (Math.random() * 0.6 - 0.3); // -0.3 to +0.3

  const attackerScore = effectiveAttackPower + randVariance;
  const defenderScore = defenderUnits;

  const success = attackerScore > defenderScore;

  if (success) {
    // Attacker takes territory
    // Defender is eliminated
    const defenderLosses = defenderUnits;
    // Attacker losses depend on ratio
    const ratio = defenderUnits / Math.max(1, effectiveAttackPower);
    const attackerLosses = Math.min(committedUnits - 1, Math.floor(committedUnits * ratio * 0.7));
    const unitsMovingIn = Math.max(1, committedUnits - attackerLosses);

    return {
      success: true,
      attackerUnitsRemaining: 1, // 1 stays in origin
      defenderUnitsRemaining: unitsMovingIn, // new garrison in target
      overclockUsed: overclock,
      overclockBackfired: false,
      attackerLosses,
      defenderLosses,
      captured: true,
    };
  } else {
    // Defender holds!
    if (overclock) {
      // Overclock backfire: heavy losses & burnout penalty
      const defenderLosses = Math.min(defenderUnits - 1, Math.floor(committedUnits * 0.4));
      return {
        success: false,
        attackerUnitsRemaining: 1, // dropped to 1 unit
        defenderUnitsRemaining: Math.max(1, defenderUnits - defenderLosses),
        overclockUsed: true,
        overclockBackfired: true, // triggers burnout cooldown
        attackerLosses: committedUnits,
        defenderLosses,
        captured: false,
      };
    } else {
      // Standard attack failure
      const defenderLosses = Math.min(defenderUnits - 1, Math.floor(committedUnits * 0.6));
      return {
        success: false,
        attackerUnitsRemaining: 1,
        defenderUnitsRemaining: Math.max(1, defenderUnits - defenderLosses),
        overclockUsed: false,
        overclockBackfired: false,
        attackerLosses: committedUnits,
        defenderLosses,
        captured: false,
      };
    }
  }
}

/**
 * Validates whether an attack or transfer order is legal
 */
export function validateMove(
  origin: HexCell,
  target: HexCell
): { valid: boolean; reason?: 'not_adjacent' | 'insufficient_units' | 'storm_blocked' | 'same_cell' } {
  if (origin.id === target.id) {
    return { valid: false, reason: 'same_cell' };
  }
  if (!areHexesAdjacent(origin, target)) {
    return { valid: false, reason: 'not_adjacent' };
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
 * Executes a friendly reinforcement transfer from origin to adjacent target
 */
export function executeFriendlyTransfer(origin: HexCell, target: HexCell): void {
  const transferUnits = origin.units - 1;
  const availableSpace = MAX_CELL_UNITS - target.units;
  const actualTransfer = Math.min(transferUnits, Math.max(1, availableSpace));
  origin.units -= actualTransfer;
  target.units = Math.min(MAX_CELL_UNITS, target.units + actualTransfer);
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
