import { HexCell, CellOwner, BotDifficulty } from './types';
import { areHexesAdjacent, getNeighbors } from './hex';
import { resolveCombat, executeFriendlyTransfer, validateMove } from './rules';

export interface BotAction {
  origin: HexCell;
  target: HexCell;
  overclock: boolean;
}

/**
 * Computes bot turns based on difficulty setting
 */
export function computeBotMoves(
  cells: HexCell[],
  botOwner: CellOwner,
  difficulty: BotDifficulty
): BotAction[] {
  const actions: BotAction[] = [];
  const ownedCells = cells.filter(c => c.owner === botOwner && c.units > 1);

  if (ownedCells.length === 0) return actions;

  // Track simulated unit state so bot doesn't make duplicate or impossible moves
  const cellSimUnits = new Map<string, number>();
  const cellSimOwner = new Map<string, CellOwner>();
  cells.forEach(c => {
    cellSimUnits.set(c.id, c.units);
    cellSimOwner.set(c.id, c.owner);
  });

  // Sort candidate origins
  if (difficulty === 'pro' || difficulty === 'hard') {
    // Highest units first for maximum offensive momentum
    ownedCells.sort((a, b) => b.units - a.units);
  } else if (difficulty === 'easy') {
    // Shuffle
    ownedCells.sort(() => Math.random() - 0.5);
  }

  for (const origin of ownedCells) {
    const currentUnits = cellSimUnits.get(origin.id) || origin.units;
    if (currentUnits <= 1) continue;

    const neighbors = getNeighbors(origin);
    const adjacentCells = cells.filter(
      c => neighbors.some(n => n.q === c.q && n.r === c.r) && !c.stormActive
    );

    if (adjacentCells.length === 0) continue;

    // Filter enemy/neutral targets vs friendly targets
    const enemyTargets = adjacentCells.filter(c => (cellSimOwner.get(c.id) ?? c.owner) !== botOwner);
    const friendlyTargets = adjacentCells.filter(c => (cellSimOwner.get(c.id) ?? c.owner) === botOwner);

    let chosenTarget: HexCell | null = null;
    let useOverclock = false;

    if (difficulty === 'easy') {
      // 50% chance to attack any neighbor if units >= target
      if (enemyTargets.length > 0 && Math.random() < 0.6) {
        const candidate = enemyTargets[Math.floor(Math.random() * enemyTargets.length)];
        const targetUnits = cellSimUnits.get(candidate.id) || candidate.units;
        if (currentUnits - 1 >= targetUnits) {
          chosenTarget = candidate;
        }
      }
    } else if (difficulty === 'medium') {
      // Attack weakest enemy neighbor if we have advantage
      if (enemyTargets.length > 0) {
        enemyTargets.sort((a, b) => (cellSimUnits.get(a.id) || a.units) - (cellSimUnits.get(b.id) || b.units));
        const weakest = enemyTargets[0];
        const targetUnits = cellSimUnits.get(weakest.id) || weakest.units;
        if (currentUnits - 1 > targetUnits) {
          chosenTarget = weakest;
        }
      }
    } else if (difficulty === 'hard') {
      // Target high-priority enemy nodes (human player prioritized or weakest border)
      if (enemyTargets.length > 0) {
        enemyTargets.sort((a, b) => {
          const aOwner = cellSimOwner.get(a.id) ?? a.owner;
          const bOwner = cellSimOwner.get(b.id) ?? b.owner;
          // Prioritize human player (owner 0)
          if (aOwner === 0 && bOwner !== 0) return -1;
          if (bOwner === 0 && aOwner !== 0) return 1;
          return (cellSimUnits.get(a.id) || a.units) - (cellSimUnits.get(b.id) || b.units);
        });

        for (const candidate of enemyTargets) {
          const targetUnits = cellSimUnits.get(candidate.id) || candidate.units;
          if (currentUnits - 1 >= targetUnits) {
            chosenTarget = candidate;
            break;
          }
        }
      }
    } else if (difficulty === 'pro') {
      // Pro: checks if overclock can guarantee a breakthrough or conquer critical bottleneck
      if (enemyTargets.length > 0) {
        enemyTargets.sort((a, b) => {
          const aUnits = cellSimUnits.get(a.id) || a.units;
          const bUnits = cellSimUnits.get(b.id) || b.units;
          return aUnits - bUnits;
        });

        for (const candidate of enemyTargets) {
          const targetUnits = cellSimUnits.get(candidate.id) || candidate.units;
          const committed = currentUnits - 1;
          if (committed > targetUnits) {
            chosenTarget = candidate;
            useOverclock = false;
            break;
          } else if (committed + Math.round(committed * 0.35) > targetUnits && committed >= 3) {
            // Overclock gives winning edge!
            chosenTarget = candidate;
            useOverclock = true;
            break;
          }
        }
      }

      // If no attack, reinforce frontline from deep backline
      if (!chosenTarget && friendlyTargets.length > 0 && currentUnits >= 4) {
        // Find friendly neighbor that is closer to enemy
        const frontlineFriend = friendlyTargets.find(f => {
          const fNeighbors = getNeighbors(f);
          return cells.some(
            c => fNeighbors.some(fn => fn.q === c.q && fn.r === c.r) &&
                 (cellSimOwner.get(c.id) ?? c.owner) !== botOwner
          );
        });
        if (frontlineFriend) {
          chosenTarget = frontlineFriend;
        }
      }
    }

    if (chosenTarget) {
      actions.push({
        origin,
        target: chosenTarget,
        overclock: useOverclock,
      });

      // Update sim
      cellSimUnits.set(origin.id, 1);
      if ((cellSimOwner.get(chosenTarget.id) ?? chosenTarget.owner) !== botOwner) {
        cellSimOwner.set(chosenTarget.id, botOwner);
        cellSimUnits.set(chosenTarget.id, Math.max(1, currentUnits - 2));
      }
    }
  }

  return actions;
}
