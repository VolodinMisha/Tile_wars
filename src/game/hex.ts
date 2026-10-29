/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HexCoord, HexCell, MapSize, CellOwner } from './types';

// The 6 axial directions for a pointy-topped or flat-topped hex grid
export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function getHexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function areHexesAdjacent(a: HexCoord, b: HexCoord): boolean {
  return getHexDistance(a, b) === 1;
}

export function getNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r,
  }));
}

export function hexToPixel(coord: HexCoord, hexRadius: number): { x: number; y: number } {
  // Pointy-topped hex layout
  const x = hexRadius * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
  const y = hexRadius * ((3 / 2) * coord.r);
  return { x, y };
}

export function getHexPolygonPoints(centerX: number, centerY: number, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30; // Pointy-topped
    const angleRad = (Math.PI / 180) * angleDeg;
    const px = centerX + radius * Math.cos(angleRad);
    const py = centerY + radius * Math.sin(angleRad);
    points.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return points.join(' ');
}

export function getMapRadius(size: MapSize): number {
  switch (size) {
    case 'S':
      return 2; // 19 hexes
    case 'M':
      return 3; // 37 hexes
    case 'L':
      return 4; // 61 hexes
    case 'XL':
      return 5; // 91 hexes
    case 'XXL':
      return 6; // 127 hexes
  }
}

/**
 * Generates all valid hex coordinates in a hexagonal spiral of given radius
 */
export function generateHexCoords(radius: number): HexCoord[] {
  const coords: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      coords.push({ q, r });
    }
  }
  return coords;
}

/**
 * Ensures all hex coordinates in the list form a single contiguous component via BFS
 */
function filterConnectedComponent(coords: HexCoord[]): HexCoord[] {
  if (coords.length <= 1) return coords;

  const key = (c: HexCoord) => `${c.q},${c.r}`;
  const coordMap = new Map<string, HexCoord>();
  coords.forEach(c => coordMap.set(key(c), c));

  // Find center or first available
  const start = coordMap.get('0,0') || coords[0];
  const visited = new Set<string>();
  const queue: HexCoord[] = [start];
  visited.add(key(start));

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const dir of HEX_DIRECTIONS) {
      const neighborKey = `${curr.q + dir.q},${curr.r + dir.r}`;
      if (coordMap.has(neighborKey) && !visited.has(neighborKey)) {
        visited.add(neighborKey);
        queue.push(coordMap.get(neighborKey)!);
      }
    }
  }

  // Return only visited connected coords
  return coords.filter(c => visited.has(key(c)));
}

/**
 * Carves out obstacles to create distinct central chokepoints and outer side-tunnels / flank paths
 */
function carveFlankingTunnels(
  coords: HexCoord[],
  radius: number,
  isSymmetric: boolean,
  totalPlayers: number
): HexCoord[] {
  if (radius < 3) return coords; // Keep small maps compact

  const key = (q: number, r: number) => `${q},${r}`;
  const coordSet = new Set(coords.map(c => key(c.q, c.r)));

  // Identify cells to remove to create side tunnels:
  // We leave the center (q=0, r=0), leave the outer perimeter (dist === radius)
  // and carve gaps in the intermediate ring (dist === radius - 1 or radius - 2)
  const holesToRemove = new Set<string>();

  if (isSymmetric) {
    const symmetrySectors = Math.max(3, totalPlayers);
    for (let i = 0; i < symmetrySectors; i++) {
      const angle = (i * 2 * Math.PI) / symmetrySectors;
      // Mid-radius obstacle
      const targetDist = radius > 3 ? radius - 2 : radius - 1;
      const oq = Math.round(Math.cos(angle) * targetDist);
      const or = Math.round(Math.sin(angle) * targetDist);

      if (coordSet.has(key(oq, or)) && !(oq === 0 && or === 0)) {
        holesToRemove.add(key(oq, or));
      }
    }
  } else {
    // Semi-random side tunnel carving
    coords.forEach(c => {
      const dist = (Math.abs(c.q) + Math.abs(c.q + c.r) + Math.abs(c.r)) / 2;
      if (dist === radius - 1 && Math.random() < 0.28 && !(c.q === 0 && c.r === 0)) {
        holesToRemove.add(key(c.q, c.r));
      }
    });
  }

  const remaining = coords.filter(c => !holesToRemove.has(key(c.q, c.r)));
  return filterConnectedComponent(remaining);
}

