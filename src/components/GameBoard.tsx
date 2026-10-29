import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { HexCell, Theme, CellOwner, HexCoord } from '../game/types';
import {
  hexToPixel,
  getHexPolygonPoints,
  areHexesAdjacent,
} from '../game/hex';
import { getPlayerColor, getPlayerBg } from '../game/constants';
import { soundFx } from '../game/audio';
import { MAX_CELL_UNITS, canReinforceCell } from '../game/rules';

interface GameBoardProps {
  cells: HexCell[];
  selectedCellId: string | null;
  onSelectCell: (cell: HexCell | null) => void;
  onExecuteAction: (targetCell: HexCell) => void;
  onReinforceCell: (cell: HexCell) => void;
  theme: Theme;
  fogOfWarEnabled: boolean;
  isHumanTurn: boolean;
  overclockActive: boolean;
  reinforcementPool: number;
  resetTrigger: number; // Increment to reset camera view
}

export const GameBoard: React.FC<GameBoardProps> = ({
  cells,
  selectedCellId,
  onSelectCell,
  onExecuteAction,
  onReinforceCell,
  theme,
  fogOfWarEnabled,
  isHumanTurn,
  overclockActive,
  reinforcementPool,
  resetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and Zoom transform state
  const [transform, setTransform] = useState<{ x: number; y: number; k: number }>({
    x: 0,
    y: 0,
    k: 1,
  });

  // Hex geometry size
  const hexRadius = 42;
  const isDark = theme === 'dark';

  // Selected cell object
  const selectedCell = useMemo(
    () => cells.find(c => c.id === selectedCellId) || null,
    [cells, selectedCellId]
  );

  // Keep reference to latest cells without re-triggering camera calculations
  const cellsRef = useRef(cells);
  cellsRef.current = cells;

  // Target options for the selected cell (Strictly enemy or neutral; friendly transfer is removed)
  const targetOptions = useMemo(() => {
    if (!selectedCell || !isHumanTurn || selectedCell.units <= 1) return [];

    return cells
      .filter(target => areHexesAdjacent(selectedCell, target) && target.owner !== selectedCell.owner)
      .map(target => {
        const isStorm = target.stormActive;
        const p1 = hexToPixel(selectedCell, hexRadius);
        const p2 = hexToPixel(target, hexRadius);
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        return {
          target,
          isStorm,
          p1,
          p2,
          angle,
        };
      });
  }, [selectedCell, cells, isHumanTurn]);

  // Center camera on grid - only when initial mount or resetTrigger (RESET CAM button) is pressed
  const centerCamera = useCallback(() => {
    const currentCells = cellsRef.current;
    if (!containerRef.current || currentCells.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientWidth = rect.width || window.innerWidth || 390;
    const clientHeight = rect.height || window.innerHeight || 844;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    currentCells.forEach(c => {
      const { x, y } = hexToPixel(c, hexRadius);
      minX = Math.min(minX, x - hexRadius);
      maxX = Math.max(maxX, x + hexRadius);
      minY = Math.min(minY, y - hexRadius);
      maxY = Math.max(maxY, y + hexRadius);
    });

    const gridWidth = maxX - minX;
    const gridHeight = maxY - minY;
    const gridCenterX = (minX + maxX) / 2;
    const gridCenterY = (minY + maxY) / 2;

    const availableWidth = clientWidth * 0.88;
    const availableHeight = (clientHeight - 200) * 0.88;

    const scaleX = availableWidth / Math.max(100, gridWidth);
    const scaleY = availableHeight / Math.max(100, gridHeight);
    const scale = Math.min(1.3, Math.max(0.4, Math.min(scaleX, scaleY)));

    const verticalCenterTarget = 70 + (clientHeight - 200) / 2;

    setTransform({
      x: clientWidth / 2 - gridCenterX * scale,
      y: verticalCenterTarget - gridCenterY * scale,
      k: scale,
    });
  }, []);

  // Camera only resets on mount or when explicit resetTrigger is fired
  useEffect(() => {
    centerCamera();
  }, [centerCamera, resetTrigger]);

  // Touch and Drag State
  const dragRef = useRef<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialTransformX: number;
    initialTransformY: number;
    distanceMoved: number;
    initialPinchDistance: number;
    initialScale: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialTransformX: 0,
    initialTransformY: 0,
    distanceMoved: 0,
    initialPinchDistance: 0,
    initialScale: 1,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.initialTransformX = transform.x;
    dragRef.current.initialTransformY = transform.y;
    dragRef.current.distanceMoved = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.distanceMoved = Math.hypot(dx, dy);

    setTransform(prev => ({
      ...prev,
      x: dragRef.current.initialTransformX + dx,
      y: dragRef.current.initialTransformY + dy,
    }));
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
  };

  // Native wheel event listener to allow preventDefault without passive listener violation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTransform(prev => {
        const nextK = Math.min(2.5, Math.max(0.35, prev.k * zoomFactor));
        return {
          x: mouseX - ((mouseX - prev.x) * nextK) / prev.k,
          y: mouseY - ((mouseY - prev.y) * nextK) / prev.k,
          k: nextK,
        };
      });
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      dragRef.current.initialPinchDistance = dist;
      dragRef.current.initialScale = transform.k;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && dragRef.current.initialPinchDistance > 0) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const ratio = dist / dragRef.current.initialPinchDistance;
      const newK = Math.min(2.5, Math.max(0.35, dragRef.current.initialScale * ratio));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

        setTransform(prev => ({
          x: midX - ((midX - prev.x) * newK) / prev.k,
          y: midY - ((midY - prev.y) * newK) / prev.k,
          k: newK,
        }));
      }
    }
  };

  // Node Click / Tap handler
  const handleCellClick = (cell: HexCell, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dragRef.current.distanceMoved > 8) return;
    if (!isHumanTurn) return;

    if (fogOfWarEnabled && !cell.revealed) return;

    // If clicking an owned friendly cell: select it (or toggle off)
    if (cell.owner === 0) {
      if (selectedCell && selectedCell.id === cell.id) {
        soundFx.playClick();
        onSelectCell(null);
      } else {
        soundFx.playSelect();
        onSelectCell(cell);
      }
      return;
    }

    // If clicking an adjacent enemy or neutral attack target
    if (selectedCell && areHexesAdjacent(selectedCell, cell) && selectedCell.units > 1 && cell.owner !== selectedCell.owner) {
      onExecuteAction(cell);
      return;
    }

    // Deselect when clicking non-adjacent neutral/enemy
    onSelectCell(null);
  };

  // Direct reinforcement button on cell
  const handleDirectReinforce = (cell: HexCell, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isHumanTurn || reinforcementPool <= 0) return;
    const check = canReinforceCell(cell, 0, reinforcementPool);
    if (check.valid) {
      soundFx.playCapture();
      onReinforceCell(cell);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="relative flex-1 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
    >
      <svg
        ref={svgRef}
        className="w-full h-full block"
        style={{ pointerEvents: 'auto' }}
      >
        <defs>
          <marker
            id="arrow-attack"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#4ade80' : '#15803d'} />
          </marker>

          <marker
            id="arrow-overclock"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
          </marker>

          <marker
            id="arrow-blocked"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <circle cx="5" cy="5" r="4" fill="#ef4444" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Hex Cells */}
          {cells.map(cell => {
            const { x, y } = hexToPixel(cell, hexRadius);
            const isSelected = selectedCellId === cell.id;
            const isTarget = targetOptions.some(opt => opt.target.id === cell.id);
            const isFog = fogOfWarEnabled && !cell.revealed;
            const canBeReinforced = cell.owner === 0 && reinforcementPool > 0 && cell.units < MAX_CELL_UNITS && cell.burnedOutTurns === 0;

            const fillColor = isFog
              ? isDark ? '#0d130e' : '#d1cbbd'
              : getPlayerBg(cell.owner, theme);
            const strokeColor = isSelected
              ? isDark ? '#4ade80' : '#15803d'
              : isFog
              ? isDark ? '#1a291e' : '#b5aea0'
              : getPlayerColor(cell.owner, theme);

            const polygonPoints = getHexPolygonPoints(x, y, hexRadius - 1.5);

            return (
              <g
                key={cell.id}
                onClick={e => handleCellClick(cell, e)}
                className="cursor-pointer transition-transform duration-100"
              >
                {/* Hexagon Body */}
                <polygon
                  points={polygonPoints}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 3.5 : isTarget ? 2.5 : 1.5}
                  strokeDasharray={isTarget ? '4 2' : undefined}
                  className="transition-colors duration-150"
                />

                {/* EM Storm Overlay */}
                {cell.stormActive && !isFog && (
                  <g>
                    <polygon
                      points={polygonPoints}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      className="animate-pulse"
                    />
                    <text
                      x={x}
                      y={y - 18}
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      [EM STORM]
                    </text>
                  </g>
                )}

                {/* Burnout Indicator */}
                {cell.burnedOutTurns > 0 && !isFog && (
                  <text
                    x={x}
                    y={y + 24}
                    textAnchor="middle"
                    fill="#f59e0b"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    BURNOUT:{cell.burnedOutTurns}T
                  </text>
                )}

                {/* Fog of War indicator */}
                {isFog ? (
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fill={isDark ? '#274b33' : '#8c8577'}
                    fontSize="13"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    [?]
                  </text>
                ) : (
                  <g>
                    {/* Unit count badge */}
                    <circle
                      cx={x}
                      cy={y}
                      r={14}
                      fill={isDark ? '#060b08' : '#ffffff'}
                      stroke={strokeColor}
                      strokeWidth={1.5}
                    />
                    <text
                      x={x}
                      y={y + 4.5}
                      textAnchor="middle"
                      fill={strokeColor}
                      fontSize="14"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {cell.units}
                    </text>
                  </g>
                )}

                {/* Direct Reinforcement Badge on Hex (+1) when pool > 0 */}
                {canBeReinforced && (
                  <g
                    onClick={e => handleDirectReinforce(cell, e)}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx={x + 18}
                      cy={y - 18}
                      r={9}
                      fill={isDark ? '#065f46' : '#10b981'}
                      stroke="#34d399"
                      strokeWidth={1.2}
                    />
                    <text
                      x={x + 18}
                      y={y - 15}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      +
                    </text>
                  </g>
                )}

                {/* Coordinates */}
                {!isFog && (
                  <text
                    x={x}
                    y={y + (cell.burnedOutTurns > 0 ? 33 : 23)}
                    textAnchor="middle"
                    fill={isDark ? '#10b981' : '#6b7280'}
                    opacity={0.4}
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {cell.q},{cell.r}
                  </text>
                )}
              </g>
            );
          })}

          {/* Dynamic Interactive Attack Arrows */}
          {targetOptions.map(({ target, isStorm, p1, p2, angle }) => {
            const startDist = 24;
            const endDist = 28;
            const sx = p1.x + Math.cos(angle) * startDist;
            const sy = p1.y + Math.sin(angle) * startDist;
            const ex = p2.x - Math.cos(angle) * endDist;
            const ey = p2.y - Math.sin(angle) * endDist;

            const midX = (sx + ex) / 2;
            const midY = (sy + ey) / 2;

            if (isStorm) {
              return (
                <g
                  key={`arrow-${target.id}`}
                  onClick={e => {
                    e.stopPropagation();
                    soundFx.playLoss();
                    onExecuteAction(target);
                  }}
                  className="cursor-not-allowed group"
                >
                  <line
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrow-blocked)"
                  />
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-38"
                      y="-9"
                      width="76"
                      height="18"
                      fill={isDark ? '#180707' : '#fee2e2'}
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      rx="2"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#ef4444"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      [BLOCKED]
                    </text>
                  </g>
                </g>
              );
            }

            const arrowColor = overclockActive
              ? '#f59e0b'
              : isDark
              ? '#4ade80'
              : '#15803d';

            const markerId = overclockActive
              ? 'url(#arrow-overclock)'
              : 'url(#arrow-attack)';

            return (
              <g
                key={`arrow-${target.id}`}
                onClick={e => {
                  e.stopPropagation();
                  onExecuteAction(target);
                }}
                className="cursor-pointer group hover:opacity-100 transition-opacity"
              >
                <line
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke="transparent"
                  strokeWidth="24"
                />
                <line
                  x1={sx}
                  y1={sy}
                  x2={ex}
                  y2={ey}
                  stroke={arrowColor}
                  strokeWidth={overclockActive ? '3.5' : '2.5'}
                  markerEnd={markerId}
                  className="animate-pulse"
                />
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-24"
                    y="-8"
                    width="48"
                    height="16"
                    fill={isDark ? '#060b08' : '#ffffff'}
                    stroke={arrowColor}
                    strokeWidth="1.2"
                    rx="2"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={arrowColor}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {overclockActive ? '+OC' : 'ASSAULT'}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
