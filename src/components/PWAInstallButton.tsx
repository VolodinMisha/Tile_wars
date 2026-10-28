/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language, Theme } from '../game/types';
import { t } from '../game/i18n';
import { soundFx } from '../game/audio';

interface PWAInstallButtonProps {
  language: Language;
  theme: Theme;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language,
  theme,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as a standalone PWA, render small status badge or hide
  if (isInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border border-emerald-500/40 text-emerald-400 bg-emerald-950/30 tracking-wider`}
        title="Running in Standalone PWA Mode"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>{t(language, 'pwa_installed')}</span>
      </div>
    );
  }

  // If not installable and not iOS, don't show anything
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = () => {
    soundFx.playClick();
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const isDark = theme === 'dark';
  const borderCol = isDark ? 'border-emerald-400/80 hover:border-emerald-300' : 'border-emerald-700 hover:border-emerald-800';
  const bgCol = isDark ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900';

  return (
    <>
      <button
        onClick={handleInstallClick}
        title={t(language, 'pwa_install_title')}
        className={`cursor-pointer inline-flex items-center gap-1.5 font-mono border ${borderCol} ${bgCol} transition-colors uppercase font-bold tracking-wider ${
          compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        }`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{t(language, 'pwa_install_btn')}</span>
      </button>

      {/* iOS Installation Guided Overlay (Only on user explicit click on iOS) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
          <div className={`w-full max-w-sm p-4 border-2 ${borderCol} ${isDark ? 'bg-[#0a0c0a] text-emerald-400' : 'bg-[#f4efe6] text-[#1c241c]'} shadow-2xl`}>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-current/30 text-xs font-bold tracking-wider">
              <span>{t(language, 'pwa_ios_guide_title')}</span>
              <button
                onClick={() => setShowIOSModal(false)}
                className="px-2 py-0.5 border border-current hover:bg-current/10 cursor-pointer"
              >
                [X]
              </button>
            </div>
            <p className="text-xs leading-relaxed opacity-90 whitespace-pre-line mb-4">
              {t(language, 'pwa_ios_guide_desc')}
            </p>
            <div className="p-2 border border-current/20 bg-current/5 text-[11px] mb-4 space-y-1">
              <div>1. [ Safari Toolbar ] -&gt; [ Share ]</div>
              <div>2. [ Scroll Down ] -&gt; [ Add to Home Screen ]</div>
              <div>3. [ Launch from Home Screen ]</div>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className={`w-full py-2 border ${borderCol} ${bgCol} text-xs font-bold uppercase cursor-pointer`}
            >
              {t(language, 'btn_close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
