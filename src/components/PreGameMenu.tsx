import React, { useEffect } from 'react';
import {
  GameSettings,
  Language,
  Theme,
  MapSize,
  GameSpeed,
  BotDifficulty,
  GameModes,
  GameType,
} from '../game/types';
import { CAMPAIGN_LEVELS } from '../game/campaign';
import { t } from '../game/i18n';
import { soundFx } from '../game/audio';

interface PreGameMenuProps {
  step: number;
  setStep: (step: number) => void;
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  onDeploy: (levelIndex?: number) => void;
  campaignUnlocked: number;
}

export const PreGameMenu: React.FC<PreGameMenuProps> = ({
  step,
  setStep,
  settings,
  updateSettings,
  onDeploy,
  campaignUnlocked,
}) => {
  const isDark = settings.theme === 'dark';
  const lang = settings.language;
  const isCampaign = settings.gameType === 'campaign';

  // Keyboard shortcut: Enter or Space advances or deploys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement) {
          return;
        }
        e.preventDefault();
        soundFx.playClick();
        if (step === 1) {
          setStep(2);
        } else if (step === 2 && isCampaign) {
          onDeploy(settings.selectedCampaignLevel);
        } else if (step < 6 && !isCampaign) {
          setStep(step + 1);
        } else if (step === 6) {
          onDeploy();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, setStep, onDeploy, isCampaign, settings.selectedCampaignLevel]);

  const toggleLanguage = (l: Language) => {
    soundFx.playClick();
    updateSettings({ language: l });
  };

  const toggleTheme = () => {
    soundFx.playClick();
    updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  const toggleSound = () => {
    soundFx.playClick();
    const next = !settings.soundEnabled;
    soundFx.enabled = next;
    updateSettings({ soundEnabled: next });
  };

  const toggleVibration = () => {
    soundFx.playClick();
    const next = !settings.vibrationEnabled;
    soundFx.vibrationEnabled = next;
    updateSettings({ vibrationEnabled: next });
  };

  const toggleMode = (key: keyof GameModes) => {
    soundFx.playClick();
    updateSettings({
      modes: {
        ...settings.modes,
        [key]: !settings.modes[key],
      },
    });
  };

  const selectGameType = (type: GameType) => {
    soundFx.playClick();
    updateSettings({ gameType: type });
    if (type === 'custom') {
      setStep(3); // Go to custom setup (Step 3: Map scale)
    }
  };

  // Border & accent styling classes based on theme
  const borderCol = isDark ? 'border-[#1b4329]' : 'border-[#9ca3af]';
  const activeBorder = isDark ? 'border-[#34d399]' : 'border-[#15803d]';
  const textPrimary = isDark ? 'text-[#34d399]' : 'text-[#141a12]';
  const textMuted = isDark ? 'text-[#10b981]/70' : 'text-[#4b5563]';
  const activeBtnBg = isDark ? 'bg-[#0f291e] text-[#4ade80]' : 'bg-[#dcfce7] text-[#14532d]';
  const idleBtnBg = isDark ? 'bg-[#09150d] hover:bg-[#0f2417]' : 'bg-[#e5e0d3] hover:bg-[#d8d2c2]';

  const selectedLevel = CAMPAIGN_LEVELS.find(l => l.level === settings.selectedCampaignLevel) || CAMPAIGN_LEVELS[0];

  return (
    <div className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full p-4 sm:p-6 select-none overflow-y-auto font-mono">
      {/* Terminal Header */}
      <div className={`border-b pb-3 mb-3 ${borderCol}`}>
        <div className="flex justify-between items-center text-xs opacity-75 mb-1">
          <span>SEC-COM // PROTOCOL MK-X</span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </div>
        <h1 className={`text-xl sm:text-2xl font-bold tracking-wider ${textPrimary}`}>
          {t(lang, 'app_title')}
        </h1>
        <p className={`text-xs tracking-widest uppercase mt-0.5 ${textMuted}`}>
          {t(lang, 'app_subtitle')}
        </p>

        {/* Quick Header Toggles */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-current/20 text-[11px]">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => toggleLanguage(lang === 'en' ? 'ua' : 'en')}
              className={`px-2 py-0.5 border cursor-pointer hover:opacity-80 ${borderCol}`}
            >
              LANG: {lang === 'en' ? 'EN' : 'UA'}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className={`px-2 py-0.5 border cursor-pointer hover:opacity-80 ${borderCol}`}
            >
              THEME: {isDark ? 'DARK' : 'LIGHT'}
            </button>
          </div>
          <button
            type="button"
            onClick={toggleSound}
            className={`px-2 py-0.5 border cursor-pointer hover:opacity-80 ${borderCol}`}
          >
            SND: {settings.soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Step Body */}
      <div className="flex-1 flex flex-col justify-center my-2">
        {/* STEP 1: Language & System Settings */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 border ${borderCol}`}>STEP 1 / 2</span>
              <span>{t(lang, 'menu_step_1')}</span>
            </div>

            {/* Language Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => toggleLanguage('en')}
                className={`p-3.5 border text-left cursor-pointer transition-colors ${
                  lang === 'en'
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>[ ENGLISH ]</span>
                  {lang === 'en' && <span className="text-xs">*ACTIVE*</span>}
                </div>
                <div className="text-xs mt-1 opacity-70">NATO Mil-Spec Protocol</div>
              </button>

              <button
                type="button"
                onClick={() => toggleLanguage('ua')}
                className={`p-3.5 border text-left cursor-pointer transition-colors ${
                  lang === 'ua'
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="text-sm font-bold flex items-center justify-between">
                  <span>[ УКРАЇНСЬКА ]</span>
                  {lang === 'ua' && <span className="text-xs">*АКТИВНО*</span>}
                </div>
                <div className="text-xs mt-1 opacity-70">Повна локалізація інтерфейсу</div>
              </button>
            </div>

            {/* System Settings (Theme, Audio, Vibration) */}
            <div className="space-y-2 pt-2 border-t border-current/20">
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-full p-2.5 border flex justify-between items-center text-xs cursor-pointer transition-colors ${borderCol} ${idleBtnBg}`}
              >
                <span className="font-semibold">&gt; {t(lang, 'setting_theme')}</span>
                <span className="text-[11px] px-2 py-0.5 border border-current font-bold">
                  {isDark ? t(lang, 'theme_dark') : t(lang, 'theme_light')}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className={`w-full p-2.5 border flex justify-between items-center text-xs cursor-pointer transition-colors ${borderCol} ${idleBtnBg}`}
              >
                <span className="font-semibold">&gt; {t(lang, 'setting_audio')}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 border ${
                    settings.soundEnabled
                      ? 'border-emerald-500 text-emerald-400 font-bold'
                      : 'border-zinc-500 opacity-60'
                  }`}
                >
                  {settings.soundEnabled ? t(lang, 'status_on') : t(lang, 'status_off')}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleVibration}
                className={`w-full p-2.5 border flex justify-between items-center text-xs cursor-pointer transition-colors ${borderCol} ${idleBtnBg}`}
              >
                <span className="font-semibold">&gt; {t(lang, 'setting_vibration')}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 border ${
                    settings.vibrationEnabled
                      ? 'border-emerald-500 text-emerald-400 font-bold'
                      : 'border-zinc-500 opacity-60'
                  }`}
                >
                  {settings.vibrationEnabled ? t(lang, 'status_on') : t(lang, 'status_off')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Main Menu Mode Choice (Mini-Campaign vs Custom Game) */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 border ${borderCol}`}>STEP 2</span>
                <span>{t(lang, 'menu_step_2')}</span>
              </div>
              {isCampaign && (
                <span className="text-[11px] opacity-75">
                  {t(lang, 'campaign_progress')}: {campaignUnlocked}/20
                </span>
              )}
            </div>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => selectGameType('campaign')}
                className={`p-3 border text-left cursor-pointer transition-colors ${
                  isCampaign
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="text-xs font-bold flex justify-between items-center">
                  <span>[A] {t(lang, 'mode_campaign_title')}</span>
                </div>
                <div className="text-[10px] mt-1 opacity-70 leading-tight">
                  {t(lang, 'mode_campaign_desc')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => selectGameType('custom')}
                className={`p-3 border text-left cursor-pointer transition-colors ${
                  !isCampaign
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="text-xs font-bold flex justify-between items-center">
                  <span>[B] {t(lang, 'mode_custom_title')}</span>
                </div>
                <div className="text-[10px] mt-1 opacity-70 leading-tight">
                  {t(lang, 'mode_custom_desc')}
                </div>
              </button>
            </div>

            {/* If Campaign is selected: render the 20-level mission selection dossier */}
            {isCampaign ? (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-1.5">
                  {CAMPAIGN_LEVELS.map(lvl => {
                    const isUnlocked = lvl.level <= campaignUnlocked;
                    const isSelected = lvl.level === settings.selectedCampaignLevel;

                    return (
                      <button
                        key={lvl.level}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (isUnlocked) {
                            soundFx.playClick();
                            updateSettings({ selectedCampaignLevel: lvl.level });
                          }
                        }}
                        className={`p-1.5 border text-center cursor-pointer transition-colors ${
                          isSelected
                            ? `${activeBorder} ${activeBtnBg} font-bold scale-105`
                            : isUnlocked
                            ? `${borderCol} ${idleBtnBg}`
                            : 'border-zinc-800 opacity-30 cursor-not-allowed bg-black/30'
                        }`}
                      >
                        <div className="text-xs font-bold">{lvl.level.toString().padStart(2, '0')}</div>
                        <div className="text-[9px] mt-0.5 opacity-60">
                          {isUnlocked ? lvl.mapSize : 'LOCK'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Mission Dossier */}
                <div className={`p-3 border text-xs space-y-1.5 ${borderCol} ${idleBtnBg}`}>
                  <div className="flex justify-between items-center border-b pb-1 border-current/20">
                    <span className="font-bold">
                      {t(lang, 'campaign_level_prefix')} {selectedLevel.level}: {lang === 'ua' ? selectedLevel.nameUa : selectedLevel.nameEn}
                    </span>
                    <span className="px-1.5 py-0.5 border border-current text-[10px] uppercase font-bold">
                      {t(lang, `diff_${selectedLevel.botDifficulty}`)}
                    </span>
                  </div>
                  <div className="opacity-80 leading-relaxed text-[11px]">
                    {lang === 'ua' ? selectedLevel.briefingUa : selectedLevel.briefingEn}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] pt-1 opacity-70">
                    <span>• SCALE: {selectedLevel.mapSize}</span>
                    <span>• BOTS: {selectedLevel.botCount}</span>
                    {selectedLevel.modes.fogOfWar && <span>• FOG OF WAR</span>}
                    {selectedLevel.modes.symmetricMap && <span>• SYMMETRIC</span>}
                    {selectedLevel.modes.alliancesTransfer && <span>• ALLIANCES</span>}
                    {selectedLevel.modes.swarmStart && <span>• SWARM</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-4 border text-center space-y-2 ${borderCol} ${idleBtnBg}`}>
                <div className="text-xs font-bold">{t(lang, 'mode_custom_title')}</div>
                <div className="text-[11px] opacity-75">{t(lang, 'mode_custom_desc')}</div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`mt-2 px-4 py-2 border text-xs font-bold cursor-pointer ${activeBorder} ${activeBtnBg}`}
                >
                  CONFIGURE PARAMETERS &gt;&gt;
                </button>
              </div>
            )}
          </div>
        )}

        {/* CUSTOM STEP 3: Map Size Selection */}
        {!isCampaign && step === 3 && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 border ${borderCol}`}>STEP 3 / 6</span>
              <span>{t(lang, 'menu_step_3')}</span>
            </div>

            {(['S', 'M', 'L', 'XL', 'XXL'] as MapSize[]).map(size => {
              const active = settings.mapSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    updateSettings({ mapSize: size });
                  }}
                  className={`w-full p-2.5 border text-left cursor-pointer transition-colors ${
                    active
                      ? `${activeBorder} ${activeBtnBg} font-bold`
                      : `${borderCol} ${idleBtnBg}`
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span>
                      {active ? '[X]' : '[ ]'} {t(lang, `size_${size.toLowerCase()}`)}
                    </span>
                    {active && <span className="text-[10px] font-bold">*SELECTED*</span>}
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-70">
                    {t(lang, `size_${size.toLowerCase()}_desc`)}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* CUSTOM STEP 4: Game Speed Control */}
        {!isCampaign && step === 4 && (
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 border ${borderCol}`}>STEP 4 / 6</span>
              <span>{t(lang, 'menu_step_4')}</span>
            </div>

            {(['tactical', 'turbo'] as GameSpeed[]).map(spd => {
              const active = settings.gameSpeed === spd;
              return (
                <button
                  key={spd}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    updateSettings({ gameSpeed: spd });
                  }}
                  className={`w-full p-3.5 border text-left cursor-pointer transition-colors ${
                    active
                      ? `${activeBorder} ${activeBtnBg} font-bold`
                      : `${borderCol} ${idleBtnBg}`
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>
                      {active ? '[X]' : '[ ]'} {t(lang, `speed_${spd}`)}
                    </span>
                    {active && <span className="text-[10px] font-bold">*ACTIVE*</span>}
                  </div>
                  <div className="text-[11px] mt-1 opacity-75">{t(lang, `speed_${spd}_desc`)}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* CUSTOM STEP 5: Bot Setup */}
        {!isCampaign && step === 5 && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 border ${borderCol}`}>STEP 5 / 6</span>
              <span>{t(lang, 'menu_step_5')}</span>
            </div>

            <div className="space-y-2">
              <div className="text-xs opacity-80">{t(lang, 'bot_count_label')}</div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      updateSettings({ botCount: num });
                    }}
                    className={`py-2.5 border text-center text-xs cursor-pointer transition-colors ${
                      settings.botCount === num
                        ? `${activeBorder} ${activeBtnBg} font-bold`
                        : `${borderCol} ${idleBtnBg}`
                    }`}
                  >
                    {num} {num === 1 ? 'BOT' : 'BOTS'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-xs opacity-80">{t(lang, 'bot_difficulty_label')}</div>
              <div className="grid grid-cols-2 gap-2">
                {(['easy', 'medium', 'hard', 'pro'] as BotDifficulty[]).map(diff => {
                  const active = settings.botDifficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        updateSettings({ botDifficulty: diff });
                      }}
                      className={`p-2 border text-left cursor-pointer transition-colors ${
                        active
                          ? `${activeBorder} ${activeBtnBg} font-bold`
                          : `${borderCol} ${idleBtnBg}`
                      }`}
                    >
                      <div className="text-xs font-bold">
                        {active ? '[X]' : '[ ]'} {t(lang, `diff_${diff}`)}
                      </div>
                      <div className="text-[10px] mt-0.5 opacity-70 leading-tight">
                        {t(lang, `diff_${diff}_desc`)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM STEP 6: Game Mode Selection */}
        {!isCampaign && step === 6 && (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest font-bold mb-1 flex items-center gap-2">
              <span className={`px-2 py-0.5 border ${borderCol}`}>STEP 6 / 6</span>
              <span>{t(lang, 'menu_step_6')}</span>
            </div>

            <div className="text-[11px] opacity-75 mb-1">
              &gt; {t(lang, 'mode_default_hint')}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleMode('fogOfWar')}
                className={`w-full p-2.5 border text-left cursor-pointer transition-colors ${
                  settings.modes.fogOfWar
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{settings.modes.fogOfWar ? '[X]' : '[ ]'} {t(lang, 'mode_fow')}</span>
                  {settings.modes.fogOfWar && <span className="text-[10px]">*ENGAGED*</span>}
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">{t(lang, 'mode_fow_desc')}</div>
              </button>

              <button
                type="button"
                onClick={() => toggleMode('symmetricMap')}
                className={`w-full p-2.5 border text-left cursor-pointer transition-colors ${
                  settings.modes.symmetricMap
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{settings.modes.symmetricMap ? '[X]' : '[ ]'} {t(lang, 'mode_symmetric')}</span>
                  {settings.modes.symmetricMap && <span className="text-[10px]">*ENGAGED*</span>}
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">{t(lang, 'mode_symmetric_desc')}</div>
              </button>

              <button
                type="button"
                onClick={() => toggleMode('alliancesTransfer')}
                className={`w-full p-2.5 border text-left cursor-pointer transition-colors ${
                  settings.modes.alliancesTransfer
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{settings.modes.alliancesTransfer ? '[X]' : '[ ]'} {t(lang, 'mode_alliances')}</span>
                  {settings.modes.alliancesTransfer && <span className="text-[10px]">*ENGAGED*</span>}
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">{t(lang, 'mode_alliances_desc')}</div>
              </button>

              <button
                type="button"
                onClick={() => toggleMode('swarmStart')}
                className={`w-full p-2.5 border text-left cursor-pointer transition-colors ${
                  settings.modes.swarmStart
                    ? `${activeBorder} ${activeBtnBg} font-bold`
                    : `${borderCol} ${idleBtnBg}`
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{settings.modes.swarmStart ? '[X]' : '[ ]'} {t(lang, 'mode_swarm')}</span>
                  {settings.modes.swarmStart && <span className="text-[10px]">*ENGAGED*</span>}
                </div>
                <div className="text-[10px] opacity-70 mt-0.5">{t(lang, 'mode_swarm_desc')}</div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className={`pt-3 border-t ${borderCol}`}>
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                if (step === 3 && !isCampaign) setStep(2);
                else setStep(step - 1);
              }}
              className={`px-4 py-2.5 border text-xs font-bold cursor-pointer transition-colors ${borderCol} ${idleBtnBg}`}
            >
              {t(lang, 'btn_prev')}
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setStep(2);
              }}
              className={`flex-1 py-3 border text-xs font-bold cursor-pointer text-center transition-colors ${activeBorder} ${activeBtnBg}`}
            >
              {t(lang, 'btn_continue')}
            </button>
          ) : step === 2 && isCampaign ? (
            <button
              type="button"
              data-start="true"
              onClick={() => {
                soundFx.playClick();
                onDeploy(settings.selectedCampaignLevel);
              }}
              className={`flex-1 py-3 border-2 text-sm font-bold cursor-pointer text-center tracking-wider transition-colors animate-pulse ${activeBorder} ${activeBtnBg}`}
            >
              {t(lang, 'campaign_launch')}
            </button>
          ) : step < 6 ? (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setStep(step + 1);
              }}
              className={`flex-1 py-3 border text-xs font-bold cursor-pointer text-center transition-colors ${activeBorder} ${activeBtnBg}`}
            >
              {t(lang, 'btn_next')}
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={() => {
                soundFx.playClick();
                onDeploy();
              }}
              className={`flex-1 py-3 border-2 text-sm font-bold cursor-pointer text-center tracking-wider transition-colors animate-pulse ${activeBorder} ${activeBtnBg}`}
            >
              {t(lang, 'btn_deploy')}
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="text-center text-[10px] opacity-60 mt-2">
          {t(lang, 'enter_start')}
        </div>
      </div>
    </div>
  );
};
