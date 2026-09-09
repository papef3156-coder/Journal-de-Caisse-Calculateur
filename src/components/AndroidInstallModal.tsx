import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Copy, 
  Check, 
  Share2, 
  Info 
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  appUrl
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'dismissed'>('idle');

  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Detect PWA install prompt and existing installation
  useEffect(() => {
    // Check if already in standalone mode
    if (typeof window !== 'undefined') {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallStatus('success');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If browser doesn't expose the prompt directly, show instruction
      alert("Sur votre téléphone Android, ouvrez le menu de Chrome (les 3 points en haut à droite) puis appuyez sur « Installer l'application » ou « Ajouter à l'écran d'accueil ».");
      return;
    }

    try {
      setInstallStatus('installing');
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallStatus('success');
        setIsInstalled(true);
      } else {
        setInstallStatus('dismissed');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
      setInstallStatus('idle');
    }
  };

  const copyAppUrl = () => {
    if (navigator.clipboard && currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#FAFAF7] rounded-2xl shadow-2xl border border-[#DCD6CB] max-w-lg w-full overflow-hidden flex flex-col my-4 max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E402F] to-[#2D5A43] text-white p-5 flex items-center justify-between relative shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Smartphone className="w-6 h-6 text-[#A3E635]" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold text-[#A3E635] tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Application Android</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-editorial text-white leading-tight">
                Installer sur votre téléphone
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-[#1A1A1A]">

          {/* Success Banner if already installed */}
          {isInstalled && (
            <div className="bg-[#E7EFEA] border border-[#2D5A43]/30 rounded-xl p-3.5 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-[#2D5A43] shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-[#1B382B]">
                <strong className="block font-semibold">Application déjà installée !</strong>
                L'application fonctionne en mode natif autonome sur votre appareil.
              </div>
            </div>
          )}

          {/* Option 1: Native PWA Android Install (Recommended) */}
          <div className="bg-white rounded-xl border border-[#DCD6CB] p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[#2D5A43] font-bold text-sm mb-2">
              <Smartphone className="w-4 h-4 text-[#2D5A43]" />
              <span>Méthode 1 : Installation directe sur Android (Recommandé)</span>
            </div>
            <p className="text-xs sm:text-sm text-[#5C574F] mb-3 leading-relaxed">
              L'application est configurée comme une <strong>Progressive Web App (PWA)</strong> Android officielle. Elle s'installe directement avec son icône sur votre écran d'accueil, s'ouvre en plein écran (sans barre de navigateur) et fonctionne même hors connexion.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleInstallClick}
                disabled={installStatus === 'installing'}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-[#2D5A43] hover:bg-[#234735] active:bg-[#1B3628] text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer text-xs sm:text-sm"
              >
                <Download className="w-4 h-4" />
                <span>
                  {installStatus === 'installing' 
                    ? 'Installation...' 
                    : isInstalled 
                    ? 'Réinstaller / Ouvrir' 
                    : 'Installer sur Android'}
                </span>
              </button>

              <button
                onClick={copyAppUrl}
                className="inline-flex items-center justify-center space-x-1.5 bg-[#F4F1EA] hover:bg-[#EBE8E0] text-[#1A1A1A] font-semibold py-2.5 px-3.5 rounded-xl border border-[#DCD6CB] transition-colors cursor-pointer text-xs"
                title="Copier le lien pour l'ouvrir sur votre téléphone"
              >
                {isCopied ? <Check className="w-4 h-4 text-[#2D5A43]" /> : <Copy className="w-4 h-4 text-[#5C574F]" />}
                <span>{isCopied ? 'Lien copié !' : 'Copier lien'}</span>
              </button>
            </div>

            {/* Quick manual guide */}
            <div className="mt-3.5 bg-[#FAFAF7] rounded-lg p-3 border border-[#E8E4DC] text-xs text-[#5C574F] space-y-1.5">
              <div className="font-semibold text-[#1A1A1A] flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-[#2D5A43]" />
                <span>Comment l'installer depuis Google Chrome sur Android :</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Ouvrez le lien sur votre téléphone avec <strong>Google Chrome</strong>.</li>
                <li>Appuyez sur le menu <strong>⋮</strong> (les 3 points verticaux en haut à droite).</li>
                <li>Appuyez sur <strong>« Installer l'application »</strong> (ou <em>« Ajouter à l'écran d'accueil »</em>).</li>
                <li>L'icône <strong>Journal Caisse</strong> apparaîtra sur votre écran d'accueil Android !</li>
              </ol>
            </div>
          </div>

          {/* Option 2: Generate APK via PWABuilder (Google / Microsoft Trusted Web Activity) */}
          <div className="bg-white rounded-xl border border-[#DCD6CB] p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-[#1A1A1A] font-bold text-sm mb-1.5">
              <Layers className="w-4 h-4 text-[#2D5A43]" />
              <span>Méthode 2 : Télécharger le package APK Android</span>
            </div>
            <p className="text-xs text-[#5C574F] mb-3 leading-relaxed">
              Vous pouvez générer un fichier <strong>.APK ou .AAB</strong> officiel prêt pour le Google Play Store ou pour une installation manuelle grâce à <strong>PWABuilder</strong> (outil open-source soutenu par Google et Microsoft).
            </p>

            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 w-full bg-[#FAFAF7] hover:bg-[#F4F1EA] text-[#2D5A43] border border-[#2D5A43]/40 font-semibold py-2 px-3.5 rounded-xl transition-colors text-xs sm:text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Générer l'APK Android sur PWABuilder</span>
            </a>
          </div>

          {/* Features badge */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#FAFAF7] border border-[#E8E4DC] p-2.5 rounded-xl flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#2D5A43] shrink-0" />
              <span className="text-[#3D3A34] font-medium">100% Hors-ligne & Sécurisé</span>
            </div>
            <div className="bg-[#FAFAF7] border border-[#E8E4DC] p-2.5 rounded-xl flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-[#2D5A43] shrink-0" />
              <span className="text-[#3D3A34] font-medium">Expérience plein écran</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#F4F1EA] border-t border-[#DCD6CB] p-3.5 sm:p-4 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#EBE8E0] hover:bg-[#DCD6CB] text-[#1A1A1A] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
