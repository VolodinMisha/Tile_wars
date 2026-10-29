import React from 'react';
import {
  HexCell,
  Theme,
  Language,
  CellOwner,
  GameLogEntry,
  GameSettings,
  TurnPhase,
} from '../game/types';
import { t } from '../game/i18n';
import { PLAYERS_INFO, getPlayerColor } from '../game/constants';
import { soundFx } from '../game/audio';
import { MAX_CELL_UNITS, canReinforceCell } from '../game/rules';
import { PWAInstallButton } from './PWAInstallButton';

interface TacticalHUDProps {
  turn: number;
  activePlayer: CellOwner;
  isHumanTurn: boolean;
  turnPhase: TurnPhase;
  cells: HexCell[];
  selectedCell: HexCell | null;
  overclockActive: boolean;
  reinforcementPool: number;
  onToggleOverclock: () => void;
  onFinishAttacks: () => void;
  onAutoDeployReinforcements: () => void;
  onEndTurn: () => void;
  onDeselect: () => void;
  onReinforceCell: (cell: HexCell) => void;
  onResetCamera: () => void;
  onAbortToMenu: () => void;
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  logs: GameLogEntry[];
  gameState: 'in_progress' | 'victory' | 'defeat';
  onRestartMatch: () => void;
  onNextMission?: () => void;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  turn,
  activePlayer,
  isHumanTurn,
  turnPhase,
  cells,
  selectedCell,
  overclockActive,
  reinforcementPool,
  onToggleOverclock,
  onFinishAttacks,
  onAutoDeployReinforcements,
  onEndTurn,
  onDeselect,
  onReinforceCell,
  onResetCamera,
  onAbortToMenu,
  settings,
  updateSettings,
  logs,
  gameState,
  onRestartMatch,
  onNextMission,
}) => {
  const isDark = settings.theme === 'dark';
  const lang = settings.language;
  const isCampaign = settings.gameType === 'campaign';

  // Calculate territory and unit stats
  const totalCells = cells.length;
  const humanCells = cells.filter(c => c.owner === 0);
  const humanTerritoryPercent = Math.round((humanCells.length / Math.max(1, totalCells)) * 100);
  const humanTotalUnits = humanCells.reduce((sum, c) => sum + c.units, 0);

  const borderCol = isDark ? 'border-[#1b4329]' : 'border-[#9ca3af]';
  const bgBar = isDark ? 'bg-[#08130b]/95' : 'bg-[#e7e2d5]/95';
  const activeColor = getPlayerColor(activePlayer, settings.theme);

  const activePlayerName = activePlayer === 0
    ? t(lang, 'player_human')
    : t(lang, PLAYERS_INFO[activePlayer]?.nameKey || 'hud_bot');

  const toggleSound = () => {
    soundFx.playClick();
    const next = !settings.soundEnabled;
    soundFx.enabled = next;
    updateSettings({ soundEnabled: next });
  };

  const toggleTheme = () => {
    soundFx.playClick();
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const canReinforceSelected = selectedCell && canReinforceCell(selectedCell, 0, reinforcementPool).valid;

  return (
    <div className="flex flex-col justify-between w-full h-full pointer-events-none">
      {/* TOP COMMAND CLUSTER */}
      <header className={`pointer-events-auto border-b ${borderCol} ${bgBar} px-3 py-2 select-none shadow-md`}>
        <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto">
          {/* Cycle, Mission & Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 border border-current">
              {t(lang, 'hud_turn')}: {turn}
            </span>

            {isCampaign && (
              <span className="font-mono text-xs font-bold px-2 py-0.5 border border-amber-500 text-amber-400">
                {t(lang, 'campaign_level_prefix')} {settings.selectedCampaignLevel}/20
              </span>
            )}

            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
                style={{ backgroundColor: activeColor }}
              />
              <span className="font-bold hidden sm:inline" style={{ color: activeColor }}>
                {activePlayerName}
              </span>
              {isHumanTurn ? (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 border ${
                    turnPhase === 'attack'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-emerald-400 bg-emerald-500/20 text-emerald-300 animate-pulse'
                  }`}
                >
                  {turnPhase === 'attack'
                    ? t(lang, 'hud_phase_attack')
                    : t(lang, 'hud_phase_reinforce')}
                </span>
              ) : (
                <span className="text-[11px] opacity-75">
                  [{t(lang, 'hud_enemy_turn')}]
                </span>
              )}
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={onResetCamera}
              className={`px-2 py-1 border cursor-pointer hover:opacity-80 ${borderCol}`}
              title={t(lang, 'hud_reset_camera')}
            >
              {t(lang, 'hud_reset_camera')}
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className={`px-2 py-1 border cursor-pointer hover:opacity-80 ${borderCol}`}
            >
              {settings.soundEnabled ? 'SND:ON' : 'SND:OFF'}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`px-2 py-1 border cursor-pointer hover:opacity-80 ${borderCol}`}
            >
              {isDark ? 'CRT:DARK' : 'DOC:LIGHT'}
            </button>

            <button
              type="button"
              onClick={onAbortToMenu}
              className="px-2 py-1 border cursor-pointer hover:bg-red-900/20 text-red-500 border-red-500/50"
            >
              ABORT
            </button>

            <PWAInstallButton language={lang} theme={settings.theme} compact />
          </div>
        </div>

        {/* Reinforcements & Territory Status Bar */}
        <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto mt-2 pt-1.5 border-t border-current/20 text-[11px] font-mono flex-wrap">
          {/* Reinforcement Points Pool (Equal to exact owned cells count) */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold opacity-80">{t(lang, 'hud_reinforcements')}:</span>
            <span
              className={`font-bold px-2 py-0.5 border ${
                reinforcementPool > 0
                  ? isDark
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 animate-pulse'
                    : 'border-emerald-700 bg-emerald-100 text-emerald-800'
                  : 'border-current/40 opacity-60'
              }`}
            >
              {reinforcementPool} PTS {reinforcementPool > 0 ? `(${reinforcementPool} NODES)` : '[DEPLOYED]'}
            </span>
          </div>

          {/* Territory & Fleet */}
          <div className="flex items-center gap-2">
            <span>
              {t(lang, 'hud_nodes')}: {humanCells.length}/{totalCells} ({humanTerritoryPercent}%)
            </span>
            <div className={`w-14 sm:w-20 h-2 border ${borderCol} overflow-hidden bg-black/20`}>
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${humanTerritoryPercent}%` }}
              />
            </div>
            <span className="font-bold">
              {t(lang, 'hud_forces')}: {humanTotalUnits}
            </span>
          </div>
        </div>
      </header>

      {/* IN-GAME DEBRIEF PANEL (Diegetic readout when Victory/Defeat, NOT a blocking popup!) */}
      {gameState !== 'in_progress' && (
        <section
          aria-label="Mission Debrief"
          className={`pointer-events-auto max-w-lg mx-auto w-full m-3 border-2 p-4 select-none shadow-2xl backdrop-blur-sm ${bgBar} ${
            gameState === 'victory'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-red-500 text-red-400'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current pb-2 mb-3">
            <div className="font-mono font-bold tracking-widest text-sm sm:text-base">
              {gameState === 'victory' ? t(lang, 'debrief_victory') : t(lang, 'debrief_defeat')}
            </div>
            <span className="text-xs px-2 py-0.5 border border-current animate-pulse">
              {gameState === 'victory' ? 'COMMENDATION' : 'FAILURE'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono my-3 text-xs">
            <div className="p-2 border border-current/40">
              <div className="opacity-70 text-[10px]">{t(lang, 'debrief_turn_count')}</div>
              <div className="text-base font-bold mt-1">{turn}</div>
            </div>
            <div className="p-2 border border-current/40">
              <div className="opacity-70 text-[10px]">{t(lang, 'debrief_nodes_controlled')}</div>
              <div className="text-base font-bold mt-1">{humanTerritoryPercent}%</div>
            </div>
            <div className="p-2 border border-current/40">
              <div className="opacity-70 text-[10px]">{t(lang, 'debrief_forces_standing')}</div>
              <div className="text-base font-bold mt-1">{humanTotalUnits}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 font-mono text-xs flex-wrap">
            {isCampaign && gameState === 'victory' && onNextMission && settings.selectedCampaignLevel < 20 && (
              <button
                type="button"
                onClick={onNextMission}
                className="flex-1 py-2.5 border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 font-bold cursor-pointer transition-colors"
              >
                {t(lang, 'btn_next_mission')}
              </button>
            )}
            <button
              type="button"
              onClick={onRestartMatch}
              className="flex-1 py-2.5 border-2 border-current bg-emerald-500/10 hover:bg-emerald-500/20 font-bold cursor-pointer transition-colors"
            >
              {t(lang, 'btn_play_again')}
            </button>
            <button
              type="button"
              onClick={onAbortToMenu}
              className="px-4 py-2.5 border border-current hover:bg-current/10 font-bold cursor-pointer transition-colors"
            >
              {t(lang, 'btn_return_menu')}
            </button>
          </div>
        </section>
      )}

      {/* BOTTOM COMMAND BAR & TERMINAL LOGS */}
      <footer className={`pointer-events-auto border-t ${borderCol} ${bgBar} px-3 py-2 select-none`}>
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Tactical Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Selected cell status & Reinforce CTA */}
            <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
              {selectedCell ? (
                <>
                  <span className="font-bold border border-current px-2 py-1">
                    SECTOR [{selectedCell.q},{selectedCell.r}] • GARRISON: {selectedCell.units}
                  </span>

                  {/* Manual Reinforce button for selected cell */}
                  {selectedCell.owner === 0 && (
                    <button
                      type="button"
                      disabled={!canReinforceSelected}
                      onClick={() => onReinforceCell(selectedCell)}
                      className={`px-2.5 py-1 border font-bold cursor-pointer transition-colors ${
                        canReinforceSelected
                          ? isDark
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            : 'border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'border-zinc-600 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      +1 REINFORCE ({reinforcementPool} PTS)
                    </button>
                  )}

                  {selectedCell.burnedOutTurns > 0 && (
                    <span className="text-amber-500 font-bold">
                      [BURNOUT: {selectedCell.burnedOutTurns}T]
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={onDeselect}
                    className={`px-2 py-1 border cursor-pointer hover:opacity-75 ${borderCol}`}
                  >
                    {t(lang, 'hud_cancel_sel')}
                  </button>
                </>
              ) : (
                <span className="text-[11px] opacity-75">
                  {turnPhase === 'reinforce'
                    ? t(lang, 'hud_reinforce_hint')
                    : t(lang, 'hud_attack_hint')}
                </span>
              )}
            </div>

            {/* Turn Phase Action Controls */}
            <div className="flex items-center gap-2 font-mono">
              {/* Overclock toggle switch - active during attack phase */}
              {turnPhase === 'attack' && (
                <button
                  type="button"
                  onClick={onToggleOverclock}
                  className={`px-2.5 py-1.5 border text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
                    overclockActive
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400 animate-pulse'
                      : `${borderCol} opacity-80 hover:opacity-100`
                  }`}
                >
                  <span>{overclockActive ? '[*]' : '[ ]'}</span>
                  <span>{overclockActive ? t(lang, 'hud_overclock_active') : t(lang, 'hud_overclock_inactive')}</span>
                </button>
              )}

              {/* Phase 1: Finish Attacks Button OR Phase 2: Reinforcement Counter Badge */}
              {isHumanTurn && gameState === 'in_progress' ? (
                turnPhase === 'attack' ? (
                  <button
                    type="button"
                    onClick={onFinishAttacks}
                    className={`px-4 py-2 border-2 text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 ${
                      isDark
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                        : 'border-amber-700 bg-amber-500 text-black hover:bg-amber-600'
                    }`}
                  >
                    <span>[ {t(lang, 'hud_finish_attacks')} ]</span>
                    <span>&gt;&gt;</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onAutoDeployReinforcements}
                    className={`px-4 py-2 border-2 text-xs font-bold cursor-pointer transition-all animate-pulse flex items-center gap-2 ${
                      isDark
                        ? 'border-emerald-400 bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                        : 'border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                    }`}
                    title={t(lang, 'hud_reinforce_hint')}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span>
                      {t(lang, 'hud_deploy_reinforcements').replace('{count}', String(reinforcementPool))}
                    </span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 border-2 border-zinc-500 text-xs font-bold opacity-40 cursor-not-allowed"
                >
                  {t(lang, 'hud_enemy_turn')}
                </button>
              )}
            </div>
          </div>

          {/* Scrolling Terminal Combat Log Feed */}
          <div
            className={`border ${borderCol} bg-black/40 p-1.5 font-mono text-[11px] h-14 overflow-y-auto flex flex-col justify-end space-y-0.5`}
          >
            {logs.slice(-3).map(entry => (
              <div key={entry.id} className="flex items-start gap-1 leading-tight">
                <span className="opacity-50">[{entry.timestamp}]</span>
                <span className={`font-semibold ${
                  entry.type === 'alert' || entry.type === 'storm'
                    ? 'text-red-400'
                    : entry.type === 'attack'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {lang === 'ua' ? entry.textUa : entry.textEn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
