import React from 'react';
import { ActivePage } from '../types';
import { Users, Calculator, BookOpen } from 'lucide-react';

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

        {/* Item 2: Synthèse Caisse */}
        <button
          type="button"
          id="bottom-nav-synthese"
          onClick={() => handleNav('synthesis')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer min-h-[52px] ${
            isSynthesisActive
              ? 'text-[#2D5A43]'
              : 'text-[#7A756D] hover:text-[#1A1A1A]'
          }`}
        >
          <div
            className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${
              isSynthesisActive
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'bg-transparent text-[#7A756D]'
            }`}
          >
            <Calculator className="w-5 h-5" />
          </div>
          <span
            className={`text-[11px] mt-0.5 tracking-tight ${
              isSynthesisActive ? 'font-bold text-[#2D5A43]' : 'font-medium'
            }`}
          >
            Synthèse
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

        {/* Item 4: Compte Google */}
        {onOpenGoogleModal && (
          <button
            type="button"
            id="bottom-nav-google-account"
            onClick={() => {
              triggerHaptic();
              onOpenGoogleModal();
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer min-h-[52px] text-[#7A756D] hover:text-[#1A1A1A]"
          >
            <div className="px-3.5 py-1 rounded-full flex items-center justify-center transition-all relative">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              {isGoogleConnected && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#2D5A43] border-2 border-white rounded-full"></span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">
              Compte
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
