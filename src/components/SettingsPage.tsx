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
  CheckCircle2, 
  Calendar,
  ShieldCheck,
  Globe,
  Camera,
  Zap,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import defaultStoreLogo from '../assets/images/store_profile_logo_1788716413614.jpg';

interface SettingsPageProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  journals: DailyJournal[];
  onImportJournals: (journals: DailyJournal[]) => void;
  onResetAllData: () => void;
  currentJournal?: DailyJournal;
  onUpdateCurrentJournal?: (journal: DailyJournal) => void;
  onSelectJournal?: (journal: DailyJournal) => void;
  onNavigateToJournal?: () => void;
  onOpenMultiAppModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  journals,
  onImportJournals,
  onResetAllData,
  currentJournal,
  onUpdateCurrentJournal,
  onSelectJournal,
  onNavigateToJournal,
  onOpenMultiAppModal,
}) => {
  const { formattedDateLong, timeStr, refreshNow, now, todayStr: liveTodayStr } = useLiveDateTime();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [selectedJournalDate, setSelectedJournalDate] = useState<string>(() => {
    return currentJournal?.date || liveTodayStr || new Date().toISOString().split('T')[0];
  });
  const [unitSellingPrice, setUnitSellingPrice] = useState<number>(() => {
    return currentJournal?.unitSellingPrice || settings.defaultSellingPrice;
  });
  const [unitReturnPrice, setUnitReturnPrice] = useState<number>(() => {
    return currentJournal?.unitReturnPrice || settings.defaultReturnPrice;
  });

  const getOffsetDateString = (daysOffset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleDateChange = (newDate: string) => {
    setSelectedJournalDate(newDate);
    const existing = journals.find((j) => j.date === newDate);
    if (existing) {
      setUnitSellingPrice(existing.unitSellingPrice);
      setUnitReturnPrice(existing.unitReturnPrice);
      if (onSelectJournal) onSelectJournal(existing);
    } else if (currentJournal && onUpdateCurrentJournal) {
      const updated = {
        ...currentJournal,
        date: newDate,
        id: `journal-${newDate}`,
        updatedAt: new Date().toISOString(),
      };
      onUpdateCurrentJournal(updated);
    }
  };

  const handleSellingPriceChange = (val: number) => {
    setUnitSellingPrice(val);
    setFormData((prev) => ({ ...prev, defaultSellingPrice: val }));
    if (currentJournal && onUpdateCurrentJournal) {
      const newSummary = calculateJournalSummary(
        currentJournal.sellers,
        val,
        unitReturnPrice,
        currentJournal.unitCostPrice,
        currentJournal.expenses,
        settings.calculationFormula
      );
      onUpdateCurrentJournal({
        ...currentJournal,
        unitSellingPrice: val,
        summary: newSummary,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleReturnPriceChange = (val: number) => {
    setUnitReturnPrice(val);
    setFormData((prev) => ({ ...prev, defaultReturnPrice: val }));
    if (currentJournal && onUpdateCurrentJournal) {
      const newSummary = calculateJournalSummary(
        currentJournal.sellers,
        unitSellingPrice,
        val,
        currentJournal.unitCostPrice,
        currentJournal.expenses,
        settings.calculationFormula
      );
      onUpdateCurrentJournal({
        ...currentJournal,
        unitReturnPrice: val,
        summary: newSummary,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [justSyncedTime, setJustSyncedTime] = useState(false);
  const [profileLogo, setProfileLogo] = useState<string>(() => {
    return localStorage.getItem('app_custom_profile_logo') || defaultStoreLogo;
  });

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

  const handleResetLogo = () => {
    localStorage.removeItem('app_custom_profile_logo');
    setProfileLogo(defaultStoreLogo);
    window.dispatchEvent(new Event('profile-logo-updated'));
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
        
        {/* Configurations du jour : Date, Prix Vente et Prix Retour (Section déplacée depuis le Journal) */}
        <div id="section-daily-config-pasted" className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE8E0] pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#2D5A43]" />
              <div>
                <h3 className="font-bold text-[#1A1A1A] font-editorial text-base">
                  Date et Prix du Journal de Caisse
                </h3>
                <p className="text-xs text-[#7A756D] font-editorial italic">
                  Configurations de date et prix unitaires appliqués à la comptabilité des vendeurs
                </p>
              </div>
            </div>

            {onNavigateToJournal && (
              <button
                type="button"
                id="btn-return-to-journal"
                onClick={onNavigateToJournal}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#2D5A43] hover:bg-[#234735] text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <span>Accéder au Journal de Caisse →</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Colonne 1 : Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A463F] flex items-center gap-1.5 font-editorial">
                <Calendar className="w-3.5 h-3.5 text-[#2D5A43]" />
                <span>Date du journal</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  id="input-journal-date"
                  type="date"
                  value={selectedJournalDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="flex-1 bg-[#F4F1EA] border border-[#DCD6CB] rounded-lg px-3 py-1.5 text-[#1A1A1A] font-semibold font-mono-num focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                />

                <button
                  id="btn-set-today-date"
                  type="button"
                  onClick={() => handleDateChange(liveTodayStr)}
                  title="Mettre à jour sur la date actuelle du jour"
                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0 ${
                    selectedJournalDate === liveTodayStr
                      ? 'bg-[#2D5A43] text-white border-[#2D5A43] shadow-xs'
                      : 'bg-[#EBE8E0] text-[#3D3A34] hover:bg-[#DCD6CB] border-[#DCD6CB]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Aujourd'hui</span>
                </button>
              </div>

              {/* Quick date chips */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
                <button
                  type="button"
                  onClick={() => handleDateChange(getOffsetDateString(-1))}
                  className="px-2 py-0.5 rounded-md bg-[#EBE8E0] hover:bg-[#DCD6CB] text-[#4A463F] text-[11px] font-medium border border-[#DCD6CB] transition-colors cursor-pointer"
                >
                  Hier
                </button>
                <button
                  type="button"
                  onClick={() => handleDateChange(liveTodayStr)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                    selectedJournalDate === liveTodayStr
                      ? 'bg-[#E7EFEA] text-[#2D5A43] border-[#C3D9CD]'
                      : 'bg-[#FAFAF7] hover:bg-[#EBE8E0] text-[#2D5A43] border-[#DCD6CB]'
                  }`}
                >
                  Aujourd'hui
                </button>
              </div>
            </div>

            {/* Colonne 2 : Prix de Vente Unitaire (CFA) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A463F] flex items-center justify-between font-editorial">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2D5A43]"></span>
                  <span>Prix Vente Unitaire</span>
                </span>
                <span className="text-[10px] text-[#2D5A43] font-semibold font-mono-num">
                  Appliqué aux vendeurs
                </span>
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="input-unit-selling-price"
                    type="number"
                    min="0"
                    value={unitSellingPrice}
                    onChange={(e) => handleSellingPriceChange(Number(e.target.value) || 0)}
                    className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-lg px-3 py-1.5 text-[#1A1A1A] font-bold font-mono-num text-base focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#7A756D] pointer-events-none">
                    {formData.currency}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#7A756D] italic">
                Recette par vendeur = Vente × {unitSellingPrice} {formData.currency}
              </p>
            </div>

            {/* Colonne 3 : Prix de Retour Reprise (CFA) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#4A463F] flex items-center justify-between font-editorial">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9C6B28]"></span>
                  <span>Prix Retour Reprise</span>
                </span>
                <span className="text-[10px] text-[#8B3A3A] font-semibold font-mono-num">
                  Perte : {Math.max(0, unitSellingPrice - unitReturnPrice)} {formData.currency}/pain
                </span>
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="input-unit-return-price"
                    type="number"
                    min="0"
                    value={unitReturnPrice}
                    onChange={(e) => handleReturnPriceChange(Number(e.target.value) || 0)}
                    className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-lg px-3 py-1.5 text-[#9C6B28] font-bold font-mono-num text-base focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#9C6B28]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-[#7A756D] pointer-events-none">
                    {formData.currency}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#7A756D] italic">
                Perte retours = Retours × ({unitSellingPrice} - {unitReturnPrice})
              </p>
            </div>
          </div>
        </div>

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

          {/* Profil / Logo du Commerce */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F1EA]/70 p-3.5 rounded-xl border border-[#DCD6CB] mt-2">
            <div className="flex items-center space-x-3.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-[#2D5A43]/30 bg-[#1B382B] shrink-0">
                <img
                  src={profileLogo}
                  alt="Logo du commerce"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = defaultStoreLogo;
                  }}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1A1A1A] font-editorial">Photo de profil & Logo de l'établissement</p>
                <p className="text-[11px] text-[#7A756D] font-editorial italic">
                  Visible dans l'en-tête de page et sur vos bilans
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2D5A43] hover:bg-[#234735] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-all">
                <Camera className="w-3.5 h-3.5" />
                <span>Changer la photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
              {localStorage.getItem('app_custom_profile_logo') && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#EBE8E0] text-[#5C574F] border border-[#DCD6CB] text-xs font-semibold rounded-lg cursor-pointer transition-all"
                  title="Rétablir le logo officiel"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rétablir</span>
                </button>
              )}
            </div>
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

        {/* Section Synchronisation Multi-Applications (Cloud Run & GitHub Pages) */}
        {onOpenMultiAppModal && (
          <div className="bg-white border border-[#DCD6CB] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#E7EFEA] border border-[#C3D9CD] flex items-center justify-center text-[#2D5A43] shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1A1A1A] font-editorial flex items-center gap-2">
                    <span>Synchronisation avec GitHub Pages</span>
                    <span className="bg-[#E7EFEA] text-[#2D5A43] text-[10px] px-2 py-0.5 rounded-full font-bold border border-[#C3D9CD]">
                      Base Commune
                    </span>
                  </h3>
                  <p className="text-xs text-[#5C574F]">
                    Partagez les utilisateurs, comptes et les 6 données de caisse avec votre application GitHub Pages.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenMultiAppModal}
                className="inline-flex items-center justify-center space-x-2 bg-[#2D5A43] hover:bg-[#234735] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
              >
                <Database className="w-4 h-4" />
                <span>Ouvrir la Configuration</span>
              </button>
            </div>
          </div>
        )}



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
    </div>
  );
};
