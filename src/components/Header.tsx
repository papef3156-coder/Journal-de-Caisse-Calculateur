import React from 'react';
import { ActivePage, AppSettings } from '../types';
import { 
  Calculator, 
  Settings as SettingsIcon, 
  Store, 
  Calendar, 
  PlusCircle, 
  Sparkles,
  ReceiptText,
  TrendingUp,
  BookOpen,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useLiveDateTime } from '../utils/dateTime';
import { GoogleAuthButton } from './GoogleAuthButton';
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
  const { formattedDateLong, timeStr, refreshNow } = useLiveDateTime();

  return (
    <header className="bg-[#FAFAF7] border-b border-[#DCD6CB] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand & Store Name */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#2D5A43] flex items-center justify-center text-[#F4F1EA] shadow-sm">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-bold font-editorial text-[#1A1A1A] tracking-tight">
                  {settings.businessName || 'Journal de Caisse'}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EBE8E0] text-[#2D5A43] border border-[#DCD6CB]">
                  {settings.currency}
                </span>
              </div>
              
              {/* Live Auto-Updating Date and Clock Indicator */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <button 
                  type="button"
                  onClick={() => setActivePage('settings')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E7EFEA] hover:bg-[#D7E8DD] border border-[#C3D9CD] hover:border-[#2D5A43]/40 text-[11px] sm:text-xs font-medium text-[#2D5A43] transition-all cursor-pointer shadow-2xs"
                  title="Date et heure synchronisées en temps réel — Cliquer pour ouvrir les Paramètres"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D5A43] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D5A43]"></span>
                  </span>
                  <Calendar className="w-3 h-3 text-[#2D5A43]" />
                  <span className="capitalize font-semibold">{formattedDateLong}</span>
                  <span className="text-[#8C877E]">•</span>
                  <Clock className="w-3 h-3 text-[#2D5A43]" />
                  <span className="font-mono text-[#1B3628] font-bold tracking-wide">{timeStr}</span>
                </button>

                <button
                  id="btn-refresh-datetime"
                  onClick={refreshNow}
                  title="Actualiser la date et l'heure manuellement"
                  className="hidden md:inline-flex p-1 rounded-md text-[#7A756D] hover:text-[#2D5A43] hover:bg-[#EBE8E0] transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
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

            <GoogleAuthButton
              user={user}
              journals={journals}
              onJournalsLoadedFromCloud={onJournalsLoadedFromCloud}
            />

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
