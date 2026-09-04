import React, { useState } from 'react';
import { DailyJournal } from '../types';
import { formatCurrency, formatNumber, formatDateFrench } from '../utils/calculations';
import { getLocalDateString } from '../utils/dateTime';
import { 
  Calendar, 
  Search, 
  Trash2, 
  Edit3, 
  Printer
} from 'lucide-react';

interface JournalHistoryListProps {
  journals: DailyJournal[];
  currency: string;
  activeJournalId?: string;
  onSelectJournal: (journal: DailyJournal) => void;
  onDeleteJournal: (id: string) => void;
  onDeleteMultipleJournals?: (ids: string[]) => void;
  onPrintJournal: (journal: DailyJournal) => void;
}

export const JournalHistoryList: React.FC<JournalHistoryListProps> = ({
  journals,
  currency,
  activeJournalId,
  onSelectJournal,
  onDeleteJournal,
  onPrintJournal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [journalToDelete, setJournalToDelete] = useState<DailyJournal | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const todayStr = getLocalDateString();

  // Extract unique months from journals
  const availableMonths = Array.from(
    new Set(journals.map((j) => j.date.substring(0, 7)))
  ).sort().reverse();

  // Filter journals
  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      j.date.includes(searchTerm) ||
      (j.notes && j.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      j.sellers.some((s) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMonth = selectedMonth === 'all' || j.date.startsWith(selectedMonth);

    return matchesSearch && matchesMonth;
  });

  return (
    <div className="bg-[#FAFAF7] rounded-2xl border border-[#DCD6CB] p-5 shadow-xs" id="history-section">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#EBE8E0]">
        <div>
          <h3 className="font-bold text-[#1A1A1A] font-editorial text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2D5A43]" />
            <span>Historique des Journaux Enregistrés</span>
          </h3>
          <p className="text-xs text-[#7A756D] font-editorial italic">
            {journals.length} journal(s) de caisse archivé(s)
          </p>
        </div>
      </div>

      {/* Feedback Message */}
      {syncStatusMsg && (
        <div
          className={`mb-4 p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 ${
            syncStatusMsg.type === 'success'
              ? 'bg-[#E7EFEA] text-[#1B3628] border border-[#C3D9CD]'
              : syncStatusMsg.type === 'error'
              ? 'bg-[#FDF2F2] text-[#8B3A3A] border border-[#F5C2C2]'
              : 'bg-[#EBE8E0] text-[#4A463F]'
          }`}
        >
          <span>{syncStatusMsg.text}</span>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#8C877E] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par date ou vendeur (ex: 2026-08, Babacar)..."
            className="w-full bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43]"
          />
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#F4F1EA] border border-[#DCD6CB] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A1A1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D5A43] w-full sm:w-auto"
        >
          <option value="all">Tous les mois</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              Mois {m}
            </option>
          ))}
        </select>
      </div>

      {/* List / Table of Journals */}
      {filteredJournals.length === 0 ? (
        <div className="text-center py-10 bg-[#F4F1EA] rounded-xl border border-dashed border-[#DCD6CB]">
          <Calendar className="w-8 h-8 text-[#8C877E] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#1A1A1A] font-editorial">Aucun journal trouvé</p>
          <p className="text-xs text-[#7A756D] font-editorial italic">Modifiez vos critères de recherche ou enregistrez un journal.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredJournals.map((journal) => {
            const isCurrentActive = activeJournalId === journal.id || activeJournalId === `journal-${journal.date}`;
            return (
            <div
              key={journal.id}
              className={`border rounded-xl p-3 sm:p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group ${
                isCurrentActive 
                  ? 'border-[#2D5A43] bg-white ring-1 ring-[#2D5A43]/30 shadow-xs' 
                  : 'border-[#DCD6CB] bg-[#F4F1EA]/70 hover:bg-[#F4F1EA]'
              }`}
            >
              <div 
                onClick={() => onSelectJournal(journal)}
                className="flex-1 cursor-pointer flex items-start sm:items-center space-x-3"
              >
                <div className={`w-10 h-10 rounded-xl border flex flex-col items-center justify-center font-bold text-xs shrink-0 font-mono-num ${
                  isCurrentActive 
                    ? 'bg-[#2D5A43] text-white border-[#2D5A43]' 
                    : 'bg-[#EBE8E0] border-[#DCD6CB] text-[#2D5A43]'
                }`}>
                  <span>{journal.date.split('-')[2]}</span>
                  <span className="text-[10px] font-normal uppercase">{journal.date.split('-')[1]}</span>
                </div>

                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h4 className="font-bold text-[#1A1A1A] text-sm font-editorial">
                      {formatDateFrench(journal.date)}
                    </h4>
                    {isCurrentActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7EFEA] text-[#2D5A43] border border-[#C3D9CD]">
                        En cours d'édition
                      </span>
                    )}
                    {journal.date === todayStr && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7EFEA] text-[#2D5A43] border border-[#C3D9CD]">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D5A43] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2D5A43]"></span>
                        </span>
                        Aujourd'hui
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#FAFAF7] border border-[#DCD6CB] text-[#4A463F]">
                      {journal.productName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7A756D] mt-1">
                    <span>
                      Confiés : <strong className="text-[#1A1A1A] font-mono-num">{formatNumber(journal.summary?.totalProducedOrGiven ?? 0)}</strong>
                    </span>
                    <span className="text-[#2D5A43] font-semibold">
                      Vendus : <strong className="font-mono-num">{formatNumber(journal.summary?.totalSold ?? 0)}</strong>
                    </span>
                    <span className="text-[#9C6B28]">
                      Retours : <strong className="font-mono-num">{formatNumber(journal.summary?.totalReturned ?? 0)}</strong>
                      {(journal.summary?.totalReturned ?? 0) > 0 && (
                        <span className="text-[#8B3A3A] text-[11px] ml-1">
                          (-{formatCurrency(journal.summary?.returnLossAmount || ((journal.summary?.totalReturned ?? 0) * (journal.unitSellingPrice - journal.unitReturnPrice)), currency)})
                        </span>
                      )}
                    </span>
                    <span>• {(journal.sellers || []).length} vendeurs</span>
                  </div>
                </div>
              </div>

              {/* Gain & Actions */}
              <div className="flex items-center justify-between md:justify-end space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#DCD6CB]">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-[#7A756D] block uppercase font-bold tracking-wider font-editorial">Gain Net</span>
                  <p className="text-base font-bold text-[#2D5A43] font-mono-num">
                    {formatCurrency(journal.summary?.netGain ?? 0, currency)}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onSelectJournal(journal)}
                    title="Ouvrir et modifier ce journal"
                    className="p-2 text-[#5C574F] hover:text-[#2D5A43] hover:bg-[#FAFAF7] rounded-lg border border-transparent hover:border-[#DCD6CB] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onPrintJournal(journal)}
                    title="Imprimer le reçu"
                    className="p-2 text-[#5C574F] hover:text-[#1A1A1A] hover:bg-[#FAFAF7] rounded-lg border border-transparent hover:border-[#DCD6CB] transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    id={`btn-delete-journal-${journal.id}`}
                    onClick={() => setJournalToDelete(journal)}
                    title="Supprimer définitivement ce journal"
                    className="p-2 text-[#8C877E] hover:text-[#8B3A3A] hover:bg-[#FDF2E9] rounded-lg border border-transparent hover:border-[#FADBD8] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-[#8B3A3A]" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {journalToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCD6CB] space-y-4">
            <div className="flex items-center space-x-3 text-[#8B3A3A]">
              <div className="p-3 bg-[#FDF2E9] rounded-2xl border border-[#FADBD8]">
                <Trash2 className="w-6 h-6 text-[#8B3A3A]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A] font-editorial">
                  Supprimer ce journal de caisse ?
                </h3>
                <p className="text-xs text-[#7A756D]">
                  Date : <strong>{formatDateFrench(journalToDelete.date)}</strong> ({journalToDelete.date})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5C574F] leading-relaxed bg-[#FAFAF7] p-3 rounded-xl border border-[#EBE8E0]">
              Êtes-vous sûr de vouloir supprimer définitivement ce journal ({journalToDelete.productName}, {journalToDelete.sellers.length} vendeurs, Gain : {formatCurrency(journalToDelete.summary.netGain, currency)}) ? Cette action est irréversible.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setJournalToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-[#EBE8E0] hover:bg-[#DCD6CB] transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-delete-single"
                onClick={() => {
                  onDeleteJournal(journalToDelete.id);
                  setJournalToDelete(null);
                  setSyncStatusMsg({
                    type: 'info',
                    text: `Journal du ${journalToDelete.date} supprimé avec succès.`,
                  });
                  setTimeout(() => setSyncStatusMsg(null), 3000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8B3A3A] hover:bg-[#722A2A] shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Oui, Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
