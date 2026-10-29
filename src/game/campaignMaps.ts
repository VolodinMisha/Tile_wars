/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HexCell, CellOwner } from './types';

interface StaticCellDef {
  q: number;
  r: number;
  owner: CellOwner;
  units: number;
  stormActive?: boolean;
}

/**
 * Handcrafted static layouts for all 20 Campaign Missions.
 * Each level features a fixed, repeatable tactical scenario with deliberate
 * chokepoints, side-tunnels, and fortified garrisons.
 */
const CAMPAIGN_STATIC_MAPS: Record<number, StaticCellDef[]> = {
  // Level 1: FIRST CONTACT (7 cells) - Direct duel across neutral watchtower
  1: [
    { q: 0, r: -1, owner: 0, units: 5 },    // Player base
    { q: 0, r: 0, owner: -1, units: 2 },    // Neutral central watchtower
    { q: 0, r: 1, owner: 1, units: 4 },     // Bot outpost
    { q: 1, r: -1, owner: -1, units: 1 },   // East flank
    { q: 1, r: 0, owner: -1, units: 2 },    // East pass
    { q: -1, r: 0, owner: -1, units: 1 },   // West pass
    { q: -1, r: 1, owner: -1, units: 2 },   // West flank
  ],

  // Level 2: FLANK CORRIDOR (12 cells) - Fortified center with East and West side-tunnels
  2: [
    { q: 0, r: -2, owner: 0, units: 6 },    // Player base
    { q: 0, r: -1, owner: 0, units: 3 },    // Player forward outpost
    { q: 0, r: 0, owner: -1, units: 5 },    // Fortified central strongpoint
    { q: 0, r: 1, owner: -1, units: 3 },    // Enemy forward gate
    { q: 0, r: 2, owner: 1, units: 6 },     // Enemy commander base
    // West Flanking Tunnel
    { q: -1, r: -1, owner: -1, units: 1 },
    { q: -1, r: 0, owner: -1, units: 2 },
    { q: -1, r: 1, owner: -1, units: 1 },
    // East Flanking Tunnel
    { q: 1, r: -2, owner: -1, units: 1 },
    { q: 1, r: -1, owner: -1, units: 2 },
    { q: 1, r: 0, owner: -1, units: 2 },
    { q: 1, r: 1, owner: -1, units: 1 },
  ],

  // Level 3: THE BRIDGEHEAD (14 cells) - EM storm divides center; two bridgehead tunnels
  3: [
    { q: 0, r: -2, owner: 0, units: 5 },
    { q: -1, r: -1, owner: 0, units: 4 },
    { q: 1, r: -2, owner: 0, units: 3 },
    // Dead zone center
    { q: 0, r: 0, owner: -1, units: 1, stormActive: true },
    // West Bridge tunnel
    { q: -2, r: 0, owner: -1, units: 2 },
    { q: -2, r: 1, owner: -1, units: 2 },
    { q: -1, r: 1, owner: -1, units: 3 },
    // East Bridge tunnel
    { q: 1, r: -1, owner: -1, units: 2 },
    { q: 2, r: -1, owner: -1, units: 2 },
    { q: 2, r: 0, owner: -1, units: 3 },
    // Enemy Sector
    { q: 0, r: 1, owner: -1, units: 3 },
    { q: 0, r: 2, owner: 1, units: 6 },
    { q: 1, r: 1, owner: 1, units: 4 },
    { q: -1, r: 2, owner: -1, units: 2 },
  ],

  // Level 4: PINCER ADVANCE (17 cells) - Player dual wings encircling central hostile bastion
  4: [
    // Player West Wing
    { q: -2, r: 0, owner: 0, units: 5 },
    { q: -2, r: 1, owner: 0, units: 4 },
    { q: -1, r: 0, owner: -1, units: 2 },
    // Player East Wing
    { q: 1, r: -2, owner: 0, units: 5 },
    { q: 2, r: -2, owner: 0, units: 4 },
    { q: 1, r: -1, owner: -1, units: 2 },
    // Central Buffer & Chokepoint
    { q: 0, r: -1, owner: -1, units: 3 },
    { q: 0, r: 0, owner: -1, units: 4 },
    { q: -1, r: 1, owner: -1, units: 2 },
    { q: 0, r: 1, owner: -1, units: 2 },
    // Enemy Fortress Core
    { q: 1, r: 0, owner: 1, units: 6 },
    { q: 2, r: -1, owner: 1, units: 5 },
    { q: 1, r: 1, owner: 1, units: 4 },
    { q: 0, r: 2, owner: -1, units: 2 },
    // Outer side-tunnels
    { q: -1, r: 2, owner: -1, units: 1 },
    { q: 2, r: 1, owner: -1, units: 1 },
    { q: 2, r: 0, owner: -1, units: 2 },
  ],

  // Level 5: TRI-CORRIDOR VALLEY (21 cells) - 2 bots, three parallel mountain passes
  5: [
    // Player South Base
    { q: 0, r: 2, owner: 0, units: 6 },
    { q: -1, r: 2, owner: 0, units: 4 },
    { q: 1, r: 1, owner: 0, units: 3 },
    // Central Highway
    { q: 0, r: 1, owner: -1, units: 3 },
    { q: 0, r: 0, owner: -1, units: 5 },
    { q: 0, r: -1, owner: -1, units: 3 },
    // West Flanking Pass
    { q: -2, r: 2, owner: -1, units: 2 },
    { q: -2, r: 1, owner: -1, units: 1 },
    { q: -2, r: 0, owner: -1, units: 2 },
    { q: -1, r: -1, owner: -1, units: 2 },
    // East Flanking Pass
    { q: 1, r: 0, owner: -1, units: 2 },
    { q: 2, r: -1, owner: -1, units: 1 },
    { q: 2, r: -2, owner: -1, units: 2 },
    { q: 1, r: -2, owner: -1, units: 2 },
    // Bot 1 (North-West)
    { q: -1, r: 0, owner: 1, units: 5 },
    { q: -1, r: -2, owner: 1, units: 6 },
    { q: -2, r: -1, owner: 1, units: 4 },
    // Bot 2 (North-East)
    { q: 0, r: -2, owner: 2, units: 6 },
    { q: 1, r: -1, owner: 2, units: 5 },
    { q: 2, r: 0, owner: -1, units: 3 },
    { q: -1, r: 1, owner: -1, units: 2 },
  ],

  // Level 6: THE FOG LABYRINTH (24 cells) - Fog of War, winding subterranean tunnels
  6: [
    { q: -2, r: -1, owner: 0, units: 6 },
    { q: -2, r: 0, owner: 0, units: 4 },
    { q: -1, r: -1, owner: -1, units: 2 },
    { q: -1, r: 0, owner: -1, units: 2 },
    { q: -1, r: 1, owner: -1, units: 3 },
    { q: 0, r: -2, owner: -1, units: 2 },
    { q: 0, r: -1, owner: -1, units: 1 },
    { q: 0, r: 0, owner: -1, units: 3 },
    { q: 0, r: 1, owner: -1, units: 2 },
    { q: 0, r: 2, owner: -1, units: 2 },
    // Winding bypass tunnels
    { q: 1, r: -2, owner: -1, units: 1 },
    { q: 1, r: -1, owner: -1, units: 2 },
    { q: 1, r: 0, owner: -1, units: 3 },
    { q: 1, r: 1, owner: -1, units: 2 },
    { q: 2, r: -2, owner: 1, units: 5 },
    { q: 2, r: -1, owner: 1, units: 6 },
    { q: 2, r: 0, owner: -1, units: 2 },
    { q: -2, r: 2, owner: 2, units: 6 },
    { q: -1, r: 2, owner: 2, units: 4 },
    { q: 2, r: 1, owner: -1, units: 2 },
    { q: -2, r: 1, owner: -1, units: 2 },
    { q: 1, r: 2, owner: -1, units: 1 },
    { q: -2, r: -2, owner: -1, units: 1 },
    { q: 2, r: 2, owner: -1, units: 1 },
  ],

  // Level 7: CITADEL CHOKEPOINT (26 cells) - 8-unit central fortress, wide flank bypass loops
  7: [
    { q: 0, r: -3, owner: 0, units: 7 },
    { q: 0, r: -2, owner: 0, units: 4 },
    { q: 1, r: -3, owner: 0, units: 3 },
    // Massive Central Citadel
    { q: 0, r: 0, owner: -1, units: 8 },
    { q: 0, r: -1, owner: -1, units: 4 },
    { q: 0, r: 1, owner: -1, units: 4 },
    // West Bypass Loop
    { q: -1, r: -2, owner: -1, units: 2 },
    { q: -2, r: -1, owner: -1, units: 1 },
    { q: -2, r: 0, owner: -1, units: 2 },
    { q: -2, r: 1, owner: -1, units: 1 },
    { q: -1, r: 1, owner: -1, units: 2 },
    // East Bypass Loop
    { q: 1, r: -2, owner: -1, units: 2 },
    { q: 2, r: -2, owner: -1, units: 1 },
    { q: 2, r: -1, owner: -1, units: 2 },
    { q: 2, r: 0, owner: -1, units: 1 },
    { q: 1, r: 0, owner: -1, units: 2 },
    { q: 1, r: 1, owner: -1, units: 2 },
    // Bot 1 Base (South-West)
    { q: -1, r: 2, owner: 1, units: 6 },
    { q: 0, r: 2, owner: 1, units: 5 },
    { q: -2, r: 2, owner: 1, units: 4 },
    // Bot 2 Base (South-East)
    { q: 1, r: 2, owner: 2, units: 6 },
    { q: 0, r: 3, owner: 2, units: 5 },
    { q: 2, r: 1, owner: -1, units: 3 },
    { q: -1, r: 0, owner: -1, units: 2 },
    { q: -1, r: -1, owner: -1, units: 2 },
    { q: -2, r: 3, owner: -1, units: 1 },
  ],

  // Level 8: IONIC STRAIT (27 cells) - EM storm blocks the middle, forces flank tunnel combat
  8: [
    { q: -2, r: -1, owner: 0, units: 6 },
    { q: -1, r: -2, owner: 0, units: 5 },
    { q: -2, r: -2, owner: 0, units: 4 },
    // EM Storm Barrier Line
    { q: 0, r: -1, owner: -1, units: 1, stormActive: true },
    { q: 0, r: 0, owner: -1, units: 1, stormActive: true },
    { q: 0, r: 1, owner: -1, units: 1, stormActive: true },
    // North Coastal Tunnel
    { q: 0, r: -2, owner: -1, units: 2 },
    { q: 1, r: -3, owner: -1, units: 2 },
    { q: 2, r: -3, owner: -1, units: 3 },
    { q: 2, r: -2, owner: 1, units: 6 },
    { q: 1, r: -2, owner: 1, units: 4 },
    // South Coastal Tunnel
    { q: -1, r: 1, owner: -1, units: 2 },
    { q: -1, r: 2, owner: -1, units: 2 },
    { q: 0, r: 2, owner: -1, units: 3 },
    { q: 1, r: 2, owner: 2, units: 6 },
    { q: 2, r: 1, owner: 2, units: 4 },
    // Secondary transit corridors
    { q: -1, r: 0, owner: -1, units: 3 },
    { q: -2, r: 0, owner: -1, units: 2 },
    { q: -2, r: 1, owner: -1, units: 2 },
    { q: 1, r: -1, owner: -1, units: 3 },
    { q: 2, r: -1, owner: -1, units: 2 },
    { q: 1, r: 0, owner: -1, units: 2 },
    { q: 2, r: 0, owner: -1, units: 3 },
    { q: 1, r: 1, owner: -1, units: 2 },
    { q: -1, r: -1, owner: -1, units: 2 },
    { q: 0, r: -3, owner: -1, units: 1 },
    { q: -2, r: 2, owner: -1, units: 1 },
  ],

  // Level 9: SYMMETRIC TRIDENT (30 cells) - Perfect 3-way balance with outer ring bypass
  9: [
    // Center Triangle Nexus
    { q: 0, r: 0, owner: -1, units: 4 },
    { q: 0, r: -1, owner: -1, units: 3 },
    { q: -1, r: 0, owner: -1, units: 3 },
    { q: 0, r: 1, owner: -1, units: 3 },
    { q: 1, r: 0, owner: -1, units: 3 },
    { q: 1, r: -1, owner: -1, units: 3 },
    { q: -1, r: 1, owner: -1, units: 3 },
    // Player Sector (South)
    { q: 0, r: 2, owner: 0, units: 6 },
    { q: -1, r: 3, owner: 0, units: 4 },
    { q: 1, r: 2, owner: 0, units: 4 },
    { q: 0, r: 3, owner: -1, units: 2 },
    // Bot 1 Sector (North-West)
    { q: -2, r: 0, owner: 1, units: 6 },
    { q: -3, r: 1, owner: 1, units: 4 },
    { q: -2, r: -1, owner: 1, units: 4 },
    { q: -3, r: 0, owner: -1, units: 2 },
    // Bot 2 Sector (North-East)
    { q: 2, r: -2, owner: 2, units: 6 },
    { q: 3, r: -2, owner: 2, units: 4 },
    { q: 1, r: -2, owner: 2, units: 4 },
    { q: 2, r: -3, owner: -1, units: 2 },
    // Outer Bypass Tunnel Loop
    { q: -2, r: 1, owner: -1, units: 2 },
    { q: -2, r: 2, owner: -1, units: 1 },
    { q: -1, r: 2, owner: -1, units: 2 },
    { q: 2, r: -1, owner: -1, units: 2 },
    { q: 2, r: 1, owner: -1, units: 1 },
    { q: 1, r: 1, owner: -1, units: 2 },
    { q: -1, r: -1, owner: -1, units: 2 },
    { q: 0, r: -2, owner: -1, units: 1 },
    { q: -1, r: -2, owner: -1, units: 1 },
    { q: 3, r: -3, owner: -1, units: 1 },
    { q: -3, r: 2, owner: -1, units: 1 },
  ],

  // Level 10: FORTRESS BREAKOUT (32 cells) - Siege layout with weak North tunnel gate
  10: [
    // Player inner bastion (besieged)
    { q: 0, r: 0, owner: 0, units: 8 },
    { q: 0, r: 1, owner: 0, units: 5 },
    { q: -1, r: 1, owner: 0, units: 4 },
    // Outer Siege Ring (Bots)
    { q: 0, r: -2, owner: 1, units: 7 },
    { q: -1, r: -1, owner: 1, units: 5 },
    { q: 1, r: -2, owner: 1, units: 5 },
    { q: 2, r: 0, owner: 2, units: 7 },
    { q: 2, r: -1, owner: 2, units: 5 },
    { q: 1, r: 1, owner: 2, units: 5 },
    { q: -2, r: 2, owner: 3, units: 7 },
    { q: -2, r: 1, owner: 3, units: 5 },
    { q: -1, r: 2, owner: 3, units: 4 },
    // Fortified intermediate barrier
    { q: 1, r: -1, owner: -1, units: 5 },
    { q: 1, r: 0, owner: -1, units: 5 },
    { q: -1, r: 0, owner: -1, units: 5 },
    // The Vulnerable North Tunnel Gate (Only 2 units)
    { q: 0, r: -1, owner: -1, units: 2 },
    { q: -1, r: -2, owner: -1, units: 1 },
    { q: -2, r: -1, owner: -1, units: 2 },
    // Perimeter Breakout Arteries
    { q: 0, r: 2, owner: -1, units: 3 },
    { q: 1, r: 2, owner: -1, units: 2 },
    { q: 2, r: 1, owner: -1, units: 2 },
    { q: 3, r: -1, owner: -1, units: 2 },
    { q: 3, r: -2, owner: -1, units: 2 },
    { q: -2, r: 0, owner: -1, units: 2 },
    { q: -3, r: 1, owner: -1, units: 2 },
    { q: -3, r: 2, owner: -1, units: 2 },
    { q: -1, r: 3, owner: -1, units: 1 },
    { q: 0, r: 3, owner: -1, units: 1 },
    { q: 2, r: -2, owner: -1, units: 3 },
    { q: -2, r: 3, owner: -1, units: 1 },
    { q: 3, r: 0, owner: -1, units: 1 },
    { q: 0, r: -3, owner: -1, units: 2 },
  ],

  // Levels 11 to 20: Full procedural generation with static seed for 100% deterministic, handcrafted layouts
  // generated statically on first import below.
};

