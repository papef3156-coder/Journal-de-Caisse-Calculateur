import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle, 
  logoutUser, 
  syncAllJournalsToCloud, 
  loadJournalsFromCloud 
} from '../utils/firebase';
import { DailyJournal } from '../types';
import { 
  LogOut, 
  Cloud, 
  CloudCheck, 
  RefreshCw, 
  User as UserIcon,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface GoogleAuthButtonProps {
  user: User | null;
  journals: DailyJournal[];
  onJournalsLoadedFromCloud: (journals: DailyJournal[]) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  user,
  journals,
  onJournalsLoadedFromCloud
}) => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setStatusMsg('Connecté avec succès ! Synchronisation...');
        // Load cloud journals or sync local ones
        const cloudJournals = await loadJournalsFromCloud(loggedUser.uid);
        if (cloudJournals && cloudJournals.length > 0) {
          onJournalsLoadedFromCloud(cloudJournals);
          setStatusMsg(`${cloudJournals.length} journaux synchronisés depuis le Cloud Google !`);
        } else if (journals.length > 0) {
          // Backup current local journals to the new cloud account
          await syncAllJournalsToCloud(loggedUser.uid, journals);
          setStatusMsg(`${journals.length} journaux sauvegardés sur votre compte Google !`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg('Erreur de connexion Google.');
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setShowDropdown(false);
      setStatusMsg('Déconnecté.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    try {
      setSyncing(true);
      await syncAllJournalsToCloud(user.uid, journals);
      const cloudJournals = await loadJournalsFromCloud(user.uid);
      if (cloudJournals && cloudJournals.length > 0) {
        onJournalsLoadedFromCloud(cloudJournals);
      }
      setStatusMsg('Synchronisation Cloud réussie !');
    } catch (e) {
      setStatusMsg('Erreur de synchronisation.');
    } finally {
      setSyncing(false);
      setShowDropdown(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  if (!user) {
    return (
      <div className="relative">
        <button
          id="btn-google-signin"
          onClick={handleSignIn}
          disabled={loading}
          className="flex items-center space-x-2 bg-white hover:bg-[#F8F9FA] active:bg-[#F1F3F4] text-[#3C4043] border border-[#DADCE0] hover:border-[#D2E3FC] px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer"
          title="Se connecter avec votre compte Google pour sauvegarder vos données dans le Cloud"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[#1A73E8]" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="hidden sm:inline font-semibold">Compte Google</span>
          <span className="sm:hidden font-semibold">Connexion</span>
        </button>

        {statusMsg && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-[#1A1A1A] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
            {statusMsg}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        id="btn-google-user-menu"
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-[#E7EFEA] hover:bg-[#D7E8DD] text-[#1B3628] border border-[#C3D9CD] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
        title="Gérer votre compte Google et la synchronisation Cloud"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Utilisateur'}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#2D5A43]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-[10px] font-bold">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <span className="hidden md:inline truncate max-w-[120px]">
          {user.displayName || user.email?.split('@')[0]}
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-[#2D5A43] text-white font-medium">
          Cloud
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#2D5A43]" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div 
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#DCD6CB] p-3 z-50 animate-fade-in"
          onMouseLeave={() => setShowDropdown(false)}
        >
          <div className="flex items-center space-x-3 p-2 border-b border-[#EBE8E0] mb-2">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-[#C3D9CD]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-sm font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#1A1A1A] truncate">{user.displayName || 'Utilisateur'}</p>
              <p className="text-[11px] text-[#7A756D] truncate">{user.email}</p>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#2D5A43] font-semibold">
                <ShieldCheck className="w-3 h-3 text-[#2D5A43]" />
                <span>Compte Google vérifié</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <RefreshCw className={`w-4 h-4 text-[#2D5A43] ${syncing ? 'animate-spin' : ''}`} />
                <span>Synchroniser les données Cloud</span>
              </div>
            </button>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#C0392B] hover:bg-[#FDF2E9] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-[#1A1A1A] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
          {statusMsg}
        </div>
      )}
    </div>
  );
};
