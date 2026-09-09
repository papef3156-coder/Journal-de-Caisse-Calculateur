import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, logoutUser, linkGoogleAccount } from '../utils/firebase';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Cloud, 
  LogOut, 
  Loader2, 
  Mail, 
  AlertCircle,
  Database,
  Smartphone
} from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSyncCloud?: () => Promise<void>;
  isCloudSyncing?: boolean;
  suggestedEmail?: string;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSyncCloud,
  isCloudSyncing = false,
  suggestedEmail = 'papef4261@gmail.com',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState(suggestedEmail);
  const [customName, setCustomName] = useState('Pape Faye');
  const [showManualForm, setShowManualForm] = useState(false);

  if (!isOpen) return null;

  // Retrieve linked account if saved locally
  const localLinked = (() => {
    try {
      const item = localStorage.getItem('linked_google_account');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const activeEmail = currentUser?.email || localLinked?.email || null;
  const activeName = currentUser?.displayName || localLinked?.displayName || null;
  const activePhoto = currentUser?.photoURL || null;
  const isConnected = Boolean(activeEmail && activeEmail.includes('@'));

  // 1-Click Google Popup Sign In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const user = await signInWithGoogle();
      setSuccessMsg(`Connecté avec succès : ${user.email}`);
      if (onSyncCloud) {
        await onSyncCloud();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('La fenêtre popup Google a été bloquée par le navigateur. Vous pouvez associer votre adresse Google ci-dessous.');
        setShowManualForm(true);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Connexion annulée par l\'utilisateur.');
      } else {
        setErrorMsg('La connexion directe a échoué. Vous pouvez associer votre compte Google ci-dessous.');
        setShowManualForm(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Associate Google Account (with user's email)
  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setErrorMsg('Veuillez entrer une adresse e-mail Google valide (ex: exemple@gmail.com).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await linkGoogleAccount(customEmail, customName);
      setSuccessMsg(`Compte Google ${customEmail} associé avec succès !`);
      if (onSyncCloud) {
        await onSyncCloud();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de l\'association du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      localStorage.removeItem('linked_google_account');
      setSuccessMsg('Compte déconnecté.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Erreur lors de la déconnexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleGIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white w-full max-w-md rounded-3xl border border-[#DCD6CB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la boîte de dialogue */}
        <div className="bg-[#FAF9F5] px-6 py-4 border-b border-[#EBE8E0] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white shadow-2xs border border-[#DCD6CB] flex items-center justify-center">
              <GoogleGIcon />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A] font-editorial">
                {isConnected ? 'Compte Google Connecté' : 'Ajouter un Compte Google'}
              </h3>
              <p className="text-[11px] text-[#7A756D]">
                Synchronisation Cloud Firestore en direct
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A756D] hover:text-[#1A1A1A] hover:bg-[#EBE8E0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la boîte */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Notifications Succès / Erreur */}
          {successMsg && (
            <div className="p-3 bg-[#E7EFEA] border border-[#C3D9CD] rounded-2xl text-xs text-[#2D5A43] font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-[#FDF2F2] border border-[#FADBD8] rounded-2xl text-xs text-[#8B3A3A] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. État déjà connecté */}
          {isConnected ? (
            <div className="space-y-4">
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#DCD6CB] space-y-3">
                <div className="flex items-center space-x-3">
                  {activePhoto ? (
                    <img 
                      src={activePhoto} 
                      alt="Avatar Google" 
                      className="w-12 h-12 rounded-full border-2 border-[#2D5A43]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2D5A43] text-white flex items-center justify-center text-lg font-bold">
                      {(activeName || activeEmail || 'G')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#1A1A1A] truncate">{activeName || 'Utilisateur Google'}</h4>
                    <p className="text-xs text-[#5C574F] font-mono truncate">{activeEmail}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#2D5A43] font-bold mt-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Synchronisation Cloud active</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EBE8E0] text-[11px] text-[#7A756D] space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Base de données Firestore :</span>
                    <span className="font-mono text-[#2D5A43] font-bold">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Statut :</span>
                    <span className="text-[#2D5A43] font-bold">Sauvegarde automatique</span>
                  </div>
                </div>
              </div>

              {/* Actions connectées */}
              <div className="space-y-2">
                {onSyncCloud && (
                  <button
                    type="button"
                    onClick={onSyncCloud}
                    disabled={isCloudSyncing}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-[#2D5A43] hover:bg-[#234735] text-white font-bold rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                  >
                    <Cloud className={`w-4 h-4 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isCloudSyncing ? 'Synchronisation en cours...' : 'Synchroniser mes données maintenant'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-white hover:bg-[#FDF2F2] text-[#8B3A3A] border border-[#FADBD8] font-bold rounded-2xl transition-colors cursor-pointer text-xs sm:text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter de ce compte Google</span>
                </button>
              </div>
            </div>
          ) : (
            /* 2. État non connecté */
            <div className="space-y-4">
              <p className="text-xs text-[#5C574F] leading-relaxed">
                Connectez votre compte Google pour sauvegarder vos écritures de caisse, lier vos vendeurs et retrouver vos données sur n'importe quel téléphone Android ou ordinateur.
              </p>

              {/* Bouton 1 : Connexion Instantanée Google */}
              <button
                type="button"
                id="btn-modal-google-signin"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white hover:bg-[#F4F1EA] text-[#1A1A1A] border-2 border-[#DCD6CB] hover:border-[#2D5A43] font-bold rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60 text-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#2D5A43]" />
                ) : (
                  <GoogleGIcon />
                )}
                <span>Se connecter avec Google</span>
              </button>

              {/* Option rapide avec l'adresse du propriétaire */}
              <div className="p-3.5 bg-[#FAF9F5] rounded-2xl border border-[#DCD6CB] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#2D5A43]" />
                    <span>Compte Google suggéré</span>
                  </span>
                  <span className="text-[10px] bg-[#E7EFEA] text-[#2D5A43] font-bold px-2 py-0.5 rounded-full">
                    Propriétaire
                  </span>
                </div>
                
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#EBE8E0]">
                  <span className="text-xs font-mono font-semibold text-[#1A1A1A] truncate max-w-[200px]">
                    {suggestedEmail}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomEmail(suggestedEmail);
                      linkGoogleAccount(suggestedEmail, 'Pape Faye').then(() => {
                        setSuccessMsg(`Compte ${suggestedEmail} associé avec succès !`);
                        if (onSyncCloud) onSyncCloud();
                        setTimeout(onClose, 1200);
                      }).catch((e) => setErrorMsg(e.message));
                    }}
                    className="px-3 py-1 bg-[#2D5A43] hover:bg-[#234735] text-white text-xs font-bold rounded-lg shadow-2xs transition-transform active:scale-95 cursor-pointer"
                  >
                    Associer
                  </button>
                </div>
              </div>

              {/* Bascule formulaire personnalisé */}
              {!showManualForm ? (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(true)}
                    className="text-xs text-[#2D5A43] hover:underline font-semibold cursor-pointer"
                  >
                    Utiliser une autre adresse Google ?
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLinkAccount} className="space-y-3 pt-2 border-t border-[#EBE8E0]">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5C574F] uppercase tracking-wider mb-1">
                      Votre adresse e-mail Google
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nom@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-[#FAF9F5] border border-[#DCD6CB] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5C574F] uppercase tracking-wider mb-1">
                      Nom affiché
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pape Faye"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#FAF9F5] border border-[#DCD6CB] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#2D5A43] hover:bg-[#234735] text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Enregistrement...' : 'Valider et synchroniser ce compte'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Avantages de sécurité */}
          <div className="bg-[#F4F1EA]/60 p-3 rounded-2xl border border-[#DCD6CB] text-[11px] text-[#5C574F] space-y-1">
            <div className="flex items-center gap-2 text-[#2D5A43] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protection & Sauvegarde Sécurisée</span>
            </div>
            <p>
              Vos journaux de caisse, vendeurs et recettes sont chiffrés et sauvegardés sur Cloud Firestore.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF9F5] px-6 py-3 border-t border-[#EBE8E0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#EBE8E0] text-[#1A1A1A] border border-[#DCD6CB] rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
