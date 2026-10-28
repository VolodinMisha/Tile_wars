import React from 'react';
import { Theme } from '../game/types';

interface TerminalOverlayProps {
  theme: Theme;
  children: React.ReactNode;
}

export const TerminalOverlay: React.FC<TerminalOverlayProps> = ({ theme, children }) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`relative w-full h-full min-h-screen flex flex-col font-mono select-none overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-[#060b08] text-[#34d399]'
          : 'bg-[#ece7dc] text-[#141a12]'
      }`}
    >
      {/* CRT Scanline overlay effect */}
      <div
        className="pointer-events-none fixed inset-0 z-40 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.6) 3px, rgba(0,0,0,0.6) 4px)',
        }}
      />

      {/* Screen edge vignette */}
      <div
        className={`pointer-events-none fixed inset-0 z-40 ${
          isDark
            ? 'shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]'
            : 'shadow-[inset_0_0_60px_rgba(0,0,0,0.15)]'
        }`}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex-1 flex flex-col w-full h-full">
        {children}
      </div>
    </div>
  );
};
