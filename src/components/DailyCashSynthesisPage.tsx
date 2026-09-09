import React, { useState, useMemo } from 'react';
import { DailyJournal, AppSettings } from '../types';
import { 
  formatCurrency, 
  formatNumber, 
  formatDateFrench 
} from '../utils/calculations';
import { 
  Calculator, 
  Calendar, 
  Users, 
  Receipt, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight, 
  Cloud, 
  TrendingUp, 
  AlertCircle,
  Coins,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';

interface DailyCashSynthesisPageProps {
  currentJournal: DailyJournal;
  journals: DailyJournal[];
  settings: AppSettings;
  onSelectJournalForEditing: (journal: DailyJournal) => void;
  onPrintJournal: (journal: DailyJournal) => void;
  onSyncCloud?: () => Promise<void>;
  isCloudSyncing?: boolean;
}

export const DailyCashSynthesisPage: React.FC<DailyCashSynthesisPageProps> = ({
  currentJournal,
  journals,
  settings,
  onSelectJournalForEditing,
  onPrintJournal,
  onSyncCloud,
  isCloudSyncing,
}) => {
  const [selectedJournalId, setSelectedJournalId] = useState<string>(currentJournal.id);
  const [copied, setCopied] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active journal to display
  const activeJournal = useMemo(() => {
    return journals.find((j) => j.id === selectedJournalId) || currentJournal;
  }, [journals, selectedJournalId, currentJournal]);

  const summary = activeJournal?.summary || {
    totalProducedOrGiven: 0,
    totalSold: 0,
    totalReturned: 0,
    totalLost: 0,
    lossPerReturnUnit: 125,
    returnLossAmount: 0,
    missingLossAmount: 0,
    grossRevenue: 0,
    returnPriceTotal: 0,
    lossAmount: 0,
    totalExpenses: 0,
    netGain: 0,
    salePercentage: 0,
    returnPercentage: 0,
    lossPercentage: 0,
  };

  const unitSellingPrice = Number(activeJournal?.unitSellingPrice) || settings.defaultSellingPrice || 175;
  const unitReturnPrice = Number(activeJournal?.unitReturnPrice) || settings.defaultReturnPrice || 50;
  const lossPerUnit = Math.max(0, unitSellingPrice - unitReturnPrice);

  const sellers = activeJournal?.sellers || [];
  const expenses = activeJournal?.expenses || [];

  // Generate text for sharing (WhatsApp, SMS, etc.)
  const generateShareText = () => {
    const lines = [
      `📊 SYNTHÈSE JOURNALIÈRE DE CAISSE - ${settings.businessName || 'BOULANGERIE'}`,
      `📅 Date : ${formatDateFrench(activeJournal.date)}`,
      `🍞 Produit : ${activeJournal.productName || 'Pain / Baguette'}`,
      `🏷️ Prix de Vente : ${unitSellingPrice} ${settings.currency}`,
      `-----------------------------------------`,
      `📦 Total Confié : ${formatNumber(summary.totalProducedOrGiven)} pains`,
      `✅ Total Vendu : ${formatNumber(summary.totalSold)} pains (${summary.salePercentage}%)`,
      `↩️ Total Retours : ${formatNumber(summary.totalReturned)} pains (${summary.returnPercentage}%)`,
      `💰 Chiffre d'Affaires Brut : ${formatCurrency(summary.grossRevenue, settings.currency)}`,
      `📉 Pertes Retours : -${formatCurrency(summary.returnLossAmount, settings.currency)}`,
      `💸 Dépenses : -${formatCurrency(summary.totalExpenses, settings.currency)}`,
      `-----------------------------------------`,
      `🏆 GAIN NET DE CAISSE : ${formatCurrency(summary.netGain, settings.currency)}`,
      `-----------------------------------------`,
      `👥 DÉTAIL VENDEURS (${sellers.length}) :`,
      ...sellers.map((s) => {
        const sold = Number(s.soldCount) || 0;
        const ret = Number(s.returnCount) || 0;
        const rev = Number(s.cashCollected) || (sold * unitSellingPrice);
        return `• ${s.name} : Confié ${s.totalGiven} | Vente ${sold} | Retour ${ret} | Recette ${formatCurrency(rev, settings.currency)}`;
      }),
    ];

    if (expenses.length > 0) {
      lines.push(`-----------------------------------------`);
      lines.push(`🧾 DÉTAIL DÉPENSES (${expenses.length}) :`);
      expenses.forEach((e) => {
        lines.push(`• ${e.label} : ${formatCurrency(e.amount, settings.currency)}`);
      });
    }

    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    try {
      const text = generateShareText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#2D5A43] flex items-center justify-center text-white shadow-2xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#1A1A1A] tracking-tight">
                Synthèse Journalière de Caisse
              </h2>
              <p className="text-xs sm:text-sm text-[#7A756D] font-editorial">
                Vue consolidée et synchronisée : Total Confié, Vente, Retour, Prix Vente, Dépenses et Gain Net.
              </p>
            </div>
          </div>
        </div>

        {/* Sélecteur de date & Actions rapides */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center space-x-2 bg-[#EBE8E0] px-3 py-1.5 rounded-xl border border-[#DCD6CB]">
            <Calendar className="w-4 h-4 text-[#2D5A43]" />
            <span className="text-xs font-semibold text-[#5C574F] font-editorial whitespace-nowrap">
              Date :
            </span>
            <select
              id="select-synthesis-journal-date"
              value={activeJournal.id}
              onChange={(e) => setSelectedJournalId(e.target.value)}
              aria-label="Sélectionner la date du journal pour la synthèse"
              className="bg-[#FAFAF7] border border-[#DCD6CB] text-[#1A1A1A] text-xs font-bold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-[#2D5A43] focus:outline-none cursor-pointer font-mono-num"
            >
              {journals.map((j) => (
                <option key={j.id} value={j.id}>
                  {formatDateFrench(j.date)} — Net: {formatCurrency(j.summary?.netGain ?? 0, settings.currency)}
                </option>
              ))}
            </select>
          </div>

          {/* Sync Cloud Button */}
          {onSyncCloud && (
            <button
              type="button"
              id="btn-sync-cloud-synthesis"
              onClick={async () => {
                try {
                  await onSyncCloud();
                  setSyncStatusMsg({
                    type: 'success',
                    text: 'Synchronisation Cloud Firestore effectuée avec succès !',
                  });
                  setTimeout(() => setSyncStatusMsg(null), 3500);
                } catch (err) {
                  setSyncStatusMsg({
                    type: 'error',
                    text: 'Erreur lors de la synchronisation cloud.',
                  });
                  setTimeout(() => setSyncStatusMsg(null), 3500);
                }
              }}
              disabled={isCloudSyncing}
              className="flex items-center space-x-1.5 px-3 py-2 bg-[#E7EFEA] hover:bg-[#D8EADB] text-[#2D5A43] border border-[#C3D9CD] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 min-h-[44px] active:scale-95"
              title="Synchroniser ce journal immédiatement avec Firestore"
            >
              <Cloud className={`w-3.5 h-3.5 text-[#2D5A43] ${isCloudSyncing ? 'animate-bounce' : ''}`} />
              <span>{isCloudSyncing ? 'Synchronisation...' : 'Synchroniser Cloud'}</span>
            </button>
          )}

          {/* Action : Imprimer le Ticket */}
          <button
            type="button"
            id="btn-print-ticket-synthesis"
            onClick={() => onPrintJournal(activeJournal)}
            className="flex items-center space-x-1.5 bg-[#F4F1EA] hover:bg-[#EBE8E0] text-[#1A1A1A] border border-[#DCD6CB] px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-colors min-h-[44px] active:scale-95"
            title="Imprimer le ticket de caisse de cette journée"
          >
            <Printer className="w-3.5 h-3.5 text-[#2D5A43]" />
            <span>Ticket de Caisse</span>
          </button>

          {/* Action : Ouvrir dans l'éditeur */}
          <button
            type="button"
            id="btn-edit-journal-from-synthesis"
            onClick={() => onSelectJournalForEditing(activeJournal)}
            className="flex items-center space-x-1.5 bg-[#2D5A43] hover:bg-[#234735] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all min-h-[44px] active:scale-95"
            title="Ouvrir ce journal pour modifier les quantités confiées, ventes ou dépenses"
          >
            <span>Modifier la Journée</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between animate-fadeIn ${
            syncStatusMsg.type === 'success'
              ? 'bg-[#E7EFEA] border-[#C3D9CD] text-[#2D5A43]'
              : 'bg-[#FDF2F2] border-[#FADBD8] text-[#8B3A3A]'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{syncStatusMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncStatusMsg(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 2. GRANDES MÉTRIQUES DE CAISSE (6 CARTES KPI SYNCHRONISÉES) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 : Total Confié */}
        <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#7A756D] uppercase tracking-wider font-editorial block">
            Total Confié
          </span>
          <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] font-mono-num mt-1">
            {formatNumber(summary.totalProducedOrGiven)}
          </p>
          <span className="text-[10px] text-[#7A756D] font-medium block mt-0.5">
            Pains remis aux vendeurs
          </span>
        </div>

        {/* KPI 2 : Total Vendu */}
        <div className="bg-[#E7EFEA] border border-[#C3D9CD] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#2D5A43] uppercase tracking-wider font-editorial">
              Total Vendu
            </span>
            <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-[#2D5A43] text-white">
              {summary.salePercentage}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#2D5A43] font-mono-num mt-1">
            {formatNumber(summary.totalSold)}
          </p>
          <span className="text-[10px] text-[#2D5A43]/80 font-medium block mt-0.5">
            Pains écoulés
          </span>
        </div>

        {/* KPI 3 : Retours Invendus */}
        <div className="bg-[#FAF3E8] border border-[#E8D9C0] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#9C6B28] uppercase tracking-wider font-editorial">
              Retours
            </span>
            <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-[#9C6B28] text-white">
              {summary.returnPercentage}%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#9C6B28] font-mono-num mt-1">
            {formatNumber(summary.totalReturned)}
          </p>
          <span className="text-[10px] text-[#8B3A3A] font-medium block mt-0.5">
            Perte : -{formatCurrency(summary.returnLossAmount, settings.currency)}
          </span>
        </div>

        {/* KPI 4 : Prix de Vente Unitaire */}
        <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#7A756D] uppercase tracking-wider font-editorial block">
            Prix Vente Unitaire
          </span>
          <p className="text-xl sm:text-2xl font-bold text-[#1A1A1A] font-mono-num mt-1">
            {unitSellingPrice} <span className="text-xs font-normal text-[#7A756D]">{settings.currency}</span>
          </p>
          <span className="text-[10px] text-[#7A756D] font-medium block mt-0.5">
            Reprise : {unitReturnPrice} {settings.currency}
          </span>
        </div>

        {/* KPI 5 : Dépenses de la Journée */}
        <div className="bg-[#FDF2F2] border border-[#FADBD8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#8B3A3A] uppercase tracking-wider font-editorial block">
            Total Dépenses
          </span>
          <p className="text-xl sm:text-2xl font-bold text-[#8B3A3A] font-mono-num mt-1">
            {formatCurrency(summary.totalExpenses, settings.currency)}
          </p>
          <span className="text-[10px] text-[#8B3A3A]/80 font-medium block mt-0.5">
            {expenses.length} dépense(s) déduite(s)
          </span>
        </div>

        {/* KPI 6 : Bénéfice / Gain Net de Caisse */}
        <div className="bg-[#2D5A43] border border-[#234735] text-white rounded-2xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D8EADB] uppercase tracking-wider font-editorial">
              Gain Net Caisse
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
              Net Final
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white font-mono-num mt-1">
            {formatCurrency(summary.netGain, settings.currency)}
          </p>
          <span className="text-[10px] text-[#D8EADB] font-medium block mt-0.5">
            Recette - Dépenses - Pertes
          </span>
        </div>
      </div>

      {/* 3. SECTION COMPTABILITÉ DÉTAILLÉE PAR VENDEUR / LIVREUR */}
      <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE8E0] pb-4">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-[#2D5A43]" />
            <div>
              <h3 className="font-bold text-base font-editorial text-[#1A1A1A]">
                Comptabilité des Vendeurs / Livreurs ({sellers.length} vendeurs)
              </h3>
              <p className="text-xs text-[#7A756D] font-editorial">
                Détail pour la journée du {formatDateFrench(activeJournal.date)} — Produit : {activeJournal.productName || 'Pain / Baguette'}
              </p>
            </div>
          </div>

          {/* Boutons Partager & Copier */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-copy-synthesis-text"
              onClick={handleCopySummary}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#F4F1EA] hover:bg-[#EBE8E0] text-[#1A1A1A] border border-[#DCD6CB] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              title="Copier la synthèse complète dans le presse-papiers"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2D5A43]" />
                  <span className="text-[#2D5A43] font-bold">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#5C574F]" />
                  <span>Copier le Bilan</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-share-whatsapp-synthesis"
              onClick={handleShareWhatsApp}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/40 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              title="Partager le bilan complet sur WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager WhatsApp</span>
            </button>
          </div>
        </div>

        {/* VUE MOBILE (sm:hidden) : Cartes Vendeurs Synthèse */}
        <div className="block sm:hidden space-y-2.5">
          {sellers.length === 0 ? (
            <div className="p-6 text-center text-[#7A756D] bg-white rounded-xl border border-[#EBE8E0] italic text-xs">
              Aucun vendeur enregistré pour cette journée.
            </div>
          ) : (
            sellers.map((s, index) => {
              const sGiven = Number(s.totalGiven) || 0;
              const sSold = Number(s.soldCount) || 0;
              const sReturn = Number(s.returnCount) || 0;
              const sLoss = sReturn * lossPerUnit;
              const sRev = Number(s.cashCollected) || (sSold * unitSellingPrice);

              return (
                <div key={s.id} className="bg-white rounded-xl border border-[#EBE8E0] p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-[#2D5A43]/10 text-[#2D5A43] text-[10px] font-bold font-mono-num flex items-center justify-center">
                        {index + 1}
                      </span>
                      <strong className="text-xs text-[#1A1A1A]">{s.name}</strong>
                    </div>
                    <span className="text-[10px] text-[#7A756D] font-mono-num">
                      {unitSellingPrice} {settings.currency}/pain
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center bg-[#F4F1EA]/60 p-2 rounded-lg text-xs">
                    <div>
                      <span className="text-[9px] text-[#5C574F] uppercase block">Confié</span>
                      <strong className="text-xs font-mono-num text-[#1A1A1A]">{formatNumber(sGiven)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#2D5A43] uppercase block">Vendu</span>
                      <strong className="text-xs font-mono-num text-[#2D5A43]">{formatNumber(sSold)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9C6B28] uppercase block">Retour</span>
                      <strong className="text-xs font-mono-num text-[#9C6B28]">{formatNumber(sReturn)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#F4F1EA]">
                    <div>
                      {sLoss > 0 && (
                        <span className="text-[10px] text-[#8B3A3A] font-semibold">
                          Perte : -{formatCurrency(sLoss, settings.currency)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#7A756D] mr-1">Recette :</span>
                      <strong className="text-xs font-bold text-[#2D5A43] font-mono-num">
                        {formatCurrency(sRev, settings.currency)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tableau Récapitulatif Vendeurs (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#EBE8E0]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#DCD6CB] text-[#5C574F] bg-[#F4F1EA]">
                <th className="py-3 px-3 font-editorial font-bold">Vendeur / Livreur</th>
                <th className="py-3 px-3 text-center font-editorial font-bold">Total Confié</th>
                <th className="py-3 px-3 text-center text-[#2D5A43] font-editorial font-bold">Vente</th>
                <th className="py-3 px-3 text-center text-[#9C6B28] font-editorial font-bold">Retour</th>
                <th className="py-3 px-3 text-center font-editorial font-bold">Prix Vente</th>
                <th className="py-3 px-3 text-right text-[#8B3A3A] font-editorial font-bold">Perte Retours</th>
                <th className="py-3 px-4 text-right font-editorial font-bold text-[#1A1A1A]">Recette Encaissée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E0] bg-white">
              {sellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#7A756D] italic">
                    Aucun vendeur enregistré pour cette journée.
                  </td>
                </tr>
              ) : (
                sellers.map((s) => {
                  const sGiven = Number(s.totalGiven) || 0;
                  const sSold = Number(s.soldCount) || 0;
                  const sReturn = Number(s.returnCount) || 0;
                  const sLoss = sReturn * lossPerUnit;
                  const sRev = Number(s.cashCollected) || (sSold * unitSellingPrice);

                  return (
                    <tr key={s.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#1A1A1A]">{s.name}</div>
                        {s.role && (
                          <div className="text-[10px] text-[#7A756D]">{s.role} {s.phone ? `• ${s.phone}` : ''}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-num font-medium text-[#1A1A1A]">
                        {formatNumber(sGiven)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#2D5A43] font-mono-num">
                        {formatNumber(sSold)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#9C6B28] font-mono-num font-bold">
                        {formatNumber(sReturn)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-num text-[#5C574F]">
                        {unitSellingPrice} {settings.currency}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8B3A3A] font-mono-num">
                        {sLoss > 0 ? `-${formatCurrency(sLoss, settings.currency)}` : '0 CFA'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-[#1A1A1A] font-mono-num text-sm">
                        {formatCurrency(sRev, settings.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#EAE7DF] font-bold text-[#1A1A1A] border-t-2 border-[#DCD6CB]">
                <td className="py-3 px-3">TOTAL CAISSE DU JOUR</td>
                <td className="py-3 px-3 text-center font-mono-num">{formatNumber(summary.totalProducedOrGiven)}</td>
                <td className="py-3 px-3 text-center text-[#2D5A43] font-mono-num">{formatNumber(summary.totalSold)}</td>
                <td className="py-3 px-3 text-center text-[#9C6B28] font-mono-num">{formatNumber(summary.totalReturned)}</td>
                <td className="py-3 px-3 text-center font-mono-num text-[#5C574F]">{unitSellingPrice} {settings.currency}</td>
                <td className="py-3 px-3 text-right text-[#8B3A3A] font-mono-num">
                  -{formatCurrency(summary.returnLossAmount, settings.currency)}
                </td>
                <td className="py-3 px-4 text-right text-[#2D5A43] font-mono-num text-sm">
                  {formatCurrency(summary.grossRevenue, settings.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. SECTION DÉPENSES & RAPPROCHEMENT DE CAISSE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloc Dépenses */}
        <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#EBE8E0] pb-3">
            <h4 className="font-bold text-sm font-editorial text-[#1A1A1A] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#8B3A3A]" />
              <span>Dépenses de la Journée ({expenses.length})</span>
            </h4>
            <span className="text-xs font-bold text-[#8B3A3A] font-mono-num">
              Total : {formatCurrency(summary.totalExpenses, settings.currency)}
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="py-8 text-center text-[#7A756D] text-xs italic bg-white rounded-xl border border-[#EBE8E0]">
              Aucune dépense enregistrée pour ce jour.
            </div>
          ) : (
            <div className="divide-y divide-[#EBE8E0] bg-white rounded-xl border border-[#EBE8E0] overflow-hidden">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span className="font-medium text-[#1A1A1A]">{exp.label}</span>
                  <span className="font-bold text-[#8B3A3A] font-mono-num">
                    -{formatCurrency(exp.amount, settings.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloc Rapprochement Financier */}
        <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#EBE8E0] pb-3">
              <h4 className="font-bold text-sm font-editorial text-[#1A1A1A] flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#2D5A43]" />
                <span>Rapprochement & Bilan Financier</span>
              </h4>
              <span className="text-[10px] font-bold text-[#2D5A43] bg-[#E7EFEA] border border-[#C3D9CD] px-2 py-0.5 rounded-md">
                Calcul Automatique
              </span>
            </div>

            <div className="space-y-2.5 pt-3 text-xs">
              <div className="flex items-center justify-between text-[#4A463F]">
                <span>Chiffre d'Affaires Brut ({summary.totalSold} × {unitSellingPrice} {settings.currency}) :</span>
                <span className="font-bold text-[#1A1A1A] font-mono-num">
                  +{formatCurrency(summary.grossRevenue, settings.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#4A463F]">
                <span>Reprise des Retours ({summary.totalReturned} × {unitReturnPrice} {settings.currency}) :</span>
                <span className="font-bold text-[#9C6B28] font-mono-num">
                  +{formatCurrency(summary.returnPriceTotal, settings.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#4A463F]">
                <span>Pertes sur Retours ({summary.totalReturned} × {lossPerUnit} {settings.currency}/pain) :</span>
                <span className="font-bold text-[#8B3A3A] font-mono-num">
                  -{formatCurrency(summary.returnLossAmount, settings.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#4A463F]">
                <span>Total Dépenses Déduites :</span>
                <span className="font-bold text-[#8B3A3A] font-mono-num">
                  -{formatCurrency(summary.totalExpenses, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#2D5A43] text-white p-3.5 rounded-xl border border-[#234735] mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-editorial text-[#D8EADB]">
                Gain Net Final de Caisse :
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono-num text-white">
                {formatCurrency(summary.netGain, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
