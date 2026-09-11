import React from 'react';
import { ActivePage } from '../types';
import { Users, Calculator, BookOpen, Settings } from 'lucide-react';

interface AndroidBottomNavProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  journalsCount: number;
  onOpenGoogleModal?: () => void;
  isGoogleConnected?: boolean;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activePage,
  setActivePage,
  journalsCount,
  onOpenGoogleModal,
  isGoogleConnected = false,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  };

  const handleNav = (page: ActivePage) => {
    triggerHaptic();
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isJournalActive = activePage === 'journal' || activePage === 'dashboard';
  const isSynthesisActive = activePage === 'synthesis' || activePage === 'gains_summary';
  const isHistoryActive = activePage === 'history';

  return (
    <nav
      id="android-bottom-navigation"
      aria-label="Navigation principale mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-t border-[#DCD6CB] md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)] print:hidden"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-around">
        {/* Item 1: Vendeurs */}
        <button
          type="button"
          id="bottom-nav-vendeurs"
          onClick={() => handleNav('journal')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer min-h-[52px] ${
            isJournalActive
              ? 'text-[#2D5A43]'
              : 'text-[#7A756D] hover:text-[#1A1A1A]'
          }`}
        >
          <div
            className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${
              isJournalActive
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'bg-transparent text-[#7A756D]'
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] mt-0.5 tracking-tight ${
              isJournalActive ? 'font-bold text-[#2D5A43]' : 'font-medium'
            }`}
          >
            Vendeurs
          </span>
        </button>

        {/* Item 2: Paramètres */}
        <button
          type="button"
          id="bottom-nav-settings"
          onClick={() => handleNav('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer min-h-[52px] ${
            activePage === 'settings'
              ? 'text-[#2D5A43]'
              : 'text-[#7A756D] hover:text-[#1A1A1A]'
          }`}
        >
          <div
            className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${
              activePage === 'settings'
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'bg-transparent text-[#7A756D]'
            }`}
          >
            <Settings className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] mt-0.5 tracking-tight ${
              activePage === 'settings' ? 'font-bold text-[#2D5A43]' : 'font-medium'
            }`}
          >
            Paramètres
          </span>
        </button>

        {/* Item 3: Historique */}
        <button
          type="button"
          id="bottom-nav-historique"
          onClick={() => handleNav('history')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer min-h-[52px] relative ${
            isHistoryActive
              ? 'text-[#2D5A43]'
              : 'text-[#7A756D] hover:text-[#1A1A1A]'
          }`}
        >
          <div
            className={`px-4 py-1 rounded-full flex items-center justify-center transition-all relative ${
              isHistoryActive
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'bg-transparent text-[#7A756D]'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            {journalsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#8B3A3A] text-white text-[10px] font-bold font-mono-num rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-[#FAFAF7]">
                {journalsCount}
              </span>
            )}
          </div>
          <span
            className={`text-[11px] mt-0.5 tracking-tight ${
              isHistoryActive ? 'font-bold text-[#2D5A43]' : 'font-medium'
            }`}
          >
            Historique
          </span>
        </button>
      </div>
    </nav>
  );
};