// Generate deterministic static maps for levels 11 through 20 with dedicated tactical themes
function generateStaticCampaignTheme(level: number): StaticCellDef[] {
  // Deterministic pseudo-random based on level number
  let seed = level * 7919 + 104729;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const radius = level <= 12 ? 4 : level <= 15 ? 4 : level <= 18 ? 5 : 5;
  const botCount = level <= 13 ? 2 : level <= 17 ? 3 : 4;
  const cells: StaticCellDef[] = [];

  // Generate hex grid
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const dist = (Math.abs(q) + Math.abs(q + r) + Math.abs(r)) / 2;
      // Carve out deliberate void zones between center and edges to form bypass tunnels
      const isVoidHole = (dist === 2 && (q === 0 || r === 0 || q + r === 0) && rand() < 0.45);
      if (isVoidHole) continue;

      cells.push({
        q,
        r,
        owner: -1,
        units: Math.floor(rand() * 3) + 2, // 2-4 neutral garrison
        stormActive: false,
      });
    }
  }

  // Set Player Headquarters (at negative quadrant)
  const playerCell = cells.find(c => c.q === 0 && c.r === -radius) || cells[0];
  playerCell.owner = 0;
  playerCell.units = 7;

  // Add 1 player adjacent bastion
  const playerNeighbor = cells.find(c => {
    const dq = Math.abs(c.q - playerCell.q);
    const dr = Math.abs(c.r - playerCell.r);
    const dqr = Math.abs(c.q + c.r - playerCell.q - playerCell.r);
    return (dq + dr + dqr) / 2 === 1 && c.owner === -1;
  });
  if (playerNeighbor) {
    playerNeighbor.owner = 0;
    playerNeighbor.units = 5;
  }

  // Set Enemy Bot Headquarters equidistant around perimeter
  const step = 6 / (botCount + 1);
  for (let b = 1; b <= botCount; b++) {
    const dirIdx = Math.floor(b * step) % 6;
    const targetQ = Math.round(Math.cos((dirIdx * Math.PI) / 3) * (radius - 1));
    const targetR = Math.round(Math.sin((dirIdx * Math.PI) / 3) * (radius - 1));

    // Find closest valid cell
    let closest = cells.filter(c => c.owner === -1)[0];
    let minDist = Infinity;
    for (const c of cells) {
      if (c.owner !== -1) continue;
      const d = Math.hypot(c.q - targetQ, c.r - targetR);
      if (d < minDist) {
        minDist = d;
        closest = c;
      }
    }

    if (closest) {
      closest.owner = b as CellOwner;
      closest.units = 6 + (level >= 18 ? 2 : 0);

      // Neighbor
      const n = cells.find(c => {
        const dq = Math.abs(c.q - closest.q);
        const dr = Math.abs(c.r - closest.r);
        const dqr = Math.abs(c.q + c.r - closest.q - closest.r);
        return (dq + dr + dqr) / 2 === 1 && c.owner === -1;
      });
      if (n) {
        n.owner = b as CellOwner;
        n.units = 4;
      }
    }
  }

  // Place 1-2 strategic central storm anomalies in levels 13, 17, 20
  if (level === 13 || level === 17 || level === 20) {
    const centerCell = cells.find(c => c.q === 0 && c.r === 0);
    if (centerCell && centerCell.owner === -1) {
      centerCell.stormActive = true;
      centerCell.units = 1;
    }
  }

  return cells;
}

// Populate levels 11 through 20
for (let lvl = 11; lvl <= 20; lvl++) {
  CAMPAIGN_STATIC_MAPS[lvl] = generateStaticCampaignTheme(lvl);
}

/**
 * Returns the immutable static map for a given campaign level (1-20).
 */
export function getStaticCampaignMap(level: number): HexCell[] {
  const defs = CAMPAIGN_STATIC_MAPS[level] || CAMPAIGN_STATIC_MAPS[1];
  return defs.map(d => ({
    id: `${d.q}_${d.r}`,
    q: d.q,
    r: d.r,
    owner: d.owner,
    units: d.units,
    stormActive: !!d.stormActive,
    stormTurnsRemaining: d.stormActive ? 3 : 0,
    burnedOutTurns: 0,
    revealed: d.owner === 0,
  }));
}