/**
 * Generates the full initial game board cells for custom / skirmish games.
 * Features ~65% symmetrical maps with flanking tunnels and bypass corridors.
 */
export function generateBoardCells(
  size: MapSize,
  botCount: number,
  symmetric: boolean,
  swarmStart: boolean
): HexCell[] {
  const radius = getMapRadius(size);
  const totalPlayers = botCount + 1; // 0 = Player, 1..botCount = Bots

  // ~65% of skirmish maps feature symmetrical layout
  const isSymmetric = symmetric || Math.random() < 0.65;

  let coords = generateHexCoords(radius);

  if (!swarmStart) {
    coords = carveFlankingTunnels(coords, radius, isSymmetric, totalPlayers);
  }

  const cells: HexCell[] = coords.map(c => ({
    id: `${c.q}_${c.r}`,
    q: c.q,
    r: c.r,
    owner: -1,
    units: Math.floor(Math.random() * 3) + 1, // Neutral units 1-3
    stormActive: false,
    stormTurnsRemaining: 0,
    burnedOutTurns: 0,
    revealed: false,
  }));

  if (swarmStart) {
    // Distribute every cell across player and bots
    const shuffled = [...cells].sort(() => Math.random() - 0.5);
    shuffled.forEach((cell, idx) => {
      const owner = (idx % totalPlayers) as CellOwner;
      cell.owner = owner;
      cell.units = Math.floor(Math.random() * 4) + 2; // 2 to 5 units
    });
  } else if (isSymmetric) {
    // Symmetrical starting deployment along perimeter flanking tunnels
    const step = 6 / totalPlayers;
    const anchorCoords: HexCoord[] = [];

    for (let i = 0; i < totalPlayers; i++) {
      const dirIndex = Math.floor(i * step) % 6;
      const angle = (dirIndex * Math.PI) / 3;
      const targetQ = Math.round(Math.cos(angle) * radius);
      const targetR = Math.round(Math.sin(angle) * radius);

      // Find closest surviving cell on map
      let closest = cells.filter(c => c.owner === -1)[0];
      let minDist = Infinity;
      for (const c of cells) {
        if (anchorCoords.some(a => a.q === c.q && a.r === c.r)) continue;
        const d = Math.hypot(c.q - targetQ, c.r - targetR);
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      }

      if (closest) {
        anchorCoords.push({ q: closest.q, r: closest.r });
        closest.owner = i as CellOwner;
        closest.units = 6;

        // Give 1 neighbor along the flanking path
        const neighbors = getNeighbors(closest);
        for (const n of neighbors) {
          const nCell = cells.find(c => c.q === n.q && c.r === n.r);
          if (nCell && nCell.owner === -1) {
            nCell.owner = i as CellOwner;
            nCell.units = 4;
            break;
          }
        }
      }
    }
  } else {
    // Standard random placement with minimum distance separation
    const available = [...cells].sort(() => Math.random() - 0.5);
    const chosen: HexCell[] = [];

    for (let p = 0; p < totalPlayers; p++) {
      let bestCandidate = available.find(cand => {
        return chosen.every(ch => getHexDistance(cand, ch) >= Math.max(2, Math.floor(radius * 0.8)));
      });
      if (!bestCandidate) {
        bestCandidate = available[p * 2] || available[p];
      }
      if (bestCandidate) {
        chosen.push(bestCandidate);
        bestCandidate.owner = p as CellOwner;
        bestCandidate.units = 6;

        // Give 1 adjacent node
        const neighbors = getNeighbors(bestCandidate);
        for (const n of neighbors) {
          const nCell = cells.find(c => c.q === n.q && c.r === n.r);
          if (nCell && nCell.owner === -1) {
            nCell.owner = p as CellOwner;
            nCell.units = 4;
            break;
          }
        }
      }
    }
  }

  return cells;
}
