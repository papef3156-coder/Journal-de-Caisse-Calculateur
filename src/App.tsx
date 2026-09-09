import React, { useState, useEffect } from 'react';
import { ActivePage, AppSettings, DailyJournal, SellerEntry } from './types';
import { 
  loadJournals, 
  loadSettings, 
  saveJournals, 
  saveSettings, 
  getInitialSellers 
} from './utils/storage';
import { calculateJournalSummary } from './utils/calculations';
import { getLocalDateString, useLiveDateTime } from './utils/dateTime';
import { Header } from './components/Header';
import { DailyJournalEditor } from './components/DailyJournalEditor';
import { DailyCashSynthesisPage } from './components/DailyCashSynthesisPage';
import { JournalHistoryList } from './components/JournalHistoryList';
import { AndroidBottomNav } from './components/AndroidBottomNav';
import { ReceiptModal } from './components/ReceiptModal';
import { GoogleAccountModal } from './components/GoogleAccountModal';
import { AndroidInstallModal } from './components/AndroidInstallModal';
import { 
  auth, 
  ensureAuthUser, 
  signInWithGoogle,
  saveJournalToCloud, 
  deleteJournalFromCloud, 
  loadJournalsFromCloud, 
  syncAllJournalsToCloud 
} from './utils/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  PlusCircle, 
  Calendar,
  Users,
  X,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('journal');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [journals, setJournals] = useState<DailyJournal[]>(loadJournals);
  const [activePrintJournal, setActivePrintJournal] = useState<DailyJournal | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [dismissGoogleBanner, setDismissGoogleBanner] = useState<boolean>(() => {
    return localStorage.getItem('dismiss_google_sync_banner') === 'true';
  });

  const { todayStr: liveTodayStr } = useLiveDateTime();

  // Listen to Auth state and synchronise with Cloud Firestore
  useEffect(() => {
    ensureAuthUser().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSyncing(true);
        try {
          const cloudData = await loadJournalsFromCloud(user.uid);
          if (cloudData && cloudData.length > 0) {
            setJournals((prev) => {
              const cloudMap = new Map(cloudData.map((j) => [j.id || j.date, j]));
              const merged = [...cloudData];
              for (const loc of prev) {
                const key = loc.id || loc.date;
                if (!cloudMap.has(key)) {
                  merged.push(loc);
                }
              }
              return merged.sort((a, b) => b.date.localeCompare(a.date));
            });
          } else {
            const localData = loadJournals();
            if (localData && localData.length > 0) {
              await syncAllJournalsToCloud(user.uid, localData);
            }
          }
        } catch (err) {
          console.warn('Cloud load error:', err);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Global Escape key handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePrintJournal) {
          setActivePrintJournal(null);
        } else if (activePage !== 'journal') {
          setActivePage('journal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activePrintJournal, activePage]);

  // Helper to create a new daily journal for any given date
  const createNewJournalForDate = (dateStr: string, existingJournals: DailyJournal[]): DailyJournal => {
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

    const existingSellerNames = new Set(sellersToUse.map((s) => s.name.trim().toLowerCase()));
    settings.defaultSellers.forEach((item, idx) => {
      const sName = typeof item === 'string' ? item.trim() : item.name.trim();
      if (sName && !existingSellerNames.has(sName.toLowerCase())) {
        existingSellerNames.add(sName.toLowerCase());
        const phone = typeof item === 'object' && item.phone ? item.phone : '+221 77 000 00 00';
        const age = typeof item === 'object' && item.age ? item.age : 25;
        const role = typeof item === 'object' && item.role ? item.role : 'Vendeur';
        sellersToUse.push({
          id: `sel-${dateStr}-def-${idx}-${Date.now()}`,
          name: sName,
          phone,
          age,
          role,
          totalGiven: 0,
          soldCount: 0,
          returnCount: 0,
          lostCount: 0,
          cashCollected: 0,
          notes: '',
        });
      }
    });

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
    return createNewJournalForDate(todayStr, journals);
  });

  // Automatically ensure today's journal exists
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

    // Sync to Cloud if logged in
    if (currentUser) {
      try {
        await saveJournalToCloud(currentUser.uid, finalJournal);
      } catch (err) {
        console.error('Failed to sync saved journal to cloud', err);
      }
    }
  };

  // Handle creating a blank/new journal for today
  const handleNewJournal = () => {
    const todayStr = getLocalDateString();
    const newJ = createNewJournalForDate(todayStr, journals);

    setJournals((prev) => {
      const exists = prev.find((j) => j.date === todayStr);
      if (exists) return prev;
      return [newJ, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });

    setCurrentJournal(newJ);
    setActivePage('journal');
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
    setActivePage('journal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      let user = currentUser;
      if (!user) {
        user = await ensureAuthUser();
        if (user) setCurrentUser(user);
      }
      if (user) {
        await syncAllJournalsToCloud(user.uid, journals);
      }
    } catch (err) {
      console.error('Manual cloud sync failed:', err);
      throw err;
    } finally {
      setIsCloudSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1A1A1A] flex flex-col selection:bg-[#2D5A43] selection:text-white">
      
      {/* Top Header avec navigation et bouton Compte Google */}
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        settings={settings}
        onNewJournal={handleNewJournal}
        journals={journals}
        currentUser={currentUser}
        onSyncCloud={handleManualCloudSync}
        isCloudSyncing={isCloudSyncing}
        onOpenGoogleModal={() => setIsGoogleModalOpen(true)}
      />

      {/* Bannière d'invitation à la connexion Compte Google */}
      {(!currentUser || currentUser.isAnonymous) && !dismissGoogleBanner && (
        <div className="bg-[#E7EFEA] border-b border-[#C3D9CD] px-4 py-2.5 sm:py-3 transition-all animate-fadeIn">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 text-[#1B3628]">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-2xs border border-[#C3D9CD]">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <p className="leading-snug">
                <strong className="font-bold">Sauvegardez vos journaux sur votre compte Google :</strong> connectez-vous pour conserver vos données de caisse et synchroniser vos ventes en temps réel.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                id="btn-banner-google-login"
                onClick={() => setIsGoogleModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#2D5A43] hover:bg-[#234735] text-white font-bold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <span>Ajouter mon compte Google</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDismissGoogleBanner(true);
                  localStorage.setItem('dismiss_google_sync_banner', 'true');
                }}
                className="p-1.5 text-[#5C574F] hover:text-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
                title="Masquer cette bannière"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area (extra bottom padding on mobile for Android navigation bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 md:pb-12 space-y-6">
        
        {/* VUE 1 : COMPTABILITÉ DES VENDEURS / LIVREURS */}
        {(activePage === 'journal' || activePage === 'dashboard') && (
          <div className="space-y-6 animate-fadeIn">
            <section id="section-comptabilite-vendeurs" className="space-y-4">
              <DailyJournalEditor
                currentJournal={currentJournal}
                settings={settings}
                journals={journals}
                onSelectJournal={handleSelectJournalFromHistory}
                onSaveJournal={handleSaveJournal}
                onPrintJournal={(j) => setActivePrintJournal(j)}
                onNewJournal={handleNewJournal}
                onNavigateToSynthesis={() => {
                  setActivePage('synthesis');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </section>
          </div>
        )}

        {/* VUE 2 : SYNTHÈSE JOURNALIÈRE DE CAISSE */}
        {(activePage === 'synthesis' || activePage === 'gains_summary') && (
          <DailyCashSynthesisPage
            currentJournal={currentJournal}
            journals={journals}
            settings={settings}
            onSelectJournalForEditing={(j) => {
              setCurrentJournal(j);
              setActivePage('journal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPrintJournal={(j) => setActivePrintJournal(j)}
            onSyncCloud={handleManualCloudSync}
            isCloudSyncing={isCloudSyncing}
          />
        )}

        {/* VUE 3 : HISTORIQUE DES JOURNAUX */}
        {activePage === 'history' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Action & Info Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DCD6CB] shadow-xs">
              <div>
                <h2 className="text-xl font-bold font-editorial text-[#1A1A1A] flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-[#2D5A43]" />
                  <span>Historique des Journaux</span>
                </h2>
                <p className="text-xs text-[#7A756D] font-editorial mt-1">
                  Consultez, modifiez, imprimez vos tickets de caisse ou supprimez vos archives de journaux quotidiens.
                </p>
              </div>

              <button
                id="btn-history-new-journal"
                type="button"
                onClick={() => {
                  handleNewJournal();
                  setActivePage('journal');
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#2D5A43] hover:bg-[#234735] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nouveau Journal du Jour</span>
              </button>
            </div>

            {/* Liste de l'Historique avec recherche et suppression */}
            <JournalHistoryList
              journals={journals}
              currency={settings.currency}
              activeJournalId={currentJournal.id}
              onSelectJournal={handleSelectJournalFromHistory}
              onDeleteJournal={handleDeleteJournal}
              onDeleteMultipleJournals={handleDeleteMultipleJournals}
              onPrintJournal={(j) => setActivePrintJournal(j)}
              onSaveJournal={handleSaveJournal}
              onSyncCloud={handleManualCloudSync}
              isCloudSyncing={isCloudSyncing}
              onViewSynthesis={(j) => {
                setCurrentJournal(j);
                setActivePage('synthesis');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBackToEditor={() => {
                setActivePage('journal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

      </main>

      {/* Footer simple et sobre */}
      <footer className="border-t border-[#DCD6CB] bg-[#FAFAF7] py-6 text-center text-xs text-[#7A756D] print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-[#4A463F] font-editorial text-sm">
            {settings.businessName} — Comptabilité des Vendeurs / Livreurs & Historique des Journaux
          </p>
          <div className="flex items-center space-x-4 text-[#8C877E]">
            <button
              onClick={() => setActivePage('journal')}
              className={`hover:underline cursor-pointer ${activePage === 'journal' ? 'font-bold text-[#2D5A43]' : ''}`}
            >
              Comptabilité Vendeurs
            </button>
            <span>•</span>
            <button
              onClick={() => setActivePage('synthesis')}
              className={`hover:underline cursor-pointer ${activePage === 'synthesis' || activePage === 'gains_summary' ? 'font-bold text-[#2D5A43]' : ''}`}
            >
              Synthèse Caisse
            </button>
            <span>•</span>
            <button
              onClick={() => setActivePage('history')}
              className={`hover:underline cursor-pointer ${activePage === 'history' ? 'font-bold text-[#2D5A43]' : ''}`}
            >
              Historique ({journals.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Reçu imprimable lors du clic sur Imprimer / Ticket */}
      {activePrintJournal && (
        <ReceiptModal
          journal={activePrintJournal}
          settings={settings}
          onClose={() => setActivePrintJournal(null)}
        />
      )}

      {/* Boîte de dialogue dédiée Ajouter / Gérer un Compte Google */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        currentUser={currentUser}
        onSyncCloud={handleManualCloudSync}
        isCloudSyncing={isCloudSyncing}
        suggestedEmail="papef4261@gmail.com"
      />

      {/* Barre de navigation mobile style Android M3 */}
      <AndroidBottomNav
        activePage={activePage}
        setActivePage={setActivePage}
        journalsCount={journals.length}
        onOpenGoogleModal={() => setIsGoogleModalOpen(true)}
        isGoogleConnected={Boolean(currentUser && !currentUser.isAnonymous && currentUser.email)}
      />

    </div>
  );
}
