export type Language = 'en' | 'ua';

export type Theme = 'dark' | 'light';

export type MapSize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export type GameSpeed = 'tactical' | 'turbo';

export type BotDifficulty = 'easy' | 'medium' | 'hard' | 'pro';

export type GameType = 'campaign' | 'custom';

export type TurnPhase = 'attack' | 'reinforce';

export interface CampaignLevel {
  level: number;
  nameEn: string;
  nameUa: string;
  briefingEn: string;
  briefingUa: string;
  mapSize: MapSize;
  botCount: number;
  botDifficulty: BotDifficulty;
  modes: GameModes;
}

export interface GameModes {
  fogOfWar: boolean;
  symmetricMap: boolean;
  alliancesTransfer: boolean;
  swarmStart: boolean;
}

export interface GameSettings {
  language: Language;
  theme: Theme;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  mapSize: MapSize;
  gameSpeed: GameSpeed;
  botCount: number; // 1 to 4
  botDifficulty: BotDifficulty;
  modes: GameModes;
  gameType: GameType;
  selectedCampaignLevel: number;
}

export interface HexCoord {
  q: number;
  r: number;
}

export type CellOwner = 0 | 1 | 2 | 3 | 4 | -1; // 0 = Player, 1-4 = Bots, -1 = Neutral

export interface HexCell {
  id: string;
  q: number;
  r: number;
  owner: CellOwner;
  units: number;
  stormActive: boolean;
  stormTurnsRemaining: number;
  burnedOutTurns: number; // >0 means no unit production due to failed overclock
  revealed: boolean; // For Fog of War
}

export interface PlayerInfo {
  id: CellOwner;
  nameKey: string;
  isHuman: boolean;
  colorDark: string;
  colorLight: string;
  bgDark: string;
  bgLight: string;
  eliminated: boolean;
}

export interface CombatResult {
  success: boolean;
  attackerUnitsRemaining: number;
  defenderUnitsRemaining: number;
  overclockUsed: boolean;
  overclockBackfired: boolean;
  attackerLosses: number;
  defenderLosses: number;
  captured: boolean;
}

export interface AttackTargetOption {
  targetHex: HexCell;
  isStormBlocked: boolean;
  isAlly: boolean;
  distance: number;
  arrowAngle: number;
}

export interface GameLogEntry {
  id: string;
  turn: number;
  timestamp: string;
  type: 'attack' | 'transfer' | 'storm' | 'growth' | 'alert' | 'elimination';
  textEn: string;
  textUa: string;
  sourceOwner?: CellOwner;
  targetOwner?: CellOwner;
}
