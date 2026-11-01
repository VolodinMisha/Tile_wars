/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GameSettings,
  HexCell,
  CellOwner,
  GameLogEntry,
  TurnPhase,
} from './game/types';
import { generateBoardCells } from './game/hex';
import {
  resolveCombat,
  validateMove,
  updateFogOfWar,
  calculateReinforcements,
  applyManualReinforcement,
  applyMaxManualReinforcement,
  distributeReinforcements,
  distributeFrontlineReinforcements,
  tickRoundHazards,
  checkAndExecuteEmergencyTransfer,
  checkGameState,
  getCellMaxUnits,
  liftStormIfLastTarget,
} from './game/rules';
import { CAMPAIGN_LEVELS, getStaticCampaignMap } from './game/campaign';
import { computeBotMoves } from './game/bot';
import { soundFx } from './game/audio';
import { TerminalOverlay } from './components/TerminalOverlay';
import { PreGameMenu } from './components/PreGameMenu';
import { GameBoard } from './components/GameBoard';
import { TacticalHUD } from './components/TacticalHUD';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY_CAMPAIGN = 'tilewars_campaign_unlocked';

const DEFAULT_SETTINGS: GameSettings = {
  language: 'ua', // Default to Ukrainian as requested in chat
  theme: 'dark',
  soundEnabled: true,
  vibrationEnabled: true,
  mapSize: 'M',
  gameSpeed: 'tactical',
  botCount: 2,
  botDifficulty: 'medium',
  modes: {
    fogOfWar: false,
    symmetricMap: false,
    alliancesTransfer: true,
    swarmStart: false,
  },
  gameType: 'campaign',
  selectedCampaignLevel: 1,
};

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'playing'>('menu');
  const [menuStep, setMenuStep] = useState<number>(1);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [campaignUnlocked, setCampaignUnlocked] = useState<number>(1);

  // In-Game State
  const [cells, setCells] = useState<HexCell[]>([]);
  const [turn, setTurn] = useState<number>(1);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('attack');
  const [activePlayer, setActivePlayer] = useState<CellOwner>(0);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [overclockActive, setOverclockActive] = useState<boolean>(false);
  const [reinforcementPool, setReinforcementPool] = useState<number>(0);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [gameState, setGameState] = useState<'in_progress' | 'victory' | 'defeat'>('in_progress');
  const [resetCameraTrigger, setResetCameraTrigger] = useState<number>(0);

  // Load campaign unlocked state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CAMPAIGN);
        if (saved) {
          const parsed = parseInt(saved, 10);
          if (parsed >= 1 && parsed <= 20) {
            setCampaignUnlocked(parsed);
          }
        }
      } catch {}
    }
  }, []);

  // Sync body data-state attribute
  useEffect(() => {
    document.body.dataset.state = screen;
  }, [screen]);

  // Handle URL autostart (?autostart=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        startMatch(DEFAULT_SETTINGS);
      }
    }
  }, []);

  const addLog = useCallback(
    (type: GameLogEntry['type'], textEn: string, textUa: string, sourceOwner?: CellOwner, targetOwner?: CellOwner) => {
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const entry: GameLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        turn,
        timestamp,
        type,
        textEn,
        textUa,
        sourceOwner,
        targetOwner,
      };
      setLogs(prev => [...prev.slice(-30), entry]);
    },
    [turn]
  );

  const updateSettings = (partial: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  // Start match (Campaign level or Custom game)
  const startMatch = (customSettings?: GameSettings, campaignLevelIndex?: number) => {
    const s = { ...(customSettings || settings) };

    if (s.gameType === 'campaign' || campaignLevelIndex !== undefined) {
      const targetLvlNum = campaignLevelIndex ?? s.selectedCampaignLevel;
      const lvlConfig = CAMPAIGN_LEVELS.find(l => l.level === targetLvlNum) || CAMPAIGN_LEVELS[0];
      s.mapSize = lvlConfig.mapSize;
      s.botCount = lvlConfig.botCount;
      s.botDifficulty = lvlConfig.botDifficulty;
      s.modes = { ...lvlConfig.modes };
      s.selectedCampaignLevel = lvlConfig.level;
    }

    const isCampaign = s.gameType === 'campaign' || campaignLevelIndex !== undefined;
    const initialCells = isCampaign
      ? getStaticCampaignMap(s.selectedCampaignLevel)
      : generateBoardCells(
          s.mapSize,
          s.botCount,
          s.modes.symmetricMap,
          s.modes.swarmStart
        );

    if (s.modes.fogOfWar) {
      updateFogOfWar(initialCells, 0);
    }

    // Initial reinforcement points for player
    const playerCellsCount = initialCells.filter(c => c.owner === 0).length;
    const initialPool = calculateReinforcements(playerCellsCount);

    setCells(initialCells);
    setTurn(1);
    setTurnPhase('attack');
    setActivePlayer(0);
    setSelectedCellId(null);
    setOverclockActive(false);
    setReinforcementPool(0);
    setGameState('in_progress');
    setSettings(s);
    setScreen('playing');
    setResetCameraTrigger(prev => prev + 1);

    const initMsgEn = s.gameType === 'campaign'
      ? `MISSION ${s.selectedCampaignLevel} DEPLOYED. PHASE 1: Attack enemy sectors. Click 'Finish Attacks' when done.`
      : `CUSTOM WARGAME INITIALIZED. PHASE 1: Attack enemy sectors. Click 'Finish Attacks' when done.`;
    const initMsgUa = s.gameType === 'campaign'
      ? `МІСІЮ ${s.selectedCampaignLevel} РОЗГОРНУТО. ФАЗА 1: Штурмуйте сектори ворога. Натисніть 'Закінчити атаку' після завершення.`
      : `КАСТОМНУ ГРУ ІНІЦІАЛІЗОВАНО. ФАЗА 1: Штурмуйте сектори ворога. Натисніть 'Закінчити атаку' після завершення.`;

    setLogs([
      {
        id: 'init-1',
        turn: 1,
        timestamp: '00:00:01',
        type: 'alert',
        textEn: initMsgEn,
        textUa: initMsgUa,
      },
    ]);

    soundFx.playClick();
  };

  // Selected cell object
  const selectedCell = cells.find(c => c.id === selectedCellId) || null;

  // Manual reinforcement handler
  const handleReinforceCell = (targetCell: HexCell) => {
    if (activePlayer !== 0 || reinforcementPool <= 0 || gameState !== 'in_progress') return;

    const res = applyManualReinforcement(targetCell, 0, reinforcementPool);
    if (res.success) {
      soundFx.playCapture();
      setReinforcementPool(res.newPool);
      setCells([...cells]);
      addLog(
        'growth',
        `Sector [${targetCell.q},${targetCell.r}] reinforced. Garrison increased to ${targetCell.units}. (${res.newPool} pts left)`,
        `Сектор [${targetCell.q},${targetCell.r}] підсилено. Гарнізон збільшено до ${targetCell.units}. (Залишилось ${res.newPool} очок)`
      );
    } else {
      soundFx.playLoss();
    }
  };

  // Hold-to-Max / One-tap Max Reinforcement handler
  const handleMaxReinforceCell = (targetCell: HexCell) => {
    if (activePlayer !== 0 || reinforcementPool <= 0 || gameState !== 'in_progress') return;

    const res = applyMaxManualReinforcement(targetCell, 0, reinforcementPool);
    if (res.success) {
      soundFx.playCapture();
      setReinforcementPool(res.newPool);
      setCells([...cells]);
      addLog(
        'growth',
        `Sector [${targetCell.q},${targetCell.r}] fortified (+${res.added} units, garrison now ${targetCell.units}/${getCellMaxUnits(targetCell)}). (${res.newPool} pts left)`,
        `Сектор [${targetCell.q},${targetCell.r}] укріплено (+${res.added} од., гарнізон тепер ${targetCell.units}/${getCellMaxUnits(targetCell)}). (Залишилось ${res.newPool} очок)`
      );
    } else {
      soundFx.playLoss();
    }
  };

  // Phase 1 to Phase 2: Finish Attacks and calculate Reinforcement Points based on controlled nodes
  const handleFinishAttacks = () => {
    if (activePlayer !== 0 || gameState !== 'in_progress') return;
    soundFx.playClick();
    setSelectedCellId(null);
    setOverclockActive(false);

    // Calculate reinforcement points based on player's currently owned tiles
    const playerControlledCount = cells.filter(c => c.owner === 0).length;
    const points = calculateReinforcements(playerControlledCount);
    setReinforcementPool(points);
    setTurnPhase('reinforce');

    addLog(
      'growth',
      `PHASE 2 (REINFORCEMENTS): +${points} reinforcement points ready for frontline deployment (${playerControlledCount} nodes controlled).`,
      `ФАЗА 2 (ПІДКРІПЛЕННЯ): +${points} очок підкріплень готові до розподілу по лінії фронту (контролюється ${playerControlledCount} вузлів).`
    );
  };

  // Phase 2: Automatically deploy reinforcements evenly along frontline tiles, then advance to AI Bot turns
  const handleAutoDeployReinforcements = () => {
    if (activePlayer !== 0 || gameState !== 'in_progress') return;
    soundFx.playClick();
    setSelectedCellId(null);

    let activeCells = [...cells];
    const poolToDeploy = reinforcementPool;

    if (poolToDeploy > 0) {
      const deployed = distributeFrontlineReinforcements(activeCells, 0, poolToDeploy);
      soundFx.playCapture();
      setReinforcementPool(0);
      setCells([...activeCells]);
      addLog(
        'growth',
        `FRONTLINE REINFORCED: +${deployed} units deployed across front-line tactical positions. Initiating adversary phase.`,
        `ЛІНІЮ ФРОНТУ ПІДСИЛЕНО: +${deployed} одиниць розподілено по передових позиціях. Передача ходу супротивнику.`
      );
    }

    runBotTurns(activeCells);
  };

  // Toggle Overclock
  const handleToggleOverclock = () => {
    const next = !overclockActive;
    if (next) {
      soundFx.playOverclockCharge();
    } else {
      soundFx.playClick();
    }
    setOverclockActive(next);
  };

  // Execute Human Player troop movement/attack (free actions based on available forces)
  const handleExecuteAction = (target: HexCell) => {
    if (!selectedCell || activePlayer !== 0 || gameState !== 'in_progress') return;

    // Validate move
    const validation = validateMove(selectedCell, target);
    if (!validation.valid) {
      if (validation.reason === 'storm_blocked') {
        soundFx.playStormAlert();
        addLog(
          'storm',
          `[ERR: EM STORM] Sector [${target.q},${target.r}] is blocked by electromagnetic disturbance.`,
          `[ПОМИЛКА: ЕМ БУРЯ] Сектор [${target.q},${target.r}] заблоковано електромагнітною бурею.`
        );
      } else {
        soundFx.playLoss();
      }
      return;
    }

    // Enemy Assault
    soundFx.playAttack();
    const targetMax = getCellMaxUnits(target);
    const result = resolveCombat(selectedCell.units, target.units, overclockActive, undefined, targetMax);

    if (result.success) {
      soundFx.playCapture();
      selectedCell.units = result.attackerUnitsRemaining;
      target.units = result.defenderUnitsRemaining;
      target.owner = selectedCell.owner;

      addLog(
        'attack',
        `SUCCESS: Sector [${target.q},${target.r}] captured! Defender wiped (-${result.defenderLosses}).`,
        `УСПІХ: Сектор [${target.q},${target.r}] захоплено! Ворога знищено (-${result.defenderLosses}).`
      );

      if (settings.modes.fogOfWar) {
        updateFogOfWar(cells, 0);
      }
    } else {
      soundFx.playLoss();
      selectedCell.units = result.attackerUnitsRemaining;
      target.units = result.defenderUnitsRemaining;

      if (result.overclockBackfired) {
        selectedCell.burnedOutTurns = 2;
        soundFx.playStormAlert();
        addLog(
          'alert',
          `CRITICAL BURNOUT: Overclock attack backfired at [${selectedCell.q},${selectedCell.r}]! Sector offline for 2 cycles.`,
          `КРИТИЧНЕ ВИГОРАННЯ: Атака з розгоном провалилася в [${selectedCell.q},${selectedCell.r}]! Сектор вимкнено на 2 цикли.`
        );
      } else {
        addLog(
          'attack',
          `REPULSED: Assault on [${target.q},${target.r}] failed. Sustained heavy casualties.`,
          `ВІДБИТО: Штурм сектора [${target.q},${target.r}] захлинувся. Зазнано важких втрат.`
        );
      }
    }

    // Ensure storms never block the last uncaptured cell
    liftStormIfLastTarget(cells);

    setCells([...cells]);
    setSelectedCellId(null);
    setOverclockActive(false);

    // Check game state immediately after attack
    const state = checkGameState(cells, 0);
    if (state !== 'in_progress') {
      setGameState(state);
      if (state === 'victory') {
        soundFx.playVictory();
        if (settings.gameType === 'campaign') {
          const nextLvl = settings.selectedCampaignLevel + 1;
          const newUnlocked = Math.max(campaignUnlocked, Math.min(20, nextLvl));
          setCampaignUnlocked(newUnlocked);
          try {
            localStorage.setItem(STORAGE_KEY_CAMPAIGN, newUnlocked.toString());
          } catch {}
        }
      } else {
        soundFx.playDefeat();
      }
    }
  };

  // Bot Turn Execution
  const runBotTurns = useCallback(async (currentCells: HexCell[]) => {
    let activeCells = [...currentCells];
    const totalBots = settings.botCount;
    const isTurbo = settings.gameSpeed === 'turbo';

    for (let botId = 1; botId <= totalBots; botId++) {
      const owner = botId as CellOwner;
      if (!activeCells.some(c => c.owner === owner)) continue;

      setActivePlayer(owner);

      // Bot distributes reinforcements automatically before moves based on difficulty
      distributeReinforcements(activeCells, owner, settings.botDifficulty);

      // Bot executes moves
      const botMoves = computeBotMoves(activeCells, owner, settings.botDifficulty);

      for (const move of botMoves) {
        if (!isTurbo) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        const origin = activeCells.find(c => c.id === move.origin.id);
        const target = activeCells.find(c => c.id === move.target.id);

        if (origin && target && origin.units > 1 && !target.stormActive && target.owner !== origin.owner) {
          const targetMax = getCellMaxUnits(target);
          const combat = resolveCombat(origin.units, target.units, move.overclock, undefined, targetMax);
            if (combat.success) {
              origin.units = combat.attackerUnitsRemaining;
              target.units = combat.defenderUnitsRemaining;
              target.owner = origin.owner;
              addLog(
                'attack',
                `AI Bot ${botId} assaulted and captured sector [${target.q},${target.r}].`,
                `ШІ Бот ${botId} штурмував та захопив сектор [${target.q},${target.r}].`
              );
            } else {
              origin.units = combat.attackerUnitsRemaining;
              target.units = combat.defenderUnitsRemaining;
              if (combat.overclockBackfired) {
                origin.burnedOutTurns = 2;
              }
            }
          activeCells = [...activeCells];
          setCells(activeCells);
        }
      }
    }

    liftStormIfLastTarget(activeCells);

    // End of round:
    // 1. Tick hazards & EM storms
    const spawnStorm = turn % 3 === 0;
    const { spawnedStormCoord, clearedCount } = tickRoundHazards(activeCells, turn, spawnStorm);

    if (spawnedStormCoord) {
      soundFx.playStormAlert();
      addLog(
        'storm',
        `WARNING: EM storm formed at sector [${spawnedStormCoord.q},${spawnedStormCoord.r}]. Movement blocked.`,
        `УВАГА: Електромагнітна буря утворилась у секторі [${spawnedStormCoord.q},${spawnedStormCoord.r}]. Рух заблоковано.`
      );
    }
    if (clearedCount > 0) {
      addLog(
        'storm',
        `RADAR CLEAR: Electromagnetic interference cleared across ${clearedCount} sectors.`,
        `РАДАР ЧИСТИЙ: Електромагнітні завади розсіялися у ${clearedCount} секторах.`
      );
    }

    // 2. Check Emergency Transfer Protocol (< 10% unit count)
    const emergency = checkAndExecuteEmergencyTransfer(activeCells, settings.modes.alliancesTransfer);
    if (emergency.transferred) {
      addLog(
        'alert',
        'EMERGENCY TRANSFER: Faction near defeat ceded isolated sector to adjacent faction.',
        'АВАРІЙНИЙ ПЕРЕХІД: Фракція на межі колапсу передала ізольований сектор сусідній фракції.'
      );
    }

    // 3. Update Fog of War
    if (settings.modes.fogOfWar) {
      updateFogOfWar(activeCells, 0);
    }

    // 4. Check Win / Loss
    const finalState = checkGameState(activeCells, 0);
    setGameState(finalState);
    if (finalState === 'victory') {
      soundFx.playVictory();
      if (settings.gameType === 'campaign') {
        const nextLvl = settings.selectedCampaignLevel + 1;
        const newUnlocked = Math.max(campaignUnlocked, Math.min(20, nextLvl));
        setCampaignUnlocked(newUnlocked);
        try {
          localStorage.setItem(STORAGE_KEY_CAMPAIGN, newUnlocked.toString());
        } catch {}
      }
    } else if (finalState === 'defeat') {
      soundFx.playDefeat();
    }

    const playerControlledCount = activeCells.filter(c => c.owner === 0).length;

    setCells([...activeCells]);
    setTurn(prev => prev + 1);
    setTurnPhase('attack'); // Reset to Phase 1: Attack for new cycle
    setReinforcementPool(0); // Reinforcements allocated when entering Phase 2
    setActivePlayer(0); // Return control to human player
    setSelectedCellId(null);
    setOverclockActive(false);

    addLog(
      'growth',
      `CYCLE ${turn + 1}: Human command phase initiated (${playerControlledCount} sectors held). Phase 1: Attack.`,
      `ЦИКЛ ${turn + 1}: Командний цикл гравця (${playerControlledCount} секторів під контролем). Фаза 1: Атака.`
    );
  }, [settings, turn, addLog, campaignUnlocked]);

  // Handle End Turn
  const handleEndTurn = () => {
    if (activePlayer !== 0 || gameState !== 'in_progress') return;

    soundFx.playClick();
    setSelectedCellId(null);
    setOverclockActive(false);

    // Auto-allocate any unspent points along frontline tiles
    let activeCells = [...cells];
    if (reinforcementPool > 0) {
      distributeFrontlineReinforcements(activeCells, 0, reinforcementPool);
      setReinforcementPool(0);
      setCells([...activeCells]);
    }

    // Hand over turn to bots
    runBotTurns(activeCells);
  };

  const handleNextMission = () => {
    soundFx.playClick();
    const nextLvl = Math.min(20, settings.selectedCampaignLevel + 1);
    startMatch({ ...settings, selectedCampaignLevel: nextLvl }, nextLvl);
  };

  return (
    <TerminalOverlay theme={settings.theme}>
      <OfflineIndicator language={settings.language} theme={settings.theme} />
      {screen === 'menu' ? (
        <PreGameMenu
          step={menuStep}
          setStep={setMenuStep}
          settings={settings}
          updateSettings={updateSettings}
          onDeploy={(levelIdx) => startMatch(undefined, levelIdx)}
          campaignUnlocked={campaignUnlocked}
        />
      ) : (
        <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
          {/* Main Board Viewport with Touch Pan/Zoom */}
          <div className="absolute inset-0 w-full h-full">
            <GameBoard
              cells={cells}
              selectedCellId={selectedCellId}
              onSelectCell={cell => setSelectedCellId(cell ? cell.id : null)}
              onExecuteAction={handleExecuteAction}
              onReinforceCell={handleReinforceCell}
              onMaxReinforceCell={handleMaxReinforceCell}
              theme={settings.theme}
              fogOfWarEnabled={settings.modes.fogOfWar}
              isHumanTurn={activePlayer === 0 && gameState === 'in_progress'}
              turnPhase={turnPhase}
              overclockActive={overclockActive}
              reinforcementPool={reinforcementPool}
              resetTrigger={resetCameraTrigger}
            />
          </div>

          {/* Tactical HUD Overlay (Perimeter Command Center, Zero Pop-up Modals) */}
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between">
            <TacticalHUD
              turn={turn}
              activePlayer={activePlayer}
              isHumanTurn={activePlayer === 0}
              turnPhase={turnPhase}
              cells={cells}
              selectedCell={selectedCell}
              overclockActive={overclockActive}
              reinforcementPool={reinforcementPool}
              onToggleOverclock={handleToggleOverclock}
              onFinishAttacks={handleFinishAttacks}
              onAutoDeployReinforcements={handleAutoDeployReinforcements}
              onEndTurn={handleEndTurn}
              onDeselect={() => setSelectedCellId(null)}
              onReinforceCell={handleReinforceCell}
              onMaxReinforceCell={handleMaxReinforceCell}
              onResetCamera={() => setResetCameraTrigger(prev => prev + 1)}
              onAbortToMenu={() => {
                soundFx.playClick();
                setScreen('menu');
              }}
              settings={settings}
              updateSettings={updateSettings}
              logs={logs}
              gameState={gameState}
              onRestartMatch={() => startMatch()}
              onNextMission={handleNextMission}
            />
          </div>
        </div>
      )}
    </TerminalOverlay>
  );
}
