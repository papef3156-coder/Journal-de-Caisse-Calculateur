import React from 'react';
import { ActivePage, AppSettings } from '../types';
import { 
  Calculator, 
  Settings as SettingsIcon, 
  Store, 
  PlusCircle, 
  Sparkles,
  ReceiptText,
  TrendingUp,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { MicrosoftAuthButton } from './MicrosoftAuthButton';
import { User } from 'firebase/auth';
import { DailyJournal } from '../types';

interface HeaderProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  settings: AppSettings;
  onNewJournal: () => void;
  todayGain: number;
  user: User | null;
  journals: DailyJournal[];
  onJournalsLoadedFromCloud: (journals: DailyJournal[]) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  settings,
  onNewJournal,
  todayGain,
  user,
  journals,
  onJournalsLoadedFromCloud
}) => {
  return (
    <header className="bg-[#FAFAF7] border-b border-[#DCD6CB] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Store Name */}
          <div className="flex items-center space-x-3.5">
            <button
              type="button"
              onClick={() => setActivePage('journal')}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-xs border border-[#2D5A43]/20 bg-[#1B382B] flex items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer group"
              title="Journal de Caisse & Calculateur de Gains - Revenir au Journal"
            >
              <img
                src="/logo.jpg"
                alt="Logo Journal de Caisse & Calculateur de Gains"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/favicon.svg';
                }}
              />
            </button>
            <div>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setActivePage('journal')}
                  className="text-left cursor-pointer group"
                >
                  <h1 className="text-xl sm:text-2xl font-bold font-editorial text-[#1A1A1A] tracking-tight group-hover:text-[#2D5A43] transition-colors">
                    {settings.businessName || 'Journal de Caisse'}
                  </h1>
                </button>
              </div>
            </div>
          </div>

          {/* Main Pages Navigation & Quick Action */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <nav className="flex items-center bg-[#EBE8E0] p-1 rounded-xl border border-[#DCD6CB] gap-0.5">
              <button
                id="nav-btn-journal"
                onClick={() => setActivePage('journal')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activePage === 'journal' || activePage === 'dashboard'
                    ? 'bg-[#FAFAF7] text-[#2D5A43] shadow-xs border border-[#DCD6CB]'
                    : 'text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA]'
                }`}
              >
                <ReceiptText className="w-4 h-4 text-[#2D5A43]" />
                <span>Journal de Caisse</span>
              </button>

              <button
                id="nav-btn-gains-summary"
                onClick={() => setActivePage('gains_summary')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activePage === 'gains_summary'
                    ? 'bg-[#FAFAF7] text-[#2D5A43] shadow-xs border border-[#DCD6CB]'
                    : 'text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA]'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-[#2D5A43]" />
                <span>Gains & Synthèse Caisse</span>
              </button>

              <button
                id="nav-btn-settings"
                onClick={() => setActivePage('settings')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activePage === 'settings'
                    ? 'bg-[#FAFAF7] text-[#1A1A1A] shadow-xs border border-[#DCD6CB]'
                    : 'text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA]'
                }`}
              >
                <SettingsIcon className="w-4 h-4 text-[#7A756D]" />
                <span className="hidden sm:inline">Paramètres</span>
              </button>
            </nav>

            <MicrosoftAuthButton
              user={user}
              journals={journals}
              onJournalsLoadedFromCloud={onJournalsLoadedFromCloud}
            />

            {/* If in iframe (e.g. preview mode), show new tab button */}
            {typeof window !== 'undefined' && window.self !== window.top && (
              <a
                id="btn-open-new-tab-header"
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA] transition-colors border border-[#DCD6CB] bg-[#FAFAF7]"
                title="Ouvrir dans un nouvel onglet autonome (recommandé pour la connexion)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#2D5A43]" />
                <span>Nouvel onglet</span>
              </a>
            )}

            <button
              id="btn-quick-new-journal"
              onClick={onNewJournal}
              className="hidden lg:inline-flex items-center space-x-2 bg-[#2D5A43] hover:bg-[#234735] active:bg-[#1B3628] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau Journal</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
