import { HexCell, CellOwner, BotDifficulty } from './types';
import { areHexesAdjacent, getNeighbors } from './hex';
import { getCellMaxUnits } from './rules';

export interface BotAction {
  origin: HexCell;
  target: HexCell;
  overclock: boolean;
}

/**
 * Computes bot turns based on the overhauled difficulty archetypes:
 * - Easy: Frequently reinforces, rarely or never initiates attacks, completely ignores the human player.
 * - Medium: Acts somewhat randomly, but upon accumulating a large force (units >= 5) on a single cell, launches chain, uncoordinated attacks indiscriminately.
 * - Hard: Focused on massive map expansion, analyzing force layouts and aggressively conquering uncaptured adjacent cells.
 * - Pro: Optimal global conquest, ignores isolated inner cells, adapts to strongest opponent, calculated high-risk Overclock plays, and prioritizes seizing and utilizing 12-capacity tiles.
 */
export function computeBotMoves(
  cells: HexCell[],
  botOwner: CellOwner,
  difficulty: BotDifficulty
): BotAction[] {
  const actions: BotAction[] = [];
  const ownedCells = cells.filter(c => c.owner === botOwner && c.units > 1 && c.burnedOutTurns <= 0);

  if (ownedCells.length === 0) return actions;

  // Track simulated unit state so bot doesn't make duplicate or impossible moves within the same turn
  const cellSimUnits = new Map<string, number>();
  const cellSimOwner = new Map<string, CellOwner>();
  cells.forEach(c => {
    cellSimUnits.set(c.id, c.units);
    cellSimOwner.set(c.id, c.owner);
  });

  // EASY AI:
  // - Rarely or never initiates attacks (~88% chance to pass without any attacks).
  // - Completely ignores the human player (never targets human tiles with owner === 0).
  // - If it does attack, only takes adjacent weak neutral or bot tiles with overwhelming superiority.
  if (difficulty === 'easy') {
    if (Math.random() < 0.88) {
      return actions;
    }

    for (const origin of ownedCells) {
      const currentUnits = cellSimUnits.get(origin.id) || origin.units;
      if (currentUnits < 4) continue;

      const neighbors = getNeighbors(origin);
      const candidates = cells.filter(c => {
        if (c.stormActive) return false;
        const owner = cellSimOwner.get(c.id) ?? c.owner;
        // Completely ignores human player (owner 0)!
        if (owner === 0 || owner === botOwner) return false;
        return neighbors.some(n => n.q === c.q && n.r === c.r);
      });

      for (const target of candidates) {
        const targetUnits = cellSimUnits.get(target.id) || target.units;
        if (currentUnits - 1 >= targetUnits + 2) {
          actions.push({ origin, target, overclock: false });
          return actions; // Only 1 cautious move
        }
      }
    }
    return actions;
  }

  // MEDIUM AI:
  // - Acts somewhat randomly/passively when armies are small.
  // - BUT upon accumulating large forces on a single cell (units >= 5), launches a chain frenzy of
  //   uncoordinated attacks on adjacent neutral, player, or enemy cells indiscriminately.
  if (difficulty === 'medium') {
    const heavyStackOrigins = ownedCells.filter(c => (cellSimUnits.get(c.id) || c.units) >= 5);

    // If no large stacks exist, small random chance (25%) of a single opportunistic attack
    if (heavyStackOrigins.length === 0) {
      if (Math.random() < 0.25) {
        const randomOrigin = ownedCells[Math.floor(Math.random() * ownedCells.length)];
        const currentUnits = cellSimUnits.get(randomOrigin.id) || randomOrigin.units;
        const neighbors = getNeighbors(randomOrigin);
        const candidates = cells.filter(c => {
          if (c.stormActive) return false;
          const owner = cellSimOwner.get(c.id) ?? c.owner;
          return owner !== botOwner && neighbors.some(n => n.q === c.q && n.r === c.r);
        });

        if (candidates.length > 0) {
          const target = candidates[Math.floor(Math.random() * candidates.length)];
          const targetUnits = cellSimUnits.get(target.id) || target.units;
          if (currentUnits - 1 >= targetUnits) {
            actions.push({ origin: randomOrigin, target, overclock: false });
          }
        }
      }
      return actions;
    }

    // High force accumulated: launch chain assault spree!
    for (const highCell of heavyStackOrigins) {
      let currentSource = highCell;
      let iterations = 0;

      while (iterations < 5) {
        iterations++;
        const currentUnits = cellSimUnits.get(currentSource.id) || currentSource.units;
        if (currentUnits <= 2) break; // Depleted

        const neighbors = getNeighbors(currentSource);
        const candidates = cells.filter(c => {
          if (c.stormActive) return false;
          const owner = cellSimOwner.get(c.id) ?? c.owner;
          return owner !== botOwner && neighbors.some(n => n.q === c.q && n.r === c.r);
        });

        if (candidates.length === 0) break;

        // Pick indiscriminately among adjacent neutral, player, or enemy cells
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const targetUnits = cellSimUnits.get(chosen.id) || chosen.units;

        actions.push({ origin: currentSource, target: chosen, overclock: false });

        // Update sim
        const targetMax = getCellMaxUnits(chosen);
        const remainingInTarget = Math.min(targetMax, Math.max(1, (currentUnits - 1) - targetUnits));
        cellSimUnits.set(currentSource.id, 1);
        cellSimOwner.set(chosen.id, botOwner);
        cellSimUnits.set(chosen.id, remainingInTarget);

        // Chain attack from newly conquered cell if it retained high forces
        if (remainingInTarget >= 3) {
          currentSource = chosen;
        } else {
          break;
        }
      }
    }
    return actions;
  }

  // HARD AI (Massive Map Expansion & Defensive Perimeter):
  // - Focuses on aggressive map expansion, systematically conquering adjacent uncaptured cells.
  if (difficulty === 'hard') {
    // Sort origins: highest units first for maximum offensive momentum
    ownedCells.sort((a, b) => (cellSimUnits.get(b.id) || b.units) - (cellSimUnits.get(a.id) || a.units));

    for (const origin of ownedCells) {
      const currentUnits = cellSimUnits.get(origin.id) || origin.units;
      if (currentUnits <= 1) continue;

      const neighbors = getNeighbors(origin);
      const enemyTargets = cells.filter(c => {
        if (c.stormActive) return false;
        const owner = cellSimOwner.get(c.id) ?? c.owner;
        return owner !== botOwner && neighbors.some(n => n.q === c.q && n.r === c.r);
      });

      if (enemyTargets.length === 0) continue;

      // Heuristic: prioritize massive map expansion. Neutral nodes provide rapid territorial control;
      // weak enemy border nodes secure defensive buffer zones.
      enemyTargets.sort((a, b) => {
        const aOwner = cellSimOwner.get(a.id) ?? a.owner;
        const bOwner = cellSimOwner.get(b.id) ?? b.owner;
        const aUnits = cellSimUnits.get(a.id) || a.units;
        const bUnits = cellSimUnits.get(b.id) || b.units;

        const scoreA = (aOwner === -1 ? 40 : 25) - aUnits * 3 + (getCellMaxUnits(a) === 12 ? 10 : 0);
        const scoreB = (bOwner === -1 ? 40 : 25) - bUnits * 3 + (getCellMaxUnits(b) === 12 ? 10 : 0);
        return scoreB - scoreA;
      });

      for (const target of enemyTargets) {
        const targetUnits = cellSimUnits.get(target.id) || target.units;
        if (currentUnits - 1 >= targetUnits) {
          actions.push({ origin, target, overclock: false });
          // Update sim
          const targetMax = getCellMaxUnits(target);
          cellSimUnits.set(origin.id, 1);
          cellSimOwner.set(target.id, botOwner);
          cellSimUnits.set(target.id, Math.min(targetMax, Math.max(1, currentUnits - 1 - targetUnits)));
          break; // Next origin
        }
      }
    }
    return actions;
  }

  // PRO AI (Global Conquest, Dynamic Adaptation & 12-Capacity Breakthroughs):
  // - Aims to conquer the entire map with optimal expansion planning.
  // - Completely avoids freezing/wasting troops around already isolated inner cells.
  // - Adapts dynamically to the strongest opponent.
  // - Seizes and utilizes high-capacity (12) tiles as strategic breakthrough launchpads.
  // - Makes calculated high-risk Overclock plays (+35% ATK) for vital breakthroughs.
  if (difficulty === 'pro') {
    // 1. Identify strongest opponent
    const opponentUnits = new Map<CellOwner, number>();
    cells.forEach(c => {
      const owner = cellSimOwner.get(c.id) ?? c.owner;
      if (owner !== botOwner && owner !== -1) {
        opponentUnits.set(owner, (opponentUnits.get(owner) || 0) + (cellSimUnits.get(c.id) || c.units));
      }
    });
    let strongestOpponent: CellOwner | null = null;
    let maxOpponentUnits = -1;
    for (const [foe, u] of opponentUnits.entries()) {
      if (u > maxOpponentUnits) {
        maxOpponentUnits = u;
        strongestOpponent = foe;
      }
    }

    // 2. Filter out isolated inner cells (cells whose neighbors are all already friendly)
    const frontlineOrigins = ownedCells.filter(c => {
      const neighbors = getNeighbors(c);
      return cells.some(other => {
        const owner = cellSimOwner.get(other.id) ?? other.owner;
        return neighbors.some(n => n.q === other.q && n.r === other.r) && owner !== botOwner;
      });
    });

    // Sort: 12-capacity tiles first (breakthrough batteries), then by highest units
    frontlineOrigins.sort((a, b) => {
      const aCap = getCellMaxUnits(a);
      const bCap = getCellMaxUnits(b);
      if (aCap !== bCap) return bCap - aCap;
      return (cellSimUnits.get(b.id) || b.units) - (cellSimUnits.get(a.id) || a.units);
    });

    for (const origin of frontlineOrigins) {
      const currentUnits = cellSimUnits.get(origin.id) || origin.units;
      if (currentUnits <= 1) continue;

      const neighbors = getNeighbors(origin);
      const enemyTargets = cells.filter(c => {
        if (c.stormActive) return false;
        const owner = cellSimOwner.get(c.id) ?? c.owner;
        return owner !== botOwner && neighbors.some(n => n.q === c.q && n.r === c.r);
      });

      if (enemyTargets.length === 0) continue;

      // Score targets strategically
      enemyTargets.sort((a, b) => {
        const aOwner = cellSimOwner.get(a.id) ?? a.owner;
        const bOwner = cellSimOwner.get(b.id) ?? b.owner;
        const aUnits = cellSimUnits.get(a.id) || a.units;
        const bUnits = cellSimUnits.get(b.id) || b.units;
        const aCap = getCellMaxUnits(a);
        const bCap = getCellMaxUnits(b);

        let scoreA = 20 - aUnits * 2;
        let scoreB = 20 - bUnits * 2;

        // Immense priority for seizing high-capacity (12) strongholds
        if (aCap === 12) scoreA += 55;
        if (bCap === 12) scoreB += 55;

        // Strategic adaptation against strongest opponent
        if (aOwner === strongestOpponent) scoreA += 35;
        if (bOwner === strongestOpponent) scoreB += 35;

        // Neutral expansion value
        if (aOwner === -1) scoreA += 15;
        if (bOwner === -1) scoreB += 15;

        return scoreB - scoreA;
      });

      let chosenTarget: HexCell | null = null;
      let useOverclock = false;

      for (const target of enemyTargets) {
        const targetUnits = cellSimUnits.get(target.id) || target.units;
        const committed = currentUnits - 1;
        const targetCap = getCellMaxUnits(target);
        const targetOwner = cellSimOwner.get(target.id) ?? target.owner;

        // Normal victory
        if (committed > targetUnits) {
          chosenTarget = target;
          useOverclock = false;
          break;
        }

        // High-risk calculated Overclock for 12-capacity stronghold, or against strongest opponent
        const isHighValue = targetCap === 12 || targetOwner === strongestOpponent;
        const boosted = committed + Math.round(committed * 0.35);
        if (isHighValue && committed >= 3 && boosted > targetUnits) {
          chosenTarget = target;
          useOverclock = true;
          break;
        }
      }

      if (chosenTarget) {
        actions.push({ origin, target: chosenTarget, overclock: useOverclock });
        const targetMax = getCellMaxUnits(chosenTarget);
        const finalAtk = useOverclock ? (currentUnits - 1) + Math.round((currentUnits - 1) * 0.35) : (currentUnits - 1);
        const targetUnits = cellSimUnits.get(chosenTarget.id) || chosenTarget.units;
        const surviving = Math.min(targetMax, Math.max(1, finalAtk - targetUnits));

        cellSimUnits.set(origin.id, 1);
        cellSimOwner.set(chosenTarget.id, botOwner);
        cellSimUnits.set(chosenTarget.id, surviving);
      }
    }

    return actions;
  }

  return actions;
}
