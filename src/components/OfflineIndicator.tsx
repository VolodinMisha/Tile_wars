/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language, Theme } from '../game/types';
import { t } from '../game/i18n';

interface OfflineIndicatorProps {
  language: Language;
  theme: Theme;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language, theme }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1 text-[11px] font-mono tracking-wider border flex items-center gap-2 shadow-lg select-none ${
        isDark
          ? 'bg-amber-950/90 border-amber-500/80 text-amber-300'
          : 'bg-amber-100 border-amber-600 text-amber-900'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
      <span className="font-bold">{t(language, 'pwa_offline_banner')}</span>
    </div>
  );
};
