import React, { useState } from 'react';
import { AppSettings, DailyJournal, SellerInfo } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_SELLER_PROFILES } from '../utils/storage';
import { calculateJournalSummary } from '../utils/calculations';
import { useLiveDateTime } from '../utils/dateTime';
import { 
  Settings as SettingsIcon, 
  Save, 
  Store, 
  Coins, 
  Users, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  HelpCircle,
  Calculator,
  Phone,
  Calendar,
  ShieldCheck,
  UserCheck,
  Edit2,
  Edit3,
  Clock,
  RefreshCw,
  Globe,
  Sparkles,
  FolderDown,
  FolderOpen,
  HardDrive,
  FileArchive,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  isFileSystemAccessSupported,
  connectLocalPcFolder,
  syncAllJournalsToLocalFolder,
  downloadAllJournalsZip,
  getSavedLocalFolderName,
  getActiveDirectoryHandle
} from '../utils/localFolderSync';
import { downloadExcelWorkbook } from '../utils/excelWorkbookExport';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  journals: DailyJournal[];
  onImportJournals: (journals: DailyJournal[]) => void;
  onResetAllData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  journals,
  onImportJournals,
  onResetAllData,
}) => {
  const { formattedDateLong, timeStr, refreshNow, now } = useLiveDateTime();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newSellerAge, setNewSellerAge] = useState<number | string>('');
  const [newSellerRole, setNewSellerRole] = useState('Vendeur');
  const [showAddSellerForm, setShowAddSellerForm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [justSyncedTime, setJustSyncedTime] = useState(false);
  const [folderName, setFolderName] = useState<string | null>(getSavedLocalFolderName());
  const [isSyncingFolder, setIsSyncingFolder] = useState(false);
  const [folderSyncMsg, setFolderSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const hasFsAccess = isFileSystemAccessSupported();

  const handleConnectPcFolder = async () => {
    const result = await connectLocalPcFolder();
    if (result.success && result.folderName) {
      setFolderName(result.folderName);
      setFolderSyncMsg({
        type: 'success',
        text: `Dossier lié : "${result.folderName}". Synchronisation des journaux en cours...`,
      });

      setIsSyncingFolder(true);
      const syncRes = await syncAllJournalsToLocalFolder(journals, getActiveDirectoryHandle());
      setIsSyncingFolder(false);

      if (syncRes.success) {
        setFolderSyncMsg({
          type: 'success',
          text: `Tous vos ${syncRes.count} journaux ont été enregistrés avec succès dans le dossier "${result.folderName}" !`,
        });
      }
    } else if (result.error) {
      setFolderSyncMsg({ type: 'error', text: result.error });
    }
  };

  const handleSyncAllToFolderNow = async () => {
    const dirHandle = getActiveDirectoryHandle();
    if (!dirHandle) {
      await handleConnectPcFolder();
      return;
    }

    setIsSyncingFolder(true);
    const syncRes = await syncAllJournalsToLocalFolder(journals, dirHandle);
    setIsSyncingFolder(false);

    if (syncRes.success) {
      setFolderSyncMsg({
        type: 'success',
        text: `Synchronisation réussie : ${syncRes.count} journaux mis à jour dans "${folderName}".`,
      });
      setTimeout(() => setFolderSyncMsg(null), 4000);
    } else {
      setFolderSyncMsg({ type: 'error', text: syncRes.error || 'Erreur de synchronisation' });
    }
  };

  const handleDownloadZipArchive = async () => {
    setIsSyncingFolder(true);
    try {
      await downloadAllJournalsZip(journals, formData);
      setFolderSyncMsg({
        type: 'success',
        text: 'Archive ZIP téléchargée avec succès pour votre dossier Documents !',
      });
      setTimeout(() => setFolderSyncMsg(null), 5000);
    } catch {
      setFolderSyncMsg({ type: 'error', text: 'Erreur lors de la génération du ZIP.' });
    } finally {
      setIsSyncingFolder(false);
    }
  };

  const handleManualTimeSync = () => {
    refreshNow();
    setJustSyncedTime(true);
    setTimeout(() => setJustSyncedTime(false), 2000);
  };

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } catch {}
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddDefaultSeller = () => {
    if (!newSellerName.trim()) return;
    
    // Normalize seller info
    const newProfile: SellerInfo = {
      name: newSellerName.trim(),
      phone: newSellerPhone.trim() || '+221 77 000 00 00',
      age: Number(newSellerAge) || 25,
      role: newSellerRole.trim() || 'Vendeur',
    };

    const exists = formData.defaultSellers.some((s) => {
      const name = typeof s === 'string' ? s : s.name;
      return name.toLowerCase() === newProfile.name.toLowerCase();
    });

    if (exists) {
      alert('Un vendeur avec ce nom existe déjà dans votre liste.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      defaultSellers: [...prev.defaultSellers, newProfile],
    }));

    setNewSellerName('');
    setNewSellerPhone('');
    setNewSellerAge('');
    setNewSellerRole('Vendeur');
    setShowAddSellerForm(false);
  };

  const handleRemoveDefaultSeller = (sellerName: string) => {
    setFormData((prev) => ({
      ...prev,
      defaultSellers: prev.defaultSellers.filter((s) => {
        const name = typeof s === 'string' ? s : s.name;
        return name !== sellerName;
      }),
    }));
  };

  const handleStartEditSeller = (sellerItem: string | SellerInfo) => {
    const name = typeof sellerItem === 'string' ? sellerItem : sellerItem.name;
    const phone = typeof sellerItem === 'string' ? '+221 77 000 00 00' : (sellerItem.phone || '+221 77 000 00 00');
    const age = typeof sellerItem === 'string' ? 28 : (sellerItem.age || 28);
    const role = typeof sellerItem === 'string' ? 'Vendeur' : (sellerItem.role || 'Vendeur');

    setNewSellerName(name);
    setNewSellerPhone(phone);
    setNewSellerAge(age);
    setNewSellerRole(role);
    // Remove existing to replace on save or edit
    setFormData((prev) => ({
      ...prev,
      defaultSellers: prev.defaultSellers.filter((s) => {
        const n = typeof s === 'string' ? s : s.name;
        return n.toLowerCase() !== name.toLowerCase();
      }),
    }));
    setShowAddSellerForm(true);
  };

  const handleExportBackup = () => {
    const backup = {
      version: 2,
      exportDate: new Date().toISOString(),
      settings: formData,
      journals,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sauvegarde_caisse_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.journals)) {
            onImportJournals(parsed.journals);
            if (parsed.settings) {
              setFormData(parsed.settings);
              onSaveSettings(parsed.settings);
            }
            alert('Sauvegarde restaurée avec succès !');
          } else {
            setImportError('Format de fichier invalide. Le fichier doit contenir une liste de journaux.');
          }
        } catch {
          setImportError('Erreur lors de la lecture du fichier JSON.');
        }
      };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="settings-page-container">
      
      {/* Page Title */}
      <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#2D5A43] text-white flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-editorial text-[#1A1A1A] tracking-tight">
              Paramètres de l'Application
            </h2>
            <p className="text-xs text-[#7A756D] font-editorial italic">
              Configurez vos prix par défaut, devises, identification des vendeurs et gestion des données
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Informations de l'Établissement & Nom */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#EBE8E0] pb-3">
            <Store className="w-5 h-5 text-[#2D5A43]" />
            <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
              Informations du Commerce
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1 font-editorial">
                Nom de la Boutique / Commerce
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3.5 py-2 text-sm font-semibold text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                placeholder="Ex: Boulangerie & Commerce"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1 font-editorial">
                Devise Monétaire
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3.5 py-2 text-sm font-semibold text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
              >
                <option value="CFA">Franc CFA (CFA / FCFA / XOF)</option>
                <option value="FCFA">FCFA</option>
                <option value="€">Euro (€)</option>
                <option value="$">Dollar ($)</option>
                <option value="GNF">Franc Guinéen (GNF)</option>
                <option value="MAD">Dirham Marocain (MAD)</option>
                <option value="DZD">Dinar Algérien (DZD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Destinataires pour l'envoi de la Synthèse Journalière (Gmail Google & Messages) */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4" id="settings-notifications-card">
          <div className="flex items-center space-x-2 border-b border-[#EBE8E0] pb-3">
            <Send className="w-5 h-5 text-[#2D5A43]" />
            <div>
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
                Destinataires de la Synthèse de Caisse (Gmail & Messages)
              </h3>
              <p className="text-[11px] text-[#7A756D] font-editorial italic">
                Adresses et numéros préconfigurés pour l'envoi en 1 clic de votre rapport quotidien
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1 font-editorial flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#EA4335]" />
                <span>Adresse Gmail / Compte Google</span>
              </label>
              <input
                type="email"
                value={formData.notificationEmail || ''}
                onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3.5 py-2 text-sm font-semibold text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                placeholder="Ex: papef4261@gmail.com"
              />
              <span className="text-[11px] text-[#7A756D] mt-1 block">
                Ouvre directement l'interface de rédaction Gmail avec le sujet et le bilan pré-remplis.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1 font-editorial flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span>Numéro de Téléphone (Messages / SMS / WhatsApp)</span>
              </label>
              <input
                type="tel"
                value={formData.notificationPhone || ''}
                onChange={(e) => setFormData({ ...formData, notificationPhone: e.target.value })}
                className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3.5 py-2 text-sm font-semibold text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                placeholder="Ex: +221 77 123 45 67"
              />
              <span className="text-[11px] text-[#7A756D] mt-1 block">
                Ouvre l'application Messages (SMS natif) ou WhatsApp sur mobile et ordinateur.
              </span>
            </div>
          </div>

          {/* Option d'envoi automatique à l'enregistrement */}
          <div className="pt-3 border-t border-[#EBE8E0] space-y-2">
            <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoSendMessageOnSave !== false}
                onChange={(e) => setFormData({ ...formData, autoSendMessageOnSave: e.target.checked })}
                className="w-4 h-4 text-[#2D5A43] rounded border-[#DCD6CB] focus:ring-[#2D5A43] cursor-pointer"
              />
              <span>Envoyer automatiquement le message de synthèse dès qu'on enregistre le journal</span>
            </label>
            <p className="text-[11px] text-[#7A756D] pl-6">
              Prépare et ouvre automatiquement le message de synthèse de caisse prêt à l'envoi lors de l'enregistrement.
            </p>
          </div>
        </div>

        {/* 2. Horodatage, Date & Synchronisation de Caisse (Temps Réel) */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4" id="settings-datetime-sync-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE8E0] pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#2D5A43]" />
              <div>
                <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
                  Date, Heure & Synchronisation de Caisse
                </h3>
                <p className="text-[11px] text-[#7A756D] font-editorial italic">
                  Horodatage automatique en direct appliqué à tous vos journaux et reçus de caisse
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualTimeSync}
              className="inline-flex items-center space-x-1.5 bg-[#EBE8E0] hover:bg-[#DCD6CB] text-[#2D5A43] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
              title="Forcer la synchronisation avec l'horloge système"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${justSyncedTime ? 'animate-spin text-[#2D5A43]' : ''}`} />
              <span>{justSyncedTime ? 'Horloge synchronisée !' : 'Actualiser l’horloge'}</span>
            </button>
          </div>

          {/* Real-time preview banner (Header Pill Match) */}
          <div className="bg-[#F4F1EA] border border-[#DCD6CB] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-[#7A756D] uppercase tracking-wider block mb-1.5 font-editorial">
                Affichage en direct sur l'en-tête et les reçus :
              </span>
              
              {/* Exact Live Pill as in Header */}
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E7EFEA] border border-[#C3D9CD] text-xs sm:text-sm font-medium text-[#2D5A43] shadow-xs"
                title="Date et heure exactes synchronisées"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D5A43] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2D5A43]"></span>
                </span>
                <Calendar className="w-4 h-4 text-[#2D5A43]" />
                <span className="capitalize font-bold text-[#1B3628]">{formattedDateLong}</span>
                <span className="text-[#8C877E]">•</span>
                <Clock className="w-4 h-4 text-[#2D5A43]" />
                <span className="font-mono text-[#1B3628] font-bold tracking-wider">{timeStr}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 text-xs text-[#5C574F]">
              <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-xl px-3 py-2">
                <span className="text-[10px] text-[#8C877E] uppercase font-bold block">Fuseau Détecté</span>
                <span className="font-semibold text-[#1A1A1A] flex items-center gap-1 mt-0.5">
                  <Globe className="w-3.5 h-3.5 text-[#2D5A43]" />
                  {detectedTimezone}
                </span>
              </div>

              <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-xl px-3 py-2">
                <span className="text-[10px] text-[#8C877E] uppercase font-bold block">Statut Système</span>
                <span className="font-semibold text-[#2D5A43] flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A43]" />
                  Horodatage Certifié
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Tarification par défaut */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#EBE8E0] pb-3">
            <Coins className="w-5 h-5 text-[#2D5A43]" />
            <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
              Tarification & Prix par Défaut
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1 font-editorial">
                Nom du Produit / Article
              </label>
              <input
                type="text"
                value={formData.defaultProductName}
                onChange={(e) => setFormData({ ...formData, defaultProductName: e.target.value })}
                className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3.5 py-2 text-sm font-semibold text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                placeholder="ex: Pain / Baguette"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1 font-editorial">
                Prix de Vente Unitaire ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formData.defaultSellingPrice}
                onChange={(e) => setFormData({ ...formData, defaultSellingPrice: Number(e.target.value) || 0 })}
                className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3.5 py-2 text-sm font-bold text-[#1A1A1A] font-mono-num focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
              />
              <span className="text-[11px] text-[#7A756D] mt-1 block font-editorial italic">Exemple dans le cahier : 175 CFA</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A463F] mb-1 font-editorial">
                Prix de Reprise Retour ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formData.defaultReturnPrice}
                onChange={(e) => setFormData({ ...formData, defaultReturnPrice: Number(e.target.value) || 0 })}
                className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3.5 py-2 text-sm font-bold text-[#1A1A1A] font-mono-num focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
              />
              <span className="text-[11px] text-[#7A756D] mt-1 block font-editorial italic">Exemple dans le cahier : 50 CFA</span>
            </div>
          </div>

          {/* Return Loss Auto-Calc Visual Summary in Settings */}
          <div className="bg-[#FAF3E8] border border-[#E8D9C0] rounded-xl p-3 text-xs text-[#9C6B28] flex items-center justify-between">
            <div>
              <strong className="text-[#1A1A1A]">Formule automatique des retours :</strong>
              <span className="ml-1 font-mono-num font-semibold">
                (Retour × {formData.defaultSellingPrice}) - (Retour × {formData.defaultReturnPrice}) = {Math.max(0, formData.defaultSellingPrice - formData.defaultReturnPrice)} {formData.currency} de perte / pain de retour
              </span>
            </div>
            <span className="bg-[#E8D9C0] text-[#78511A] px-2 py-0.5 rounded font-bold font-mono-num shrink-0">
              -{Math.max(0, formData.defaultSellingPrice - formData.defaultReturnPrice)} {formData.currency} / unité
            </span>
          </div>
        </div>

        {/* 3. Identification & Équipe des Vendeurs / Personnel */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE8E0] pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#2D5A43]" />
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
                Identification de l'Équipe (Nom, Tél, Âge, Rôle)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowAddSellerForm(!showAddSellerForm)}
              className="bg-[#2D5A43] hover:bg-[#234735] text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Vendeur</span>
            </button>
          </div>

          <p className="text-xs text-[#7A756D] font-editorial italic">
            Fiches d'identification pré-remplies automatiquement lors de la création de chaque nouveau journal de caisse.
          </p>

          {/* Formulaire d'ajout rapide d'un vendeur avec identification complète */}
          {showAddSellerForm && (
            <div className="bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-[#1A1A1A] font-editorial flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#2D5A43]" />
                <span>Ajouter un vendeur avec ses identifiants</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#4A463F] mb-1 font-editorial">Nom complet *</label>
                  <input
                    type="text"
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                    placeholder="Ex: Moussa Diop"
                    className="w-full bg-white border border-[#DCD6CB] rounded-lg px-3 py-1.5 font-semibold text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A463F] mb-1 font-editorial">Numéro de téléphone</label>
                  <input
                    type="text"
                    value={newSellerPhone}
                    onChange={(e) => setNewSellerPhone(e.target.value)}
                    placeholder="Ex: +221 77 123 45 67"
                    className="w-full bg-white border border-[#DCD6CB] rounded-lg px-3 py-1.5 font-mono-num font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A463F] mb-1 font-editorial">Âge</label>
                  <input
                    type="number"
                    min="16"
                    max="99"
                    value={newSellerAge}
                    onChange={(e) => setNewSellerAge(e.target.value)}
                    placeholder="Ex: 28"
                    className="w-full bg-white border border-[#DCD6CB] rounded-lg px-3 py-1.5 font-mono-num font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A463F] mb-1 font-editorial">Rôle / Statut</label>
                  <select
                    value={newSellerRole}
                    onChange={(e) => setNewSellerRole(e.target.value)}
                    className="w-full bg-white border border-[#DCD6CB] rounded-lg px-3 py-1.5 font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                  >
                    <option value="Vendeur">Vendeur</option>
                    <option value="Vendeur Principal">Vendeur Principal</option>
                    <option value="Livreur">Livreur</option>
                    <option value="Responsable Tournée">Responsable Tournée</option>
                    <option value="Vendeur Junior">Vendeur Junior</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSellerForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#DCD6CB] text-xs font-semibold text-[#5C574F] hover:bg-[#EBE8E0]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddDefaultSeller}
                  className="bg-[#2D5A43] hover:bg-[#234735] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-xs"
                >
                  Enregistrer l'identification
                </button>
              </div>
            </div>
          )}

          {/* Cards des Vendeurs enregistrés avec identification complète */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {formData.defaultSellers.map((sellerItem) => {
              const name = typeof sellerItem === 'string' ? sellerItem : sellerItem.name;
              const phone = typeof sellerItem === 'string' ? '+221 77 000 00 00' : (sellerItem.phone || '+221 77 000 00 00');
              const age = typeof sellerItem === 'string' ? 28 : (sellerItem.age || 28);
              const role = typeof sellerItem === 'string' ? 'Vendeur' : (sellerItem.role || 'Vendeur');

              return (
                <div
                  key={name}
                  className="bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl p-3 flex flex-col justify-between space-y-2 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#1A1A1A] text-sm font-editorial">{name}</h4>
                      <span className="text-[11px] font-medium text-[#2D5A43] bg-[#E7EFEA] px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditSeller(sellerItem)}
                        className="text-[#5C574F] hover:text-[#2D5A43] p-1 rounded transition-colors"
                        title="Modifier ce vendeur"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDefaultSeller(name)}
                        className="text-[#8C877E] hover:text-[#8B3A3A] p-1 rounded transition-colors"
                        title="Supprimer ce vendeur de la liste"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Identification info */}
                  <div className="space-y-1 text-xs text-[#3D3A34] pt-1 border-t border-[#DCD6CB]/60">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#2D5A43]" />
                      <span className="text-[11px] text-[#7A756D] font-editorial">Tél:</span>
                      <span className="font-mono-num font-bold text-[#1A1A1A]">{phone}</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8C877E]" />
                      <span className="text-[11px] text-[#7A756D] font-editorial">Âge:</span>
                      <span className="font-mono-num font-semibold text-[#1A1A1A]">{age} ans</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            id="btn-save-settings"
            className="flex items-center space-x-2 bg-[#2D5A43] hover:bg-[#234735] active:bg-[#1B3628] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-xs"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#A3D9BC]" />
                <span>Paramètres Enregistrés avec Succès !</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Enregistrer les Paramètres</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* 4. Compte Google & Synchronisation Cloud */}
      <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4" id="settings-google-cloud-card">
        <div className="flex items-center space-x-2 border-b border-[#EBE8E0] pb-3">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
          <div>
            <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
              Compte Google & Synchronisation Cloud
            </h3>
            <p className="text-[11px] text-[#7A756D] font-editorial italic">
              Connectez votre compte Google officiel pour synchroniser tous vos journaux et y accéder depuis votre téléphone et ordinateur
            </p>
          </div>
        </div>

        <div className="bg-[#F4F1EA] border border-[#DCD6CB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#1A1A1A]">
              Sauvegarde automatique multi-appareils
            </h4>
            <p className="text-xs text-[#5C574F]">
              En vous connectant avec Google, tous vos journaux enregistrés sont automatiquement sécurisés sur Firestore et accessibles instantanément où que vous soyez.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Enregistrement Automatique sur le PC (Dossier Documents) */}
      <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4" id="settings-pc-folder-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EBE8E0] pb-3">
          <div className="flex items-center space-x-2">
            <FolderDown className="w-5 h-5 text-[#2D5A43]" />
            <div>
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
                Enregistrement Automatique sur PC (Dossier Documents)
              </h3>
              <p className="text-[11px] text-[#7A756D] font-editorial italic">
                Sauvegarde automatique et directe de tous vos journaux dans un dossier de votre ordinateur
              </p>
            </div>
          </div>

          {folderName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EFEA] border border-[#C3D9CD] text-xs font-bold text-[#2D5A43]">
              <span className="w-2 h-2 rounded-full bg-[#2D5A43] animate-pulse"></span>
              Connecté : {folderName}
            </span>
          )}
        </div>

        <div className="bg-[#F4F1EA] border border-[#DCD6CB] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-[#1A1A1A] font-editorial">
              {folderName ? `Dossier actif : Documents > ${folderName}` : 'Aucun dossier PC connecté pour le moment'}
            </h4>
            <p className="text-xs text-[#5C574F]">
              En connectant votre dossier (ex: <code className="bg-[#EBE8E0] px-1.5 py-0.5 rounded text-[#1A1A1A] font-mono font-bold">Documents/Journaux_Caisse</code>), chaque enregistrement génère automatiquement les fichiers JSON, Excel CSV et Reçus texte sur votre disque dur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasFsAccess && (
              <>
                <button
                  type="button"
                  onClick={handleConnectPcFolder}
                  className="bg-[#2D5A43] hover:bg-[#234735] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{folderName ? 'Changer de dossier' : 'Choisir mon dossier Documents'}</span>
                </button>

                {folderName && (
                  <button
                    type="button"
                    onClick={handleSyncAllToFolderNow}
                    disabled={isSyncingFolder}
                    className="bg-[#FAFAF7] hover:bg-[#EBE8E0] text-[#1A1A1A] border border-[#DCD6CB] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#2D5A43] ${isSyncingFolder ? 'animate-spin' : ''}`} />
                    <span>Synchroniser tout ({journals.length})</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => downloadExcelWorkbook(journals, formData)}
              className="bg-[#2D5A43] hover:bg-[#234735] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#A1D9B8]" />
              <span>Grand Classeur Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadZipArchive}
              disabled={isSyncingFolder}
              className="bg-[#EBE8E0] hover:bg-[#DCD6CB] text-[#1A1A1A] border border-[#DCD6CB] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileArchive className="w-4 h-4 text-[#9C6B28]" />
              <span>Télécharger le dossier complet (.ZIP)</span>
            </button>
          </div>
        </div>

        {folderSyncMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
              folderSyncMsg.type === 'success'
                ? 'bg-[#E7EFEA] text-[#1B3628] border border-[#C3D9CD]'
                : 'bg-[#FDF2F2] text-[#8B3A3A] border border-[#F5C2C2]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2D5A43]" />
              <span>{folderSyncMsg.text}</span>
            </div>
            <button onClick={() => setFolderSyncMsg(null)} className="text-xs opacity-60 hover:opacity-100 font-bold px-1">✕</button>
          </div>
        )}
      </div>

      {/* 5. Sauvegarde & Restauration des Données */}
      <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-[#EBE8E0] pb-3">
          <Download className="w-5 h-5 text-[#5C574F]" />
          <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
            Sauvegarde, Sécurité & Réinitialisation
          </h3>
        </div>

        <p className="text-xs text-[#7A756D] font-editorial italic">
          Vos journaux sont stockés en sécurité directement dans votre navigateur. Vous pouvez exporter une sauvegarde sur votre ordinateur ou téléphone à tout moment.
        </p>

        {importError && (
          <div className="p-3 bg-[#F8EDED] border border-[#E8C0C0] rounded-xl text-xs text-[#8B3A3A] font-semibold">
            {importError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          {/* Export JSON */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center justify-center space-x-2 bg-[#EBE8E0] hover:bg-[#DCD6CB] border border-[#DCD6CB] p-3 rounded-xl text-xs font-semibold text-[#1A1A1A] transition-colors"
          >
            <Download className="w-4 h-4 text-[#5C574F]" />
            <span>Télécharger Sauvegarde (JSON)</span>
          </button>

          {/* Import JSON */}
          <label className="flex items-center justify-center space-x-2 bg-[#EBE8E0] hover:bg-[#DCD6CB] border border-[#DCD6CB] p-3 rounded-xl text-xs font-semibold text-[#1A1A1A] transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-[#5C574F]" />
            <span>Restaurer une Sauvegarde</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          {/* Reset to Demo */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Voulez-vous recharger les données types d’exemple (comme dans l’image Excel) ?')) {
                onResetAllData();
              }
            }}
            className="flex items-center justify-center space-x-2 bg-[#F8EDED] hover:bg-[#F3DDDD] border border-[#E8C0C0] p-3 rounded-xl text-xs font-semibold text-[#8B3A3A] transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-[#8B3A3A]" />
            <span>Réinitialiser Données Démo</span>
          </button>

        </div>
      </div>

    </div>
  );
};
