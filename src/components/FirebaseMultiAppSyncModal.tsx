import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Database, 
  Layers, 
  CheckCircle2, 
  ArrowRightLeft, 
  ShieldCheck, 
  Globe, 
  Terminal, 
  Sparkles,
  Zap,
  HelpCircle
} from 'lucide-react';
import { currentFirebaseConfig, testMultiAppSync } from '../utils/firebase';
import { DailyJournal } from '../types';

interface FirebaseMultiAppSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  journals: DailyJournal[];
  onForceSyncAll?: () => Promise<void>;
  isCloudSyncing?: boolean;
}

export const FirebaseMultiAppSyncModal: React.FC<FirebaseMultiAppSyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  journals,
  onForceSyncAll,
  isCloudSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'metrics' | 'guide' | 'test'>('config');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedJsCode, setCopiedJsCode] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const app1Url = 'https://ais-pre-yhxcnuqisfsgxm2rzhg2tm-854633456624.europe-west2.run.app';
  const app2Url = 'https://papef3156-coder.github.io/Journal-de-Caisse-Calculateur/';
  const databaseId = (currentFirebaseConfig as any).firestoreDatabaseId || 'ai-studio-journaldecaissec-d1529dc3-a1cf-416c-9737-ec7e51602215';
  const projectId = currentFirebaseConfig.projectId;

  const jsonConfigString = JSON.stringify(currentFirebaseConfig, null, 2);

  const jsSnippetCode = `// Configuration Firebase identique à insérer dans votre projet GitHub Pages
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = ${JSON.stringify(currentFirebaseConfig, null, 2)};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, "${databaseId}");
export const auth = getAuth(app);
`;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(jsonConfigString);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleCopyJsSnippet = () => {
    navigator.clipboard.writeText(jsSnippetCode);
    setCopiedJsCode(true);
    setTimeout(() => setCopiedJsCode(false), 2000);
  };

  const handleRunPingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testMultiAppSync();
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: e.message || 'Erreur lors du test de connexion.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const synchronizedFields = [
    {
      label: '1. Total Confié',
      key: 'totalProducedOrGiven',
      desc: 'Nombre total de pains ou articles confiés aux vendeurs pour la journée.',
      badge: 'Synchronisé',
    },
    {
      label: '2. Vente',
      key: 'totalSold',
      desc: 'Total des ventes effectives et validées par chaque vendeur.',
      badge: 'Synchronisé',
    },
    {
      label: '3. Retour (Confié - Vente)',
      key: 'totalReturned',
      desc: 'Différence exacte entre dotations et ventes avec calcul automatique.',
      badge: 'Synchronisé',
    },
    {
      label: '4. Prix Vente & Recette',
      key: 'unitSellingPrice & grossRevenue',
      desc: 'Tarif unitaire (ex: 175 CFA) et total des recettes brutes encaissées.',
      badge: 'Synchronisé',
    },
    {
      label: '5. Dépenses & Frais du Jour',
      key: 'expenses & totalExpenses',
      desc: 'Détail de chaque dépense journalière (farine, transport, personnel...).',
      badge: 'Synchronisé',
    },
    {
      label: '6. Synthèse Journalière de Caisse',
      key: 'summary (Bénéfice Net, Pertes)',
      desc: 'Gains nets après déductions, valorisation des retours et pourcentages de vente.',
      badge: 'Synchronisé',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#DCD6CB] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[#1A1A1A]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#FAF9F5] border-b border-[#EBE8E0] px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7EFEA] border border-[#C3D9CD] flex items-center justify-center text-[#2D5A43] shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1A1A1A] font-editorial">
                  Synchronisation Multi-Applications
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E7EFEA] text-[#2D5A43] border border-[#C3D9CD]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43] animate-ping" />
                  Base Commune
                </span>
              </div>
              <p className="text-xs text-[#5C574F]">
                Partage en temps réel entre Google Cloud Run & GitHub Pages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7A756D] hover:text-[#1A1A1A] hover:bg-[#EBE8E0] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual URL summary bar */}
        <div className="bg-[#2D5A43] text-white px-5 sm:px-6 py-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#234735]">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-[#A3D9BC] shrink-0" />
            <span className="font-semibold truncate max-w-[280px] sm:max-w-md">
              Base Firestore : <code className="font-mono text-[#E7EFEA] bg-[#234735] px-1.5 py-0.5 rounded">{databaseId}</code>
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-[#A3D9BC]">
            <span>{journals.length} journaux enregistrés</span>
            <span>•</span>
            <span>{currentUser ? currentUser.email : 'Accès Anonyme / Public'}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#EBE8E0] bg-[#FAF9F5] px-5 sm:px-6 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'config'
                ? 'border-[#2D5A43] text-[#2D5A43]'
                : 'border-transparent text-[#7A756D] hover:text-[#1A1A1A]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Config GitHub Pages</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'metrics'
                ? 'border-[#2D5A43] text-[#2D5A43]'
                : 'border-transparent text-[#7A756D] hover:text-[#1A1A1A]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>6 Données Synchronisées</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'guide'
                ? 'border-[#2D5A43] text-[#2D5A43]'
                : 'border-transparent text-[#7A756D] hover:text-[#1A1A1A]'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Comptes & Domaines</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'test'
                ? 'border-[#2D5A43] text-[#2D5A43]'
                : 'border-transparent text-[#7A756D] hover:text-[#1A1A1A]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Test de Connexion</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* TAB 1: CONFIG GITHUB PAGES */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-[#FAF3E8] border border-[#E8D9C0] rounded-2xl p-4 text-[#78511A] space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm text-[#1A1A1A]">
                  <Sparkles className="w-4 h-4 text-[#C48227]" />
                  <span>Comment connecter votre application GitHub Pages à la même base</span>
                </div>
                <p className="text-xs text-[#5C574F] leading-relaxed">
                  Pour que votre site <strong className="text-[#1A1A1A]">GitHub Pages</strong> lise et écrive exactement les mêmes journaux de caisse, copiez la configuration ci-dessous et insérez-la dans votre fichier <code className="bg-[#EFE9DF] px-1 py-0.5 rounded font-mono text-xs">firebase-applet-config.json</code> ou votre fichier d'initialisation Firebase.
                </p>
              </div>

              {/* Code Box JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4A463F] font-mono">
                    firebase-applet-config.json (à coller sur GitHub)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyConfig}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#2D5A43] hover:bg-[#234735] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    {copiedConfig ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#A3D9BC]" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 bg-[#1A1A1A] text-[#A3D9BC] font-mono text-[11px] sm:text-xs rounded-xl overflow-x-auto border border-black/20 max-h-52">
                  {jsonConfigString}
                </pre>
              </div>

              {/* Code Box JS/TS */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4A463F] font-mono">
                    Extrait TypeScript / JavaScript (Initialisation Firebase)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJsSnippet}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-[#FAF9F5] text-[#2D5A43] border border-[#C3D9CD] rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-all active:scale-95"
                  >
                    {copiedJsCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#2D5A43]" />
                        <span>Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#2D5A43]" />
                        <span>Copier le Code JS</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 bg-[#FAF9F5] text-[#2D5A43] font-mono text-[11px] sm:text-xs rounded-xl overflow-x-auto border border-[#DCD6CB] max-h-48">
                  {jsSnippetCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: 6 INFORMATIONS SYNCHRONISÉES */}
          {activeTab === 'metrics' && (
            <div className="space-y-3">
              <div className="bg-[#E7EFEA] border border-[#C3D9CD] rounded-2xl p-4 text-[#2D5A43]">
                <h3 className="font-bold text-sm mb-1 font-editorial text-[#1A1A1A]">
                  Prise en charge stricte des 6 catégories demandées
                </h3>
                <p className="text-xs text-[#2D5A43] leading-relaxed">
                  Chaque journal sauvegardé ou modifié sur l’un des sites synchronise instantanément les champs suivants dans Firebase Firestore :
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {synchronizedFields.map((field, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#FAF9F5] border border-[#DCD6CB] rounded-2xl p-3.5 flex flex-col justify-between hover:border-[#2D5A43] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1A1A1A] font-editorial text-xs sm:text-sm">
                          {field.label}
                        </span>
                        <span className="bg-[#E7EFEA] text-[#2D5A43] border border-[#C3D9CD] px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {field.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[#5C574F]">
                        {field.desc}
                      </p>
                    </div>
                    <code className="mt-2.5 text-[10px] text-[#7A756D] font-mono bg-white border border-[#EBE8E0] px-2 py-1 rounded-md block truncate">
                      Champ : {field.key}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GUIDE COMPTES & DOMAINES AUTORISÉS */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#DCD6CB] rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-[#2D5A43] font-bold text-sm font-editorial">
                  <ShieldCheck className="w-5 h-5 text-[#2D5A43]" />
                  <span>Partage des Comptes & Utilisateurs</span>
                </div>
                <p className="text-xs text-[#4A463F] leading-relaxed">
                  Puisque les deux applications se branchent sur le même projet Firebase (<code className="font-mono text-[#2D5A43]">{projectId}</code>) :
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-[#5C574F]">
                  <li>
                    <strong className="text-[#1A1A1A]">Identifiant unique (UID) :</strong> Quand vous vous connectez avec votre compte Google (<code className="font-mono">{currentUser?.email || 'votre email'}</code>) sur le site Cloud Run ou sur le site GitHub Pages, Firebase Auth vous donne le <strong>même UID</strong>.
                  </li>
                  <li>
                    <strong className="text-[#1A1A1A]">Journaux partagés :</strong> Vos journaux sont enregistrés dans <code className="font-mono">users/{currentUser?.uid || '{userId}'}/journals</code> et répliqués dans <code className="font-mono">journals/</code>. Les deux sites y accèdent en lecture et écriture sans barrière.
                  </li>
                  <li>
                    <strong className="text-[#1A1A1A]">Synchronisation en temps réel :</strong> L’écouteur <code className="font-mono text-[#2D5A43]">onSnapshot</code> détecte tout changement d'un côté et actualise automatiquement la vue de l’autre sans recharger la page.
                  </li>
                </ul>
              </div>

              <div className="bg-[#FAF9F5] border border-[#DCD6CB] rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-[#1A1A1A] text-xs sm:text-sm">
                  <Globe className="w-4 h-4 text-[#2D5A43]" />
                  <span>Étape indispensable sur Firebase Console : Domaines Autorisés</span>
                </div>
                <p className="text-xs text-[#5C574F] leading-relaxed">
                  Pour que la connexion Google fonctionne sur GitHub Pages sans erreur <code className="font-mono text-red-600">auth/unauthorized-domain</code> :
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-[#5C574F]">
                  <li>Ouvrez la <strong className="text-[#1A1A1A]">Console Firebase</strong> pour le projet <code className="font-mono text-[#2D5A43]">{projectId}</code>.</li>
                  <li>Allez dans <strong className="text-[#1A1A1A]">Authentication</strong> &gt; Onglet <strong className="text-[#1A1A1A]">Paramètres</strong> &gt; Section <strong className="text-[#1A1A1A]">Domaines autorisés</strong>.</li>
                  <li>Cliquez sur <strong className="text-[#1A1A1A]">Ajouter un domaine</strong> et collez : <code className="bg-white border border-[#DCD6CB] px-2 py-0.5 rounded font-mono font-bold text-[#2D5A43]">papef3156-coder.github.io</code></li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: TEST DE CONNEXION */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="bg-[#FAF9F5] border border-[#DCD6CB] rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-[#2D5A43] font-bold text-sm font-editorial">
                  <Zap className="w-5 h-5" />
                  <span>Tester la réactivité de la base Firestore</span>
                </div>
                <p className="text-xs text-[#5C574F] leading-relaxed">
                  Cliquez ci-dessous pour tester l’écriture et la lecture en direct avec la base Firestore commune. Cela vérifie que la base de données répond correctement aux requêtes multi-applications.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleRunPingTest}
                    disabled={isTesting}
                    className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#2D5A43] hover:bg-[#234735] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Test en cours...' : 'Lancer le test de latence'}</span>
                  </button>

                  {onForceSyncAll && (
                    <button
                      type="button"
                      onClick={onForceSyncAll}
                      disabled={isCloudSyncing}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-[#FAF9F5] text-[#2D5A43] border border-[#C3D9CD] rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Database className="w-4 h-4 text-[#2D5A43]" />
                      <span>{isCloudSyncing ? 'Synchronisation...' : 'Synchroniser tous les journaux locaux vers Cloud'}</span>
                    </button>
                  )}
                </div>

                {testResult && (
                  <div className={`mt-3 p-3.5 rounded-xl border text-xs font-medium ${
                    testResult.success 
                      ? 'bg-[#E7EFEA] border-[#C3D9CD] text-[#2D5A43]' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className="flex items-center space-x-2 font-bold">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      <span>{testResult.success ? 'Succès du test' : 'Échec du test'}</span>
                    </div>
                    <p className="mt-1">{testResult.message}</p>
                  </div>
                )}
              </div>

              {/* Résumé des 2 liens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={app1Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-[#DCD6CB] rounded-2xl p-3.5 flex items-center justify-between hover:border-[#2D5A43] transition-colors group cursor-pointer"
                >
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-[#7A756D] uppercase tracking-wider block">
                      Application 1 (Cloud Run)
                    </span>
                    <span className="text-xs font-semibold text-[#1A1A1A] truncate block font-mono">
                      ais-pre-...run.app
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#7A756D] group-hover:text-[#2D5A43] shrink-0 ml-2" />
                </a>

                <a
                  href={app2Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-[#DCD6CB] rounded-2xl p-3.5 flex items-center justify-between hover:border-[#2D5A43] transition-colors group cursor-pointer"
                >
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-[#7A756D] uppercase tracking-wider block">
                      Application 2 (GitHub Pages)
                    </span>
                    <span className="text-xs font-semibold text-[#1A1A1A] truncate block font-mono">
                      papef3156-coder.github.io
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#7A756D] group-hover:text-[#2D5A43] shrink-0 ml-2" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#FAF9F5] border-t border-[#EBE8E0] px-5 sm:px-6 py-3 flex items-center justify-between">
          <div className="text-[11px] text-[#7A756D] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mode temps réel actif via Firestore onSnapshot</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#2D5A43] hover:bg-[#234735] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
