import React, { useMemo } from 'react';
import { DailyJournal, TimePeriod } from '../types';
import { formatCurrency, formatNumber, formatDateFrench } from '../utils/calculations';
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
import { TrendingUp, BarChart3 } from 'lucide-react';

interface AnalyticsChartsProps {
  journals: DailyJournal[];
  currency: string;
  selectedPeriod: TimePeriod;
  onUpdateSellerInfo?: (sellerName: string, updatedInfo: { phone?: string; age?: number | string; role?: string }) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  journals,
  currency,
  selectedPeriod,
}) => {
  // Sort journals chronologically (oldest to newest) for chart timeline
  const chartData = useMemo(() => {
    const sorted = [...journals].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Filter based on period
    const now = new Date();
    let sliceDays = 7;
    if (selectedPeriod === 'today') sliceDays = 7; // Show context of last 7 days even if today is selected
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
      // Timezone-safe short date format (e.g. "04/08")
      let shortDate = j.date;
      if (j.date && j.date.includes('-')) {
        const parts = j.date.split('-');
        if (parts.length === 3) {
          shortDate = `${parts[2]}/${parts[1]}`;
        }
      }
      return {
        date: j.date,
        shortDate,
        gain: j.summary?.netGain ?? 0,
        revenue: j.summary?.grossRevenue ?? 0,
        soldUnits: j.summary?.totalSold ?? 0,
        returnUnits: j.summary?.totalReturned ?? 0,
        lostUnits: j.summary?.totalLost ?? 0,
        lossAmount: j.summary?.lossAmount ?? j.summary?.returnLossAmount ?? 0,
      };
    });
  }, [journals, selectedPeriod]);

  return (
    <div className="space-y-6" id="analytics-section">
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gain & Chiffre d'affaires over time */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2D5A43]" />
                <span>Évolution des Bénéfices & Revenus</span>
              </h3>
              <p className="text-xs text-[#7A756D] font-editorial italic">
                Gains journaliers en {currency}
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                <XAxis dataKey="shortDate" stroke="#8C877E" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C877E" fontSize={11} tickLine={false} tickFormatter={(val) => `${Math.round(val / 1000)}k`} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    formatCurrency(Number(val), currency),
                    name === 'gain' ? 'Gain Net' : 'Chiffre d’affaires',
                  ]}
                  labelFormatter={(lbl, payload) => {
                    if (payload && payload[0]) {
                      return formatDateFrench(payload[0].payload.date);
                    }
                    return lbl;
                  }}
                  contentStyle={{ backgroundColor: '#1F1E1C', borderColor: '#383530', borderRadius: '12px', color: '#F4F1EA', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#7A756D" strokeWidth={2} fillOpacity={1} fill="url(#revGradient)" name="revenue" />
                <Area type="monotone" dataKey="gain" stroke="#2D5A43" strokeWidth={3} fillOpacity={1} fill="url(#gainGradient)" name="gain" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quantités vendues vs Retours vs Pertes */}
        <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1A1A1A] font-editorial text-lg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#5C574F]" />
                <span>Flux des Articles (Ventes / Retours / Pertes)</span>
              </h3>
              <p className="text-xs text-[#7A756D] font-editorial italic">
                Quantités écoulées et retours
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE8E0" />
                <XAxis dataKey="shortDate" stroke="#8C877E" fontSize={11} tickLine={false} />
                <YAxis stroke="#8C877E" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    `${formatNumber(Number(val))} unités`,
                    name === 'soldUnits' ? 'Vendus' : name === 'returnUnits' ? 'Retours' : 'Pertes',
                  ]}
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
        </div>

      </div>

    </div>
  );
};
