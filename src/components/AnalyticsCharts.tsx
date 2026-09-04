import React, { useMemo, useState, useEffect } from 'react';
import { DailyJournal, TimePeriod, MonthlyProfitRecord } from '../types';
import { formatCurrency, formatNumber, formatDateFrench } from '../utils/calculations';
import {
  calculateMonthlyProfitRecords,
  autoSaveMonthlyProfitRecords,
  MONTH_SHORT_NAMES_FR,
} from '../utils/monthlyRecords';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Calendar,
  RotateCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';

interface AnalyticsChartsProps {
  journals: DailyJournal[];
  currency: string;
  selectedPeriod: TimePeriod;
  currentUserId?: string;
  onUpdateSellerInfo?: (sellerName: string, updatedInfo: { phone?: string; age?: number | string; role?: string }) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  journals,
  currency,
  selectedPeriod,
  currentUserId,
}) => {
  // Chart granularity: 'monthly' (tous les 1 mois) vs 'daily' (par jour)
  // Default to monthly view to fulfill automatic monthly recording & visualization
  const [chartViewMode, setChartViewMode] = useState<'monthly' | 'daily'>('monthly');
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyProfitRecord[]>([]);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('');
  const [isManuallySaving, setIsManuallySaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showMonthlyHistoryTable, setShowMonthlyHistoryTable] = useState<boolean>(true);

  // Automatically consolidate and save monthly records whenever journals change
  useEffect(() => {
    autoSaveMonthlyProfitRecords(journals, currentUserId).then((records) => {
      setMonthlyRecords(records);
      const now = new Date();
      setLastAutoSaveTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
      );
    });
  }, [journals, currentUserId]);

  const handleForceAutoSave = async () => {
    setIsManuallySaving(true);
    const updated = await autoSaveMonthlyProfitRecords(journals, currentUserId);
    setMonthlyRecords(updated);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setLastAutoSaveTime(timeStr);
    setIsManuallySaving(false);
    setSaveFeedback(`✓ Bilan mensuel consolidé et enregistré automatiquement avec succès (${timeStr})`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  // Daily sorted data
  const dailyChartData = useMemo(() => {
    const sorted = [...journals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter based on period
    const now = new Date();
    let sliceDays = 30;
    if (selectedPeriod === 'today') sliceDays = 7;
    else if (selectedPeriod === '7days') sliceDays = 7;
    else if (selectedPeriod === 'month') sliceDays = 30;
    else if (selectedPeriod === 'year') sliceDays = 365;
    else sliceDays = 9999;

    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - sliceDays);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const filtered = sorted.filter((j) => j.date >= cutoffStr);
    const items = filtered.length > 0 ? filtered : sorted.slice(-sliceDays);

    return items.map((j) => {
      let shortDate = j.date;
      if (j.date && j.date.includes('-')) {
        const parts = j.date.split('-');
        if (parts.length === 3) {
          shortDate = `${parts[2]}/${parts[1]}`;
        }
      }
      return {
        date: j.date,
        label: shortDate,
        fullLabel: formatDateFrench(j.date),
        gain: j.summary?.netGain ?? 0,
        revenue: j.summary?.grossRevenue ?? 0,
        soldUnits: j.summary?.totalSold ?? 0,
        returnUnits: j.summary?.totalReturned ?? 0,
        lostUnits: j.summary?.totalLost ?? 0,
        lossAmount: j.summary?.lossAmount ?? j.summary?.returnLossAmount ?? 0,
        expenses: j.summary?.totalExpenses ?? 0,
        isMonthRecord: false,
      };
    });
  }, [journals, selectedPeriod]);

  // Monthly aggregated chart data (tous les 1 mois)
  const monthlyChartData = useMemo(() => {
    const records = monthlyRecords.length > 0 ? monthlyRecords : calculateMonthlyProfitRecords(journals);
    return records.map((rec) => {
      const shortMonth = `${MONTH_SHORT_NAMES_FR[rec.monthIndex]} ${rec.year}`;
      return {
        date: rec.monthKey,
        label: shortMonth,
        fullLabel: rec.monthLabel,
        gain: rec.totalNetGain,
        revenue: rec.totalGrossRevenue,
        soldUnits: rec.totalSoldUnits,
        returnUnits: rec.totalReturnUnits,
        lostUnits: rec.totalLostUnits,
        expenses: rec.totalExpenses,
        daysCount: rec.daysCount,
        averageDailyGain: rec.averageDailyGain,
        status: rec.status,
        lastAutoSaved: rec.lastAutoSaved,
        isMonthRecord: true,
      };
    });
  }, [monthlyRecords, journals]);

  const activeChartData = chartViewMode === 'monthly' ? monthlyChartData : dailyChartData;

  return (
    <div className="space-y-6" id="analytics-section">
      
      {/* BANDEAU D'ENREGISTREMENT AUTOMATIQUE MENSUEL */}
      <div className="bg-[#F4F1EA] border border-[#DCD6CB] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E7EFEA] border border-[#C3D9CD] flex items-center justify-center text-[#2D5A43] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-[#1A1A1A] font-editorial">
                  Enregistrement Automatique Mensuel Actif (Tous les 1 mois)
                </h4>
                <span className="text-[11px] font-semibold bg-[#E7EFEA] text-[#2D5A43] px-2 py-0.5 rounded-md border border-[#C3D9CD]">
                  Auto-Sauvegarde Active
                </span>
              </div>
              <p className="text-xs text-[#5C574F] font-editorial mt-0.5">
                Chaque mois de vente est consolidé, cumulé et archivé automatiquement dans l'historique et le Cloud sans perte de données.
                {lastAutoSaveTime && (
                  <span className="ml-1 text-[#7A756D] italic">
                    (Dernière synchro auto à {lastAutoSaveTime})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleForceAutoSave}
              disabled={isManuallySaving}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#DCD6CB] bg-[#FAFAF7] hover:bg-[#EBE8E0] text-[#1A1A1A] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Actualiser et forcer l'enregistrement du bilan mensuel"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#5C574F] ${isManuallySaving ? 'animate-spin' : ''}`} />
              <span>{isManuallySaving ? 'Enregistrement...' : 'Enregistrer le mois'}</span>
            </button>
          </div>
        </div>

        {saveFeedback && (
          <div className="mt-2.5 text-xs text-[#2D5A43] bg-[#E7EFEA] px-3 py-1.5 rounded-lg font-medium border border-[#C3D9CD] animate-fadeIn">
            {saveFeedback}
          </div>
        )}
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gain & Chiffre d'affaires over time */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2D5A43]" />
                <span>Évolution des Bénéfices & Revenus</span>
              </h3>
              <p className="text-xs text-[#7A756D] font-editorial italic">
                {chartViewMode === 'monthly'
                  ? `Consolidation automatique enregistrée tous les 1 mois en ${currency}`
                  : `Détail journalier enregistré en ${currency}`}
              </p>
            </div>

            {/* TOGGLE MENSUEL (TOUS LES 1 MOIS) VS JOURNALIER */}
            <div className="inline-flex bg-[#EBE8E0] p-1 rounded-xl border border-[#DCD6CB] text-xs font-semibold">
              <button
                id="btn-view-mode-monthly"
                onClick={() => setChartViewMode('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  chartViewMode === 'monthly'
                    ? 'bg-[#2D5A43] text-white shadow-xs'
                    : 'text-[#5C574F] hover:text-[#1A1A1A]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Tous les 1 mois</span>
              </button>
              <button
                id="btn-view-mode-daily"
                onClick={() => setChartViewMode('daily')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  chartViewMode === 'daily'
                    ? 'bg-[#2D5A43] text-white shadow-xs'
                    : 'text-[#5C574F] hover:text-[#1A1A1A]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Par jour</span>
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5A43" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2D5A43" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7A756D" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7A756D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE8E0" />
                <XAxis dataKey="label" stroke="#8C877E" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C877E" fontSize={11} tickLine={false} tickFormatter={(val) => `${Math.round(val / 1000)}k`} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    formatCurrency(Number(val), currency),
                    name === 'gain'
                      ? chartViewMode === 'monthly' ? 'Bénéfice Net Mensuel' : 'Gain Net Journalier'
                      : chartViewMode === 'monthly' ? 'Chiffre d’affaires Mensuel' : 'Chiffre d’affaires',
                  ]}
                  labelFormatter={(_lbl, payload) => {
                    if (payload && payload[0]) {
                      const p = payload[0].payload;
                      if (p.isMonthRecord) {
                        return `${p.fullLabel} (${p.daysCount || 0} jours de vente enregistrés)`;
                      }
                      return p.fullLabel || p.date;
                    }
                    return _lbl;
                  }}
                  contentStyle={{ backgroundColor: '#1F1E1C', borderColor: '#383530', borderRadius: '12px', color: '#F4F1EA', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#7A756D" strokeWidth={2} fillOpacity={1} fill="url(#revGradient)" name="revenue" />
                <Area type="monotone" dataKey="gain" stroke="#2D5A43" strokeWidth={3} fillOpacity={1} fill="url(#gainGradient)" name="gain" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#7A756D] border-t border-[#EBE8E0] pt-2 font-editorial">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A43]"></span>
              <span>Ligne verte : Bénéfice net ({chartViewMode === 'monthly' ? 'cumul par mois' : 'par jour'})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7A756D]"></span>
              <span>Ligne grise : Chiffre d’affaires</span>
            </span>
          </div>
        </div>

        {/* Quantités vendues vs Retours vs Pertes */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#5C574F]" />
                <span>Flux des Articles (Ventes / Retours / Pertes)</span>
              </h3>
              <p className="text-xs text-[#7A756D] font-editorial italic">
                {chartViewMode === 'monthly'
                  ? 'Quantités totales enregistrées tous les 1 mois'
                  : 'Quantités journalières écoulées et retours'}
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE8E0" />
                <XAxis dataKey="label" stroke="#8C877E" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C877E" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatNumber(Number(val))} unités`,
                    name === 'soldUnits' ? 'Vendus' : name === 'returnUnits' ? 'Retours' : 'Pertes',
                  ]}
                  labelFormatter={(_lbl, payload) => {
                    if (payload && payload[0]) {
                      const p = payload[0].payload;
                      return p.fullLabel || p.date;
                    }
                    return _lbl;
                  }}
                  contentStyle={{ backgroundColor: '#1F1E1C', borderColor: '#383530', borderRadius: '12px', color: '#F4F1EA', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={32}
                  formatter={(val) => (val === 'soldUnits' ? 'Vendus' : val === 'returnUnits' ? 'Retours' : 'Pertes')}
                />
                <Bar dataKey="soldUnits" fill="#2D5A43" radius={[4, 4, 0, 0]} name="soldUnits" />
                <Bar dataKey="returnUnits" fill="#9C6B28" radius={[4, 4, 0, 0]} name="returnUnits" />
                <Bar dataKey="lostUnits" fill="#8B3A3A" radius={[4, 4, 0, 0]} name="lostUnits" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#7A756D] border-t border-[#EBE8E0] pt-2 font-editorial">
            <span>Évolution des volumes enregistrés ({chartViewMode === 'monthly' ? 'tous les 1 mois' : 'par jour'})</span>
          </div>
        </div>

      </div>

      {/* TABLEAU HISTORIQUE DES ENREGISTREMENTS MENSUELS (TOUS LES 1 MOIS) */}
      <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#2D5A43]" />
            <div>
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-base flex items-center gap-2">
                <span>Registre des Enregistrements Mensuels (Tous les 1 mois)</span>
                <span className="text-xs bg-[#E7EFEA] text-[#2D5A43] font-semibold px-2 py-0.5 rounded-full border border-[#C3D9CD]">
                  {monthlyRecords.length} {monthlyRecords.length > 1 ? 'mois enregistrés' : 'mois enregistré'}
                </span>
              </h3>
              <p className="text-xs text-[#7A756D] font-editorial italic">
                Archives et bilans automatiques consolidés mois par mois avec bénéfice net et chiffre d'affaires
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowMonthlyHistoryTable(!showMonthlyHistoryTable)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#DCD6CB] bg-[#F4F1EA] hover:bg-[#EBE8E0] text-[#5C574F] flex items-center gap-1 cursor-pointer"
          >
            <span>{showMonthlyHistoryTable ? 'Masquer le tableau' : 'Afficher le tableau'}</span>
            {showMonthlyHistoryTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showMonthlyHistoryTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#EBE8E0] text-[#1A1A1A] border-b border-[#DCD6CB] font-editorial font-bold">
                  <th className="py-2.5 px-3">Période (Mois)</th>
                  <th className="py-2.5 px-3 text-right">Bénéfice Net Enregistré</th>
                  <th className="py-2.5 px-3 text-right">Chiffre d’Affaires</th>
                  <th className="py-2.5 px-3 text-right">Unités Vendues</th>
                  <th className="py-2.5 px-3 text-right">Retours</th>
                  <th className="py-2.5 px-3 text-right">Pertes</th>
                  <th className="py-2.5 px-3 text-right">Dépenses</th>
                  <th className="py-2.5 px-3 text-center">Jours de Vente</th>
                  <th className="py-2.5 px-3 text-center">Statut d'Enregistrement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E0]">
                {monthlyRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#F4F1EA] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#2D5A43]" />
                      <span>{record.monthLabel}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#2D5A43]">
                      +{formatCurrency(record.totalNetGain, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#1A1A1A]">
                      {formatCurrency(record.totalGrossRevenue, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#5C574F]">
                      {formatNumber(record.totalSoldUnits)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#9C6B28]">
                      {formatNumber(record.totalReturnUnits)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#8B3A3A]">
                      {formatNumber(record.totalLostUnits)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#5C574F]">
                      {formatCurrency(record.totalExpenses, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-semibold text-[#1A1A1A]">
                        {record.daysCount} {record.daysCount > 1 ? 'jours' : 'jour'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#E7EFEA] text-[#2D5A43] px-2 py-0.5 rounded-full border border-[#C3D9CD]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Enregistré auto</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
