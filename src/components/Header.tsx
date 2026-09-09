import React from 'react';
import { ActivePage, AppSettings, DailyJournal } from '../types';
import { 
  PlusCircle, 
  Users,
  BookOpen,
  Calculator,
  Camera
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleAccountMenu } from './GoogleAccountMenu';
import defaultStoreLogo from '../assets/images/store_profile_logo_1788716413614.jpg';

interface HeaderProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  settings: AppSettings;
  onNewJournal: () => void;
  journals: DailyJournal[];
  currentUser?: User | null;
  onSyncCloud?: () => Promise<void>;
  isCloudSyncing?: boolean;
  onOpenGoogleModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  setActivePage,
  settings,
  onNewJournal,
  journals,
  currentUser = null,
  onSyncCloud,
  isCloudSyncing = false,
  onOpenGoogleModal,
}) => {
  const [profileLogo, setProfileLogo] = React.useState<string>(() => {
    return localStorage.getItem('app_custom_profile_logo') || defaultStoreLogo;
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('app_custom_profile_logo');
      setProfileLogo(saved || defaultStoreLogo);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profile-logo-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profile-logo-updated', handleStorageChange);
    };
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setProfileLogo(dataUrl);
      localStorage.setItem('app_custom_profile_logo', dataUrl);
      window.dispatchEvent(new Event('profile-logo-updated'));
    };
    reader.readAsDataURL(file);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#DCD6CB] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 md:py-0 md:h-20 gap-3 md:gap-4">
          
          {/* Brand Logo & Store Name */}
          <div className="flex items-center space-x-3.5">
            <button
              type="button"
              onClick={() => setActivePage('journal')}
              className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shadow-xs border border-[#2D5A43]/20 bg-[#1B382B] flex items-center justify-center shrink-0 transition-transform hover:scale-105 cursor-pointer group"
              title="Cliquer pour aller à la Comptabilité des Vendeurs / Livreurs (Survol pour changer la photo)"
            >
              <img
                src={profileLogo}
                alt="Logo Journal de Caisse"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = defaultStoreLogo;
                }}
              />
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-semibold"
                title="Changer la photo de profil"
              >
                <Camera className="w-3.5 h-3.5 mb-0.5" />
                <span>Changer</span>
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <div>
              <button
                type="button"
                onClick={() => setActivePage('journal')}
                className="text-left cursor-pointer group"
              >
                <h1 className="text-lg sm:text-2xl font-bold font-editorial text-[#1A1A1A] tracking-tight group-hover:text-[#2D5A43] transition-colors leading-tight">
                  {settings.businessName || 'Journal de Caisse'}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] sm:text-xs text-[#7A756D] font-medium font-editorial">
                    Comptabilité Vendeurs & Historique
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7EFEA] text-[#2D5A43] text-[10px] font-bold border border-[#C3D9CD]" title="Synchronisation active avec Cloud Firestore et stockage local">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43] animate-pulse"></span>
                    <span>Sync Cloud & Local OK</span>
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Navigation Desktop / Tablette (Sur mobile Android, la barre inférieure AndroidBottomNav prend le relais) */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
            <nav className="flex items-center bg-[#EBE8E0] p-1.5 rounded-2xl border border-[#DCD6CB] gap-1 shrink-0">
              {/* Onglet 1: Comptabilité des Vendeurs / Livreurs */}
              <button
                id="nav-btn-journal"
                type="button"
                onClick={() => setActivePage('journal')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePage === 'journal' || activePage === 'dashboard'
                    ? 'bg-[#2D5A43] text-white shadow-xs'
                    : 'text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA]'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Comptabilité des Vendeurs / Livreurs</span>
              </button>

              {/* Onglet 2: Synthèse Journalière de Caisse */}
              <button
                id="nav-btn-synthesis"
                type="button"
                onClick={() => setActivePage('synthesis')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePage === 'synthesis' || activePage === 'gains_summary'
                    ? 'bg-[#2D5A43] text-white shadow-xs'
                    : 'text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA]'
                }`}
              >
                <Calculator className="w-4 h-4 shrink-0" />
                <span>Synthèse Journalière de Caisse</span>
              </button>

              {/* Onglet 3: Historique des Journaux */}
              <button
                id="nav-btn-history"
                type="button"
                onClick={() => setActivePage('history')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activePage === 'history'
                    ? 'bg-[#2D5A43] text-white shadow-xs'
                    : 'text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA]'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Historique des Journaux</span>
                {journals.length > 0 && (
                  <span className={`text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-full ml-1 ${
                    activePage === 'history'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#2D5A43]/15 text-[#2D5A43]'
                  }`}>
                    {journals.length}
                  </span>
                )}
              </button>
            </nav>

            {/* Bouton Nouveau Journal du jour */}
            <button
              id="btn-quick-new-journal"
              type="button"
              onClick={() => {
                onNewJournal();
                setActivePage('journal');
              }}
              className="inline-flex items-center space-x-2 bg-[#F4F1EA] hover:bg-[#EBE8E0] text-[#2D5A43] border border-[#2D5A43]/30 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs cursor-pointer shrink-0"
              title="Créer un nouveau journal pour la journée"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau Journal</span>
            </button>

            {/* Menu Compte Google Desktop */}
            <GoogleAccountMenu
              currentUser={currentUser}
              onSyncCloud={onSyncCloud}
              isCloudSyncing={isCloudSyncing}
              onOpenModal={onOpenGoogleModal}
            />
          </div>

          {/* Actions rapides mobile : Compte Google + Nouveau Journal */}
          <div className="flex md:hidden items-center justify-end space-x-2">
            <GoogleAccountMenu
              currentUser={currentUser}
              onSyncCloud={onSyncCloud}
              isCloudSyncing={isCloudSyncing}
              onOpenModal={onOpenGoogleModal}
            />

            <button
              type="button"
              onClick={() => {
                onNewJournal();
                setActivePage('journal');
              }}
              className="flex items-center space-x-1 px-3 py-1.5 bg-[#E7EFEA] text-[#2D5A43] border border-[#C3D9CD] rounded-xl text-xs font-bold active:scale-95 transition-transform cursor-pointer"
              title="Créer un nouveau journal pour la journée"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
