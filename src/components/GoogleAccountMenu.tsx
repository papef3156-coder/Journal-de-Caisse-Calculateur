import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, logoutUser } from '../utils/firebase';
import { LogOut, Cloud, Check, Loader2, UserCheck, ShieldCheck } from 'lucide-react';

interface GoogleAccountMenuProps {
  currentUser: User | null;
  onSyncCloud?: () => Promise<void>;
  isCloudSyncing?: boolean;
  onOpenModal?: () => void;
}

export const GoogleAccountMenu: React.FC<GoogleAccountMenuProps> = ({
  currentUser,
  onSyncCloud,
  isCloudSyncing = false,
  onOpenModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const localLinked = (() => {
    try {
      const item = localStorage.getItem('linked_google_account');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const activeEmail = currentUser?.email || localLinked?.email || null;
  const activeName = currentUser?.displayName || localLinked?.displayName || activeEmail?.split('@')[0] || null;
  const isGoogleUser = Boolean(activeEmail && activeEmail.includes('@'));

  const handleSignIn = async () => {
    if (onOpenModal) {
      onOpenModal();
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      setIsOpen(false);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Erreur lors de la connexion Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      localStorage.removeItem('linked_google_account');
      setIsOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!onSyncCloud) return;
    try {
      await onSyncCloud();
      setSyncFeedback('Journaux synchronisés !');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err) {
      setSyncFeedback('Échec de la synchronisation.');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  // Google SVG Icon
  const GoogleIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. État : Connecté avec un compte Google */}
      {isGoogleUser ? (
        <button
          type="button"
          id="btn-google-profile"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 bg-white hover:bg-[#F4F1EA] text-[#1A1A1A] border border-[#C3D9CD] px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
          title={`Connecté : ${activeName || activeEmail}`}
        >
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profil Google"
              className="w-6 h-6 rounded-full object-cover border border-[#2D5A43]/30"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-xs font-bold font-mono-num">
              {(activeName || activeEmail || 'G')[0].toUpperCase()}
            </div>
          )}

          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="font-bold text-[#1A1A1A] text-xs truncate max-w-[110px]">
              {activeName || activeEmail?.split('@')[0]}
            </span>
            <span className="text-[10px] text-[#2D5A43] font-medium flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43]"></span>
              <span>Google OK</span>
            </span>
          </div>

          <GoogleIcon />
        </button>
      ) : (
        /* 2. État : Non connecté ou invité */
        <button
          type="button"
          id="btn-login-google"
          onClick={handleSignIn}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-white hover:bg-[#F4F1EA] text-[#1A1A1A] border border-[#DCD6CB] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-60"
          title="Se connecter avec votre compte Google pour sauvegarder vos journaux"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#2D5A43] animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          <span className="hidden sm:inline">Compte Google</span>
          <span className="sm:hidden">Google</span>
        </button>
      )}

      {/* Menu Dropdown Profil Google */}
      {isOpen && isGoogleUser && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#DCD6CB] shadow-lg p-3 z-50 animate-fadeIn space-y-3">
          {/* En-tête profil */}
          <div className="flex items-center space-x-3 p-2 bg-[#F4F1EA] rounded-xl border border-[#EBE8E0]">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-[#2D5A43]/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2D5A43] text-white flex items-center justify-center font-bold text-sm">
                {(currentUser?.displayName || currentUser?.email || 'G')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#1A1A1A] truncate">
                {activeName || 'Compte Google'}
              </h4>
              <p className="text-[11px] text-[#7A756D] truncate" title={activeEmail || ''}>
                {activeEmail}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#2D5A43] font-bold mt-0.5">
                <ShieldCheck className="w-3 h-3 text-[#2D5A43]" />
                <span>Compte Google vérifié</span>
              </span>
            </div>
          </div>

          {/* Message d'erreur éventuel */}
          {authError && (
            <div className="text-[11px] text-[#8B3A3A] bg-[#FDF2F2] p-2 rounded-lg border border-[#FADBD8]">
              {authError}
            </div>
          )}

          {/* Feedback de synchronisation */}
          {syncFeedback && (
            <div className="text-[11px] text-[#2D5A43] bg-[#E7EFEA] p-2 rounded-lg border border-[#C3D9CD] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-1.5 pt-1 border-t border-[#EBE8E0]">
            {onOpenModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenModal();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F4F1EA] rounded-xl transition-colors cursor-pointer text-left"
              >
                <ShieldCheck className="w-4 h-4 text-[#2D5A43]" />
                <span>Gérer / Changer de compte Google</span>
              </button>
            )}

            {onSyncCloud && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isCloudSyncing}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[#2D5A43] hover:bg-[#E7EFEA] rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-left"
              >
                <Cloud className={`w-4 h-4 text-[#2D5A43] ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                <span>{isCloudSyncing ? 'Synchronisation en cours...' : 'Synchroniser mes données'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-[#8B3A3A] hover:bg-[#FDF2F2] rounded-xl transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-[#8B3A3A]" />
              <span>Se déconnecter de Google</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
