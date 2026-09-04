import React, { useState, useMemo } from 'react';
import { DailyJournal, AppSettings, TimePeriod } from '../types';
import { ProfitMetricCards } from './ProfitMetricCards';
import { AnalyticsCharts } from './AnalyticsCharts';
import { 
  formatCurrency, 
  formatNumber, 
  formatDateFrench,
  filterJournalsByPeriod
} from '../utils/calculations';
import { 
  TrendingUp, 
  Calculator, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Coins, 
  ArrowUpRight, 
  BarChart3, 
  Sparkles,
  PieChart,
  ShoppingBag,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  Send,
  Mail,
  MessageSquare
} from 'lucide-react';
import { SendSynthesisModal } from './SendSynthesisModal';

interface GainsAndSummaryPageProps {
  journals: DailyJournal[];
  currentJournal: DailyJournal;
  settings: AppSettings;
  selectedPeriod: TimePeriod;
  onSelectPeriod: (period: TimePeriod) => void;
  onSelectJournal: (journal: DailyJournal) => void;
  onUpdateSellerInfo?: (sellerName: string, updatedInfo: { phone?: string; age?: number | string; role?: string }) => void;
}

export const GainsAndSummaryPage: React.FC<GainsAndSummaryPageProps> = ({
  journals,
  currentJournal,
  settings,
  selectedPeriod,
  onSelectPeriod,
  onSelectJournal,
  onUpdateSellerInfo,
}) => {
  const [selectedJournalId, setSelectedJournalId] = useState<string>(currentJournal.id);
  const [simulationProduced, setSimulationProduced] = useState<number>(800);
  const [simulationSold, setSimulationSold] = useState<number>(750);
  const [simulationExpenses, setSimulationExpenses] = useState<number>(0);
  const [showSendModal, setShowSendModal] = useState(false);

  // Active journal for daily summary
  const activeJournal = useMemo(() => {
    return journals.find(j => j.id === selectedJournalId) || currentJournal;
  }, [journals, selectedJournalId, currentJournal]);

  const summary = activeJournal?.summary || {
    totalProducedOrGiven: 0,
    totalSold: 0,
    totalReturned: 0,
    totalLost: 0,
    returnPriceTotal: 0,
    returnLossAmount: 0,
    grossRevenue: 0,
    totalExpenses: 0,
    costOfGoodsSold: 0,
    netGain: 0,
    cashSurplusOrDeficit: 0,
    efficiencyRate: 100,
    formulaUsed: settings.calculationFormula,
  };
  const unitSellingPrice = activeJournal?.unitSellingPrice || settings.defaultSellingPrice;
  const unitReturnPrice = activeJournal?.unitReturnPrice || settings.defaultReturnPrice;
  const lossPerUnit = Math.max(0, unitSellingPrice - unitReturnPrice);

  // Simulation calculations
  const simReturned = Math.max(0, simulationProduced - simulationSold);
  const simGrossRevenue = simulationSold * unitSellingPrice;
  const simReturnRecovered = simReturned * unitReturnPrice;
  const simReturnLoss = simReturned * lossPerUnit;
  const simNetGain = simGrossRevenue + simReturnRecovered - simulationExpenses;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. TOP HEADER OF THE PAGE */}
      <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#2D5A43]"></span>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial text-[#1A1A1A]">
              Calcul des Gains & Bénéfices • Synthèse Journalière de Caisse
            </h2>
          </div>
          <p className="text-sm text-[#7A756D] mt-1 font-editorial">
            Visualisation consolidée des bénéfices sur Aujourd'hui, Tous les Jours, 1 Mois, 1 An et analyse complète du journal de caisse.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#EBE8E0] p-1.5 rounded-xl border border-[#DCD6CB] shrink-0 self-start md:self-auto">
          <span className="text-xs font-semibold text-[#5C574F] px-2 font-editorial">Période d'analyse :</span>
          {(['today', 'all', 'month', 'year'] as TimePeriod[]).map((p) => {
            const labelMap: Record<TimePeriod, string> = {
              today: "Aujourd'hui",
              '7days': '7 Jours',
              all: 'Tous les Jours',
              month: '1 Mois',
              year: '1 An',
            };
            const isSelected = selectedPeriod === p || (p === 'all' && selectedPeriod === '7days');
            return (
              <button
                key={p}
                id={`btn-period-${p}`}
                onClick={() => onSelectPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D5A43] text-white shadow-xs'
                    : 'text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#F4F1EA]'
                }`}
              >
                {labelMap[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SECTION A: CALCUL DES GAINS & BÉNÉFICES (Cartes 1J, Tous les Jours, 1M, 1A) */}
      <section id="page-section-gains" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-[#2D5A43]" />
            <h3 className="text-lg font-bold font-editorial text-[#1A1A1A]">
              1. Calcul des Gains & Bénéfices Multidates
            </h3>
          </div>
          <span className="text-xs font-mono-num font-semibold text-[#2D5A43] bg-[#E7EFEA] border border-[#C3D9CD] px-2.5 py-1 rounded-lg">
            {journals.length} journaux enregistrés
          </span>
        </div>

        <ProfitMetricCards
          journals={journals}
          currency={settings.currency}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={onSelectPeriod}
        />
      </section>

      {/* 3. SECTION B: SYNTHÈSE JOURNALIÈRE DE CAISSE EN TEMPS RÉEL */}
      <section id="page-section-synthese-caisse" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EAE7DF] p-4 rounded-2xl border border-[#DCD6CB]">
          <div className="flex items-center space-x-2.5">
            <Calculator className="w-5 h-5 text-[#2D5A43]" />
            <div>
              <h3 className="text-lg font-bold font-editorial text-[#1A1A1A]">
                2. Synthèse Journalière de Caisse
              </h3>
              <p className="text-xs text-[#5C574F] font-editorial">
                Détail financier journalier avec calcul automatique des retours et recettes.
              </p>
            </div>
          </div>

          {/* Select a date to view its daily summary & Send action */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <label htmlFor="select-summary-journal" className="text-xs font-semibold text-[#4A463F] whitespace-nowrap">
                Journal du :
              </label>
              <select
                id="select-summary-journal"
                value={activeJournal.id}
                onChange={(e) => setSelectedJournalId(e.target.value)}
                className="bg-[#FAFAF7] border border-[#DCD6CB] text-[#1A1A1A] text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
              >
                {journals.map((j) => (
                  <option key={j.id} value={j.id}>
                    {formatDateFrench(j.date)} — Gain: {formatCurrency(j.summary?.netGain ?? 0, settings.currency)}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-send-summary-gains-page"
              type="button"
              onClick={() => setShowSendModal(true)}
              className="flex items-center space-x-1.5 bg-[#2D5A43] hover:bg-[#234735] text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              title="Envoyer la synthèse du jour sélectionné sur Gmail ou Messages"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer par Gmail / SMS</span>
            </button>
          </div>
        </div>



        {/* Daily Sellers Quick Table for the selected journal */}
        <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm font-editorial text-[#1A1A1A] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#2D5A43]" />
              <span>Détail par Vendeur ({(activeJournal?.sellers || []).length} vendeurs au {formatDateFrench(activeJournal.date)})</span>
            </h4>
            <button
              onClick={() => onSelectJournal(activeJournal)}
              className="text-xs text-[#2D5A43] hover:text-[#1B3628] font-bold underline cursor-pointer"
            >
              Ouvrir dans le Journal de Caisse →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DCD6CB] text-[#5C574F] bg-[#F4F1EA]">
                  <th className="py-2.5 px-3 font-editorial font-bold">Vendeur</th>
                  <th className="py-2.5 px-3 text-center font-editorial font-bold">Total Confié</th>
                  <th className="py-2.5 px-3 text-center text-[#2D5A43] font-editorial font-bold">Vente</th>
                  <th className="py-2.5 px-3 text-center text-[#9C6B28] font-editorial font-bold">Retour</th>
                  <th className="py-2.5 px-3 text-right text-[#8B3A3A] font-editorial font-bold">Perte Retours ({lossPerUnit} CFA/u)</th>
                  <th className="py-2.5 px-3 text-right font-editorial font-bold">Prix Vente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E0]">
                {(activeJournal?.sellers || []).map((s) => {
                  const sGiven = Number(s.totalGiven) || 0;
                  const sSold = Number(s.soldCount) || 0;
                  const sReturn = Number(s.returnCount) || 0;
                  const sLoss = sReturn * lossPerUnit;
                  const sRev = sSold * unitSellingPrice;

                  return (
                    <tr key={s.id} className="hover:bg-[#F4F1EA]">
                      <td className="py-2 px-3 font-semibold text-[#1A1A1A]">{s.name}</td>
                      <td className="py-2 px-3 text-center font-mono-num">{formatNumber(sGiven)}</td>
                      <td className="py-2 px-3 text-center font-bold text-[#2D5A43] font-mono-num">{formatNumber(sSold)}</td>
                      <td className="py-2 px-3 text-center text-[#9C6B28] font-mono-num">{formatNumber(sReturn)}</td>
                      <td className="py-2 px-3 text-right text-[#8B3A3A] font-mono-num">
                        {sLoss > 0 ? `-${formatCurrency(sLoss, settings.currency)}` : '0 CFA'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#1A1A1A] font-mono-num">
                        {formatCurrency(sRev, settings.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#EAE7DF] font-bold text-[#1A1A1A] border-t-2 border-[#DCD6CB]">
                  <td className="py-2.5 px-3">TOTAL CAISSE</td>
                  <td className="py-2.5 px-3 text-center font-mono-num">{formatNumber(summary.totalProducedOrGiven)}</td>
                  <td className="py-2.5 px-3 text-center text-[#2D5A43] font-mono-num">{formatNumber(summary.totalSold)}</td>
                  <td className="py-2.5 px-3 text-center text-[#9C6B28] font-mono-num">{formatNumber(summary.totalReturned)}</td>
                  <td className="py-2.5 px-3 text-right text-[#8B3A3A] font-mono-num">
                    -{formatCurrency(summary.returnLossAmount, settings.currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#2D5A43] font-mono-num">
                    {formatCurrency(summary.grossRevenue, settings.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* 4. SECTION C: GRAPHIQUES D'ANALYSE & SIMULATEUR DE RENTABILITÉ */}
      <section id="page-section-graphiques-simulateur" className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Charts block (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#2D5A43]" />
            <h3 className="text-lg font-bold font-editorial text-[#1A1A1A]">
              3. Graphiques des Gains ({selectedPeriod === '7days' ? '7 Jours' : selectedPeriod === 'month' ? '1 Mois' : selectedPeriod === 'year' ? '1 An' : 'Période'})
            </h3>
          </div>

          <AnalyticsCharts
            journals={journals}
            currency={settings.currency}
            selectedPeriod={selectedPeriod}
            onUpdateSellerInfo={onUpdateSellerInfo}
          />
        </div>

        {/* Quick Profit Simulator (1 col) */}
        <div className="bg-[#FAFAF7] border border-[#DCD6CB] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#2D5A43]" />
              <h4 className="font-bold text-base font-editorial text-[#1A1A1A]">
                Simulateur de Bénéfice
              </h4>
            </div>
            <p className="text-xs text-[#7A756D] font-editorial mb-4">
              Estimez votre gain net et vos pertes sur retours en fonction de vos volumes prévus.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#5C574F] font-semibold block mb-1 font-editorial">
                  Pains confiés / produits :
                </label>
                <input
                  type="number"
                  value={simulationProduced}
                  onChange={(e) => setSimulationProduced(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-[#DCD6CB] rounded-xl px-3 py-2 font-mono-num font-bold text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#5C574F] font-semibold block mb-1 font-editorial">
                  Pains vendus prévus :
                </label>
                <input
                  type="number"
                  value={simulationSold}
                  onChange={(e) => setSimulationSold(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-[#DCD6CB] rounded-xl px-3 py-2 font-mono-num font-bold text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#5C574F] font-semibold block mb-1 font-editorial">
                  Dépenses prévues ({settings.currency}) :
                </label>
                <input
                  type="number"
                  value={simulationExpenses}
                  onChange={(e) => setSimulationExpenses(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-[#DCD6CB] rounded-xl px-3 py-2 font-mono-num font-bold text-sm focus:ring-2 focus:ring-[#2D5A43] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="bg-[#1F1E1C] text-[#F4F1EA] p-4 rounded-xl space-y-2 border border-[#383530]">
            <div className="flex justify-between text-xs text-[#A6A095]">
              <span>Retours estimés :</span>
              <span className="font-mono-num font-bold text-[#F2D69B]">{simReturned} pains</span>
            </div>
            <div className="flex justify-between text-xs text-[#A6A095]">
              <span>Perte retours (-{lossPerUnit} CFA/u) :</span>
              <span className="font-mono-num font-bold text-[#F8C4C4]">
                -{formatCurrency(simReturnLoss, settings.currency)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#A6A095]">
              <span>Recette Vente ({unitSellingPrice} CFA) :</span>
              <span className="font-mono-num font-bold text-[#A3D9BC]">
                {formatCurrency(simGrossRevenue, settings.currency)}
              </span>
            </div>
            <div className="border-t border-[#383530] pt-2 flex justify-between items-baseline">
              <span className="text-xs font-bold text-white font-editorial">Gain Net Estimé :</span>
              <span className="text-lg font-bold text-[#A3D9BC] font-mono-num">
                {formatCurrency(simNetGain, settings.currency)}
              </span>
            </div>
          </div>

        </div>

      </section>

      {/* Modal d'envoi de la synthèse */}
      <SendSynthesisModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        journal={activeJournal}
        settings={settings}
      />

    </div>
  );
};
