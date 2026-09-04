import React from 'react';
import { AppSettings, DailyJournal } from '../types';
import { formatCurrency, formatNumber, formatDateFrench, calculateJournalSummary } from '../utils/calculations';
import { formatFrenchDateTime } from '../utils/dateTime';
import { X, Printer, CheckCircle, Store, Calendar, FileText } from 'lucide-react';

interface ReceiptModalProps {
  journal: DailyJournal | null;
  settings: AppSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  journal,
  settings,
  onClose,
}) => {
  if (!journal) return null;

  const summary = journal.summary || calculateJournalSummary(
    journal.sellers || [],
    journal.unitSellingPrice || settings.defaultSellingPrice,
    journal.unitReturnPrice || settings.defaultReturnPrice,
    journal.unitCostPrice || settings.defaultCostPrice,
    journal.expenses || [],
    settings.calculationFormula
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1F1E1C]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      
      {/* Modal Card */}
      <div className="bg-[#FAFAF7] rounded-2xl shadow-2xl max-w-2xl w-full border border-[#DCD6CB] overflow-hidden my-8">
        
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-4 bg-[#EBE8E0] border-b border-[#DCD6CB] flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#2D5A43]" />
            <span className="font-bold text-[#1A1A1A] font-editorial text-sm">
              Fiche de Caisse & Ticket Imprimable
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-[#2D5A43] hover:bg-[#234735] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Fiche</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#5C574F] hover:text-[#1A1A1A] rounded-lg hover:bg-[#DCD6CB]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-6 sm:p-8 space-y-6 text-[#1A1A1A] print:p-0 print:m-0" id="printable-receipt">
          
          {/* Header */}
          <div className="text-center border-b border-[#DCD6CB] pb-4 space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold font-editorial uppercase tracking-tight text-[#1A1A1A]">
              {settings.businessName}
            </h2>
            <p className="text-xs font-bold text-[#2D5A43] uppercase tracking-wider font-editorial">
              JOURNAL QUOTIDIEN DE CAISSE
            </p>
            <p className="text-sm font-medium text-[#4A463F]">
              Date : <strong className="text-[#1A1A1A] capitalize font-editorial">{formatDateFrench(journal.date)}</strong>
            </p>
            <p className="text-xs text-[#7A756D] font-editorial italic">
              Produit : <strong>{journal.productName}</strong> • Prix unitaire vente : {journal.unitSellingPrice} {settings.currency} • Prix retour : {journal.unitReturnPrice} {settings.currency}
            </p>
          </div>

          {/* Key Totals Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F4F1EA] p-3 rounded-xl border border-[#DCD6CB] text-center text-xs">
            <div>
              <span className="text-[#7A756D] block font-editorial">Total Produit</span>
              <strong className="text-base text-[#1A1A1A] font-mono-num">{formatNumber(summary.totalProducedOrGiven)}</strong>
            </div>
            <div>
              <span className="text-[#2D5A43] font-semibold block font-editorial">Total Vendus</span>
              <strong className="text-base text-[#2D5A43] font-mono-num">{formatNumber(summary.totalSold)}</strong>
            </div>
            <div>
              <span className="text-[#9C6B28] font-semibold block font-editorial">Total Retours</span>
              <strong className="text-base text-[#9C6B28] font-mono-num">{formatNumber(summary.totalReturned)}</strong>
            </div>
            <div>
              <span className="text-[#8B3A3A] font-semibold block font-editorial">Perte Retours ({summary.lossPerReturnUnit} CFA/u)</span>
              <strong className="text-base text-[#8B3A3A] font-mono-num">{formatCurrency(summary.returnLossAmount, settings.currency)}</strong>
            </div>
          </div>

          {/* Return Loss Auto-Calculation Explanatory Bar */}
          <div className="bg-[#FAF3E8] border border-[#E8D9C0] rounded-lg p-2.5 text-xs text-[#9C6B28] flex items-center justify-between">
            <div>
              <strong>Calcul Perte sur Retours :</strong> {summary.totalReturned} retours × ({journal.unitSellingPrice} - {journal.unitReturnPrice}) = <strong>{summary.lossPerReturnUnit} {settings.currency} de perte / pain</strong>
            </div>
            <strong className="font-mono-num text-[#8B3A3A]">
              - {formatCurrency(summary.returnLossAmount, settings.currency)}
            </strong>
          </div>

          {/* Table Vendeurs */}
          <div>
            <h4 className="text-xs font-bold text-[#4A463F] uppercase tracking-wider mb-2 font-editorial">
              Détail par Vendeur / Livreur
            </h4>
            <table className="w-full text-xs text-left border border-[#DCD6CB] rounded-lg overflow-hidden">
              <thead className="bg-[#EBE8E0] font-bold border-b border-[#DCD6CB] font-editorial">
                <tr>
                  <th className="p-2">Nom</th>
                  <th className="p-2 text-center">Confié</th>
                  <th className="p-2 text-center text-[#2D5A43]">Vente</th>
                  <th className="p-2 text-center text-[#9C6B28]">Retour</th>
                  <th className="p-2 text-right">Recette ({settings.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCD6CB]">
                {(journal.sellers || []).map((s, idx) => (
                  <tr key={s.id || idx}>
                    <td className="p-2 font-semibold capitalize font-editorial">{s.name}</td>
                    <td className="p-2 text-center font-mono-num">{s.totalGiven}</td>
                    <td className="p-2 text-center font-mono-num font-bold text-[#2D5A43]">{s.soldCount}</td>
                    <td className="p-2 text-center font-mono-num text-[#9C6B28]">{s.returnCount}</td>
                    <td className="p-2 text-right font-mono-num font-bold">{formatNumber(s.cashCollected)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#EBE8E0] font-bold border-t-2 border-[#DCD6CB]">
                <tr>
                  <td className="p-2 font-editorial">TOTAL</td>
                  <td className="p-2 text-center font-mono-num">{formatNumber(summary.totalProducedOrGiven)}</td>
                  <td className="p-2 text-center font-mono-num text-[#2D5A43]">{formatNumber(summary.totalSold)}</td>
                  <td className="p-2 text-center font-mono-num text-[#9C6B28]">{formatNumber(summary.totalReturned)}</td>
                  <td className="p-2 text-right font-mono-num text-[#2D5A43]">
                    {formatCurrency(summary.grossRevenue, settings.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Dépenses if any */}
          {journal.expenses && journal.expenses.length > 0 && (
            <div className="border border-[#DCD6CB] rounded-lg p-3 bg-[#F4F1EA] text-xs">
              <span className="font-bold text-[#1A1A1A] block mb-1 font-editorial">Charges & Dépenses déduites :</span>
              {journal.expenses.map((e, idx) => (
                <div key={idx} className="flex justify-between py-0.5 text-[#5C574F]">
                  <span>- {e.label}</span>
                  <span className="font-mono-num font-semibold">{formatCurrency(e.amount, settings.currency)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Summary Bar */}
          <div className="bg-[#1F1E1C] text-[#F4F1EA] rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase text-[#A8A29E] font-bold tracking-wider block font-editorial">
                Total Gagné Net
              </span>
              <p className="text-2xl font-bold text-[#A3D9BC] font-mono-num">
                {formatCurrency(summary.netGain, settings.currency)}
              </p>
            </div>
            <div className="text-right text-xs text-[#D6D3D1] space-y-0.5 font-mono-num">
              <p>Chiffre Ventes : {formatCurrency(summary.grossRevenue, settings.currency)}</p>
              <p>Valeur Retours : {formatCurrency(summary.returnPriceTotal, settings.currency)}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-[#DCD6CB] text-center text-xs">
            <div>
              <p className="font-bold text-[#4A463F] font-editorial">Signature du Responsable Caisse</p>
              <div className="h-12 border-b border-dashed border-[#8C877E] mt-2"></div>
            </div>
            <div>
              <p className="font-bold text-[#4A463F] font-editorial">Signature de la Direction</p>
              <div className="h-12 border-b border-dashed border-[#8C877E] mt-2"></div>
            </div>
          </div>

          <p className="text-[10px] text-center text-[#8C877E] font-editorial pt-2">
            Ticket de caisse généré et horodaté automatiquement le {formatFrenchDateTime(new Date())}
          </p>

        </div>

      </div>

    </div>
  );
};
