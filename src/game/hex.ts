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
 * Generates the full initial game board cells
 */
export function generateBoardCells(
  size: MapSize,
  botCount: number,
  symmetric: boolean,
  swarmStart: boolean
): HexCell[] {
  const radius = getMapRadius(size);
  const coords = generateHexCoords(radius);
  const totalPlayers = botCount + 1; // 0 = Player, 1..botCount = Bots

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
  } else if (symmetric) {
    // Pick symmetric starting anchors at equidistant border positions
    const anchorCoords: HexCoord[] = [];
    const step = 6 / totalPlayers;
    for (let i = 0; i < totalPlayers; i++) {
      const dirIndex = Math.floor(i * step) % 6;
      const dir = HEX_DIRECTIONS[dirIndex];
      anchorCoords.push({
        q: dir.q * radius,
        r: dir.r * radius,
      });
    }

    anchorCoords.forEach((anchor, pIndex) => {
      const cell = cells.find(c => c.q === anchor.q && c.r === anchor.r);
      if (cell) {
        cell.owner = pIndex as CellOwner;
        cell.units = 6;
      }
      // Give 1 immediate neighbor to start with solid foothold
      const neighbors = getNeighbors(anchor);
      for (const n of neighbors) {
        const nCell = cells.find(c => c.q === n.q && c.r === n.r);
        if (nCell && nCell.owner === -1) {
          nCell.owner = pIndex as CellOwner;
          nCell.units = 4;
          break;
        }
      }
    });
  } else {
    // Standard random placement with minimum distance separation
    const available = [...cells].sort(() => Math.random() - 0.5);
    const chosen: HexCell[] = [];

    for (let p = 0; p < totalPlayers; p++) {
      // Find a candidate that is at least radius distance from others
      let bestCandidate = available.find(cand => {
        return chosen.every(ch => getHexDistance(cand, ch) >= Math.max(2, Math.floor(radius * 0.9)));
      });
      if (!bestCandidate) {
        bestCandidate = available[p * 3] || available[p];
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
