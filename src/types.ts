export interface SellerInfo {
  name: string;
  phone?: string;
  age?: number | string;
  nationalId?: string;
  role?: string;
}

export interface SellerEntry {
  id: string;
  name: string;
  phone?: string;        // Numéro de téléphone (ex: 77 123 45 67)
  age?: number | string; // Âge (ex: 28)
  nationalId?: string;   // N° CNI / Pièce d'identité
  role?: string;         // Rôle (ex: Vendeur, Livreur)
  totalGiven: number;    // Total de pain remis
  soldCount: number;     // Vente
  returnCount: number;   // Retour
  lostCount: number;     // Manquant / Écart non justifié
  cashCollected: number; // Montant théorique ou encaissé
  notes?: string;
}

export interface ExpenseEntry {
  id: string;
  label: string;
  amount: number;
}

export interface JournalSummary {
  totalProducedOrGiven: number; // Total produit (ex: 780)
  totalSold: number;            // Total vendu (ex: 715)
  totalReturned: number;        // Total retourné (ex: 27)
  totalLost: number;            // Total manquant non justifié (ex: 38 ou 0)
  lossPerReturnUnit: number;    // Perte par pain de retour : Prix Vente - Prix Retour (ex: 175 - 50 = 125 CFA)
  returnLossAmount: number;     // Perte sur retours : (retour * 175) - (retour * 50) = retour * 125 (ex: 27 * 125 = 3 375 CFA)
  missingLossAmount: number;    // Perte sur pains manquants : manquant * 175 CFA
  grossRevenue: number;         // Chiffre d'affaires brut (715 * 175 = 125 125 CFA)
  returnPriceTotal: number;     // Valeur encaissée/reprise des retours (27 * 50 = 1 350 CFA)
  lossAmount: number;           // Perte totale calculée (Pertes retours 125 CFA/pain + Pertes manquants)
  totalExpenses: number;        // Dépenses annexes
  netGain: number;              // Total Gagné net final
  salePercentage: number;       // % Ventes (ex: 91.67%)
  returnPercentage: number;     // % Retours (ex: 3.46%)
  lossPercentage: number;       // % Pertes (ex: 4.87%)
}

export interface DailyJournal {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  productName: string;
  unitSellingPrice: number; // ex: 175 CFA
  unitReturnPrice: number;  // ex: 50 CFA
  unitCostPrice: number;    // ex: 100 CFA (coût de revient)
  sellers: SellerEntry[];
  expenses: ExpenseEntry[];
  summary: JournalSummary;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  businessName: string;
  businessType: string;
  currency: string;
  defaultProductName: string;
  defaultSellingPrice: number;
  defaultReturnPrice: number;
  defaultCostPrice: number;
  defaultSellers: (string | SellerInfo)[];
  calculationFormula: 'excel_sheet_mode' | 'standard_profit_mode';
  notificationEmail?: string;
  notificationPhone?: string;
  autoSendMessageOnSave?: boolean;
  autoSendChannel?: 'gmail' | 'messages' | 'modal';
}

export type ActivePage = 'journal' | 'gains_summary' | 'settings' | 'dashboard';
export type TimePeriod = 'today' | '7days' | 'month' | 'year' | 'all';
