import { PlayerInfo, CellOwner, Theme } from './types';

export const PLAYERS_INFO: Record<CellOwner, PlayerInfo> = {
  0: {
    id: 0,
    nameKey: 'player_human',
    isHuman: true,
    colorDark: '#22c55e', // Phosphor Green
    colorLight: '#15803d',
    bgDark: '#052e16',
    bgLight: '#dcfce7',
    eliminated: false,
  },
  1: {
    id: 1,
    nameKey: 'player_bot_1',
    isHuman: false,
    colorDark: '#f59e0b', // Amber
    colorLight: '#b45309',
    bgDark: '#451a03',
    bgLight: '#fef3c7',
    eliminated: false,
  },
  2: {
    id: 2,
    nameKey: 'player_bot_2',
    isHuman: false,
    colorDark: '#ef4444', // Crimson
    colorLight: '#b91c1c',
    bgDark: '#450a0a',
    bgLight: '#fee2e2',
    eliminated: false,
  },
  3: {
    id: 3,
    nameKey: 'player_bot_3',
    isHuman: false,
    colorDark: '#a855f7', // Violet
    colorLight: '#6b21a8',
    bgDark: '#3b0764',
    bgLight: '#f3e8ff',
    eliminated: false,
  },
  4: {
    id: 4,
    nameKey: 'player_bot_4',
    isHuman: false,
    colorDark: '#06b6d4', // Cyan
    colorLight: '#0e7490',
    bgDark: '#083344',
    bgLight: '#cffafe',
    eliminated: false,
  },
  [-1]: {
    id: -1,
    nameKey: 'player_neutral',
    isHuman: false,
    colorDark: '#71717a',
    colorLight: '#6b7280',
    bgDark: '#18181b',
    bgLight: '#e5e7eb',
    eliminated: false,
  },
};

export function getPlayerColor(owner: CellOwner, theme: Theme): string {
  const info = PLAYERS_INFO[owner] || PLAYERS_INFO[-1];
  return theme === 'dark' ? info.colorDark : info.colorLight;
}

export function getPlayerBg(owner: CellOwner, theme: Theme): string {
  const info = PLAYERS_INFO[owner] || PLAYERS_INFO[-1];
  return theme === 'dark' ? info.bgDark : info.bgLight;
}
