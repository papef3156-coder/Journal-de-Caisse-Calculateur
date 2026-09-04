import React, { useState, useEffect } from 'react';
import { ActivePage, AppSettings, DailyJournal, TimePeriod, SellerEntry } from './types';
import { 
  loadJournals, 
  loadSettings, 
  saveJournals, 
  saveSettings, 
  DEFAULT_SETTINGS, 
  getInitialSellers 
} from './utils/storage';
import { calculateJournalSummary } from './utils/calculations';
import { getLocalDateString, useLiveDateTime } from './utils/dateTime';
import { Header } from './components/Header';
import { ProfitMetricCards } from './components/ProfitMetricCards';
import { DailyJournalEditor } from './components/DailyJournalEditor';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { JournalHistoryList } from './components/JournalHistoryList';
import { GainsAndSummaryPage } from './components/GainsAndSummaryPage';
import { SettingsPage } from './components/SettingsPage';
import { ReceiptModal } from './components/ReceiptModal';
import { auth, saveJournalToCloud, saveSettingsToCloud, deleteJournalFromCloud, loadJournalsFromCloud } from './utils/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Calculator, 
  BarChart3, 
  History, 
  PlusCircle, 
  CalendarDays,
  Sparkles,
  Store,
  TrendingUp
} from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<'editor' | 'charts' | 'history'>('editor');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [journals, setJournals] = useState<DailyJournal[]>(loadJournals);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7days');
  const [activePrintJournal, setActivePrintJournal] = useState<DailyJournal | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Listen to Google Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Automatically sync from cloud
        const cloudData = await loadJournalsFromCloud(user.uid);
        if (cloudData && cloudData.length > 0) {
          setJournals(cloudData);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const { todayStr: liveTodayStr } = useLiveDateTime();

  // Helper to create a new daily journal for any given date
  const createNewJournalForDate = (dateStr: string, existingJournals: DailyJournal[]): DailyJournal => {
    // Inherit sellers and contact numbers from the most recent journal so user doesn't have to re-enter info
    const latestWithSellers = existingJournals.find((j) => j.sellers && j.sellers.length > 0);
    let sellersToUse: SellerEntry[] = [];

    if (latestWithSellers && latestWithSellers.sellers && latestWithSellers.sellers.length > 0) {
      sellersToUse = latestWithSellers.sellers.map((s, idx) => ({
        id: `sel-${dateStr}-${idx}-${Date.now()}`,
        name: s.name,
        phone: s.phone,
        age: s.age,
        nationalId: s.nationalId,
        role: s.role,
        totalGiven: s.totalGiven || 100,
        soldCount: s.soldCount || s.totalGiven || 95,
        returnCount: s.returnCount || 0,
        lostCount: 0,
        cashCollected: (s.soldCount || s.totalGiven || 95) * settings.defaultSellingPrice,
        notes: '',
      }));
    } else {
      sellersToUse = getInitialSellers();
    }

    const summary = calculateJournalSummary(
      sellersToUse,
      settings.defaultSellingPrice,
      settings.defaultReturnPrice,
      settings.defaultCostPrice,
      [],
      settings.calculationFormula
    );

    return {
      id: `journal-${dateStr}`,
      date: dateStr,
      title: 'Journal de caisse',
      productName: settings.defaultProductName,
      unitSellingPrice: settings.defaultSellingPrice,
      unitReturnPrice: settings.defaultReturnPrice,
      unitCostPrice: settings.defaultCostPrice,
      sellers: sellersToUse,
      expenses: [],
      summary,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Initialize or pick the current journal
  const [currentJournal, setCurrentJournal] = useState<DailyJournal>(() => {
    const todayStr = getLocalDateString();
    const existingToday = journals.find((j) => j.date === todayStr);
    if (existingToday) return existingToday;

    // Create a new daily journal for today so it appears automatically
    const newToday = createNewJournalForDate(todayStr, journals);
    return newToday;
  });

  // Automatically ensure that each day, a new journal appears in Historique des Journaux
  useEffect(() => {
    if (!liveTodayStr) return;
    const hasToday = journals.some((j) => j.date === liveTodayStr);
    if (!hasToday) {
      const newToday = createNewJournalForDate(liveTodayStr, journals);
      setJournals((prev) => {
        if (prev.some((j) => j.date === liveTodayStr)) return prev;
        return [newToday, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
      setCurrentJournal(newToday);
    }
  }, [liveTodayStr, journals.length]);

  // Keep localStorage in sync
  useEffect(() => {
    saveJournals(journals);
  }, [journals]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Handle saving a journal: saves and updates Historique des Journaux
  const handleSaveJournal = async (updatedJournal: DailyJournal) => {
    const journalId = updatedJournal.id && updatedJournal.id.includes(updatedJournal.date)
      ? updatedJournal.id
      : `journal-${updatedJournal.date}`;

    const finalJournal: DailyJournal = {
      ...updatedJournal,
      id: journalId,
      updatedAt: new Date().toISOString(),
    };

    setJournals((prev) => {
      const existsIndex = prev.findIndex((j) => j.date === finalJournal.date || j.id === finalJournal.id);
      let next: DailyJournal[];
      if (existsIndex >= 0) {
        next = [...prev];
        next[existsIndex] = finalJournal;
      } else {
        next = [finalJournal, ...prev];
      }
      return next.sort((a, b) => b.date.localeCompare(a.date));
    });
    setCurrentJournal(finalJournal);

    // If logged in with Google, also sync to Cloud
    if (currentUser) {
      try {
        await saveJournalToCloud(currentUser.uid, finalJournal);
      } catch (err) {
        console.error('Failed to sync saved journal to cloud', err);
      }
    }
  };

  // Handle creating a blank/new journal for today or specific date
  const handleNewJournal = () => {
    const todayStr = getLocalDateString();
    const newJ = createNewJournalForDate(todayStr, journals);

    setJournals((prev) => {
      const exists = prev.find((j) => j.date === todayStr);
      if (exists) return prev;
      return [newJ, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });

    setCurrentJournal(newJ);
    setActivePage('dashboard');
    setDashboardTab('editor');
  };

  const handleDeleteJournal = async (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    if (currentJournal.id === id && journals.length > 1) {
      setCurrentJournal(journals.filter((j) => j.id !== id)[0]);
    }

    if (currentUser) {
      try {
        await deleteJournalFromCloud(currentUser.uid, id);
      } catch (err) {
        console.error('Failed to delete journal from cloud', err);
      }
    }
  };

  const handleDeleteMultipleJournals = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setJournals((prev) => prev.filter((j) => !idSet.has(j.id)));
    if (idSet.has(currentJournal.id)) {
      const remaining = journals.filter((j) => !idSet.has(j.id));
      if (remaining.length > 0) {
        setCurrentJournal(remaining[0]);
      }
    }

    if (currentUser) {
      for (const id of ids) {
        try {
          await deleteJournalFromCloud(currentUser.uid, id);
        } catch (err) {
          console.error(`Failed to delete journal ${id} from cloud`, err);
        }
      }
    }
  };

  const handleSelectJournalFromHistory = (journal: DailyJournal) => {
    setCurrentJournal(journal);
    setDashboardTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateSellerInfo = (
    sellerName: string,
    updatedInfo: { phone?: string; age?: number | string; role?: string }
  ) => {
    // 1. Update matching seller info across all journals
    setJournals((prevJournals) =>
      prevJournals.map((j) => ({
        ...j,
        sellers: j.sellers.map((s) => {
          if (s.name.trim().toLowerCase() === sellerName.trim().toLowerCase()) {
            return {
              ...s,
              phone: updatedInfo.phone !== undefined ? updatedInfo.phone : s.phone,
              age: updatedInfo.age !== undefined ? updatedInfo.age : s.age,
              role: updatedInfo.role !== undefined ? updatedInfo.role : s.role,
            };
          }
          return s;
        }),
      }))
    );

    // 2. Update current active journal
    setCurrentJournal((prev) => ({
      ...prev,
      sellers: prev.sellers.map((s) => {
        if (s.name.trim().toLowerCase() === sellerName.trim().toLowerCase()) {
          return {
            ...s,
            phone: updatedInfo.phone !== undefined ? updatedInfo.phone : s.phone,
            age: updatedInfo.age !== undefined ? updatedInfo.age : s.age,
            role: updatedInfo.role !== undefined ? updatedInfo.role : s.role,
          };
        }
        return s;
      }),
    }));

    // 3. Update settings defaultSellers list
    setSettings((prevSettings) => {
      const updatedDefaults = prevSettings.defaultSellers.map((item) => {
        const name = typeof item === 'string' ? item : item.name;
        if (name.trim().toLowerCase() === sellerName.trim().toLowerCase()) {
          if (typeof item === 'string') {
            return {
              name,
              phone: updatedInfo.phone || '+221 77 000 00 00',
              age: updatedInfo.age || 25,
              role: updatedInfo.role || 'Vendeur',
            };
          }
          return {
            ...item,
            phone: updatedInfo.phone !== undefined ? updatedInfo.phone : item.phone,
            age: updatedInfo.age !== undefined ? updatedInfo.age : item.age,
            role: updatedInfo.role !== undefined ? updatedInfo.role : item.role,
          };
        }
        return item;
      });

      return {
        ...prevSettings,
        defaultSellers: updatedDefaults,
      };
    });
  };

  const handleResetAllData = () => {
    localStorage.clear();
    const loadedS = DEFAULT_SETTINGS;
    setSettings(loadedS);
    const initialJ = loadJournals();
    setJournals(initialJ);
    setCurrentJournal(initialJ[0]);
    setActivePage('dashboard');
    setDashboardTab('editor');
  };

  const todayGain = currentJournal?.summary?.netGain || 0;

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] flex flex-col selection:bg-[#2D5A43] selection:text-white">
      
      {/* Top Main Navigation Header */}
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        settings={settings}
        onNewJournal={handleNewJournal}
        todayGain={todayGain}
        user={currentUser}
        journals={journals}
        onJournalsLoadedFromCloud={(cloudJournals) => {
          setJournals(cloudJournals);
          if (cloudJournals.length > 0) {
            setCurrentJournal(cloudJournals[0]);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* PAGE 1: JOURNAL DE CAISSE (SAISIE QUOTIDIENNE & HISTORIQUE) */}
        {(activePage === 'journal' || activePage === 'dashboard') && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Quick Banner Linking to Gains & Synthèse de Caisse Page */}
            <div className="bg-[#2D5A43] text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white/15 text-[#D8EADB]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base font-editorial">
                    Calcul des Gains & Synthèse Journalière de Caisse
                  </h3>
                  <p className="text-xs text-[#D8EADB]/90 font-editorial">
                    Bénéfices calculés sur Aujourd'hui, Tous les Jours, 1 Mois, 1 An avec analyse complète des retours.
                  </p>
                </div>
              </div>

              <button
                id="btn-goto-gains-summary"
                onClick={() => setActivePage('gains_summary')}
                className="bg-white text-[#2D5A43] hover:bg-[#F4F1EA] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                Voir Gains & Synthèse Caisse →
              </button>
            </div>

            {/* SAISIE DU JOURNAL DE CAISSE DU JOUR */}
            <section id="section-saisie-journal" className="space-y-4">
              <DailyJournalEditor
                currentJournal={currentJournal}
                settings={settings}
                journals={journals}
                onSelectJournal={handleSelectJournalFromHistory}
                onSaveJournal={handleSaveJournal}
                onPrintJournal={(j) => setActivePrintJournal(j)}
                onNewJournal={handleNewJournal}
                onUpdateSettings={setSettings}
              />
            </section>

            {/* HISTORIQUE DES JOURNAUX DE CAISSE */}
            <section id="section-historique" className="space-y-4 pt-4 border-t border-[#DCD6CB]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-[#2D5A43]"></span>
                  <h2 className="text-lg font-bold font-editorial text-[#1A1A1A]">
                    Historique des Journaux
                  </h2>
                </div>
                <span className="text-xs text-[#7A756D] font-medium font-editorial">
                  {journals.length} {journals.length > 1 ? 'journaux enregistrés' : 'journal enregistré'}
                </span>
              </div>

              <JournalHistoryList
                journals={journals}
                currency={settings.currency}
                activeJournalId={currentJournal.id}
                onSelectJournal={handleSelectJournalFromHistory}
                onDeleteJournal={handleDeleteJournal}
                onDeleteMultipleJournals={handleDeleteMultipleJournals}
                onPrintJournal={(j) => setActivePrintJournal(j)}
              />
            </section>

          </div>
        )}

        {/* PAGE 2: NOUVELLE PAGE DÉDIÉE - CALCUL DES GAINS & BÉNÉFICES & SYNTHÈSE DE CAISSE */}
        {activePage === 'gains_summary' && (
          <GainsAndSummaryPage
            journals={journals}
            currentJournal={currentJournal}
            settings={settings}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={setSelectedPeriod}
            onUpdateSellerInfo={handleUpdateSellerInfo}
            onSelectJournal={(j) => {
              setCurrentJournal(j);
              setActivePage('journal');
            }}
          />
        )}

        {/* PAGE 3: PARAMÈTRES DE LA BOULANGERIE */}
        {activePage === 'settings' && (
          <div className="animate-fadeIn">
            <SettingsPage
              settings={settings}
              onSaveSettings={(newSettings) => setSettings(newSettings)}
              journals={journals}
              onImportJournals={(imported) => {
                setJournals(imported);
                if (imported.length > 0) setCurrentJournal(imported[0]);
              }}
              onResetAllData={handleResetAllData}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#DCD6CB] bg-[#FAFAF7] py-6 text-center text-xs text-[#7A756D] print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-[#4A463F] font-editorial text-sm">
            {settings.businessName} — Gestion commerciale, Journal de caisse & Calcul des bénéfices
          </p>
          <p className="text-[#8C877E]">
            Calculs automatiques Aujourd'hui, Tous les Jours, 1 Mois et 1 An • Données sauvegardées en local
          </p>
        </div>
      </footer>

      {/* Printable Receipt Modal */}
      {activePrintJournal && (
        <ReceiptModal
          journal={activePrintJournal}
          settings={settings}
          onClose={() => setActivePrintJournal(null)}
        />
      )}

    </div>
  );
}
