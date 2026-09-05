import fs from 'fs';
import path from 'path';

export interface StoredSubscription {
  userId: string;
  userEmail?: string;
  status: 'trial' | 'active' | 'expired';
  plan: 'premium_monthly' | 'trial';
  amount: number;
  currency: string;
  trialStartDate?: string;
  trialEndDate?: string;
  trialUsed: boolean;
  trialDaysRemaining?: number;
  startDate?: string; // ISO (for paid active)
  endDate?: string;   // ISO (startDate + 30 days)
  paymentMethod?: 'wave' | 'orange_money' | 'manual' | string;
  lastTransactionId?: string;
  senderPhone?: string;
  paymentReference?: string;
  updatedAt: string;
}

export interface StoredTransaction {
  id: string;
  userId: string;
  userEmail?: string;
  amount: number;
  currency: string;
  paymentMethod: 'wave' | 'orange_money' | 'wave_om' | string;
  targetPhone?: string;
  senderPhone?: string;
  paymentReference?: string;
  status: 'pending_verification' | 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'rejected';
  providerReference?: string;
  checkoutUrl?: string;
  verificationNote?: string;
  verifiedBy?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  isCredited: boolean; // Flag to guarantee idempotency and prevent replay attacks
}

interface DatabaseSchema {
  subscriptions: Record<string, StoredSubscription>; // keyed by userId
  transactions: Record<string, StoredTransaction>;    // keyed by transactionId
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'payment_records.json');

// Ensure data directory exists
function ensureDbFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = {
      subscriptions: {},
      transactions: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

function readDb(): DatabaseSchema {
  ensureDbFile();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.error('[DB] Error reading database file:', err);
    return { subscriptions: {}, transactions: {} };
  }
}

function writeDb(data: DatabaseSchema): void {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error writing to database file:', err);
  }
}

/**
 * Get subscription status for a user, enforcing expiration check against current server time
 * Initializes 7-day free trial on first visit (only once per user).
 */
export function getUserSubscription(userId: string, userEmail?: string): StoredSubscription {
  const db = readDb();
  let sub = db.subscriptions[userId];
  const now = new Date();

  // If new user: grant 7-day trial once
  if (!sub) {
    const trialStart = now;
    const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 jours
    sub = {
      userId,
      userEmail,
      status: 'trial',
      plan: 'trial',
      amount: 0,
      currency: 'FCFA',
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      trialUsed: true,
      trialDaysRemaining: 7,
      startDate: trialStart.toISOString(),
      endDate: trialEnd.toISOString(),
      updatedAt: now.toISOString()
    };
    db.subscriptions[userId] = sub;
    writeDb(db);
    return sub;
  }

  // If in trial mode: check if 7 days have passed
  if (sub.status === 'trial') {
    const trialEnd = new Date(sub.trialEndDate || sub.endDate || now);
    const diffMs = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    sub.trialDaysRemaining = daysRemaining;

    if (now > trialEnd) {
      sub.status = 'expired';
      sub.trialDaysRemaining = 0;
      sub.updatedAt = now.toISOString();
      db.subscriptions[userId] = sub;
      writeDb(db);
    }
    return sub;
  }

  // If in active paid mode: check if 1 month (30 days) has passed
  if (sub.status === 'active' && sub.endDate) {
    const expiry = new Date(sub.endDate);
    if (now > expiry) {
      sub.status = 'expired';
      sub.updatedAt = now.toISOString();
      db.subscriptions[userId] = sub;
      writeDb(db);
    }
    return sub;
  }

  return sub;
}

/**
 * Save or update a subscription
 */
export function saveUserSubscription(sub: StoredSubscription): void {
  const db = readDb();
  db.subscriptions[sub.userId] = sub;
  writeDb(db);
}

/**
 * Create a new pending transaction
 */
export function createTransaction(tx: Omit<StoredTransaction, 'createdAt' | 'isCredited'>): StoredTransaction {
  const db = readDb();
  const fullTx: StoredTransaction = {
    ...tx,
    createdAt: new Date().toISOString(),
    isCredited: false
  };
  db.transactions[tx.id] = fullTx;
  writeDb(db);
  return fullTx;
}

/**
 * Find transaction by ID
 */
export function getTransaction(transactionId: string): StoredTransaction | null {
  const db = readDb();
  return db.transactions[transactionId] || null;
}

/**
 * Find transaction by provider reference (e.g. Wave Checkout Session ID)
 */
export function getTransactionByProviderRef(ref: string): StoredTransaction | null {
  const db = readDb();
  for (const tx of Object.values(db.transactions)) {
    if (tx.providerReference === ref) {
      return tx;
    }
  }
  return null;
}

/**
 * Update transaction status
 */
export function updateTransaction(
  transactionId: string, 
  updates: Partial<StoredTransaction>
): StoredTransaction | null {
  const db = readDb();
  const tx = db.transactions[transactionId];
  if (!tx) {
    return null;
  }
  const updatedTx = { ...tx, ...updates };
  db.transactions[transactionId] = updatedTx;
  writeDb(db);
  return updatedTx;
}

/**
 * Get all transactions for a user
 */
export function getUserTransactions(userId: string): StoredTransaction[] {
  const db = readDb();
  return Object.values(db.transactions)
    .filter(t => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Activate 1-month subscription for a verified transaction (30 days duration)
 * Strictly protects against replay attacks by verifying `isCredited === false`.
 */
export function activateSubscriptionForTransaction(
  transactionId: string
): { success: boolean; subscription?: StoredSubscription; error?: string } {
  const db = readDb();
  const tx = db.transactions[transactionId];

  if (!tx) {
    return { success: false, error: "Transaction introuvable sur le serveur." };
  }

  if (tx.status !== 'completed') {
    return { success: false, error: `La transaction n'est pas complétée (statut actuel: ${tx.status}).` };
  }

  if (tx.isCredited) {
    return { success: false, error: "Cette transaction a déjà été utilisée pour activer un abonnement (anti-rejeu)." };
  }

  // Calculate dates: 1 month duration (30 days)
  const now = new Date();
  const currentSub = db.subscriptions[tx.userId];
  
  let startDate = now;
  // If user has an active subscription that hasn't expired yet, extend from existing endDate
  if (currentSub && currentSub.status === 'active' && new Date(currentSub.endDate) > now) {
    startDate = new Date(currentSub.endDate);
  }

  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 jours

  const newSub: StoredSubscription = {
    userId: tx.userId,
    userEmail: tx.userEmail,
    status: 'active',
    plan: 'premium_monthly',
    amount: tx.amount,
    currency: tx.currency,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    trialUsed: true,
    trialStartDate: currentSub?.trialStartDate,
    trialEndDate: currentSub?.trialEndDate,
    paymentMethod: tx.paymentMethod,
    lastTransactionId: tx.id,
    updatedAt: now.toISOString()
  };

  // Mark transaction as credited
  tx.isCredited = true;
  tx.completedAt = now.toISOString();
  db.transactions[transactionId] = tx;

  // Save subscription
  db.subscriptions[tx.userId] = newSub;
  writeDb(db);

  return { success: true, subscription: newSub };
}

/**
 * Get all pending verification transactions (for merchant review)
 */
export function getPendingVerificationTransactions(): StoredTransaction[] {
  const db = readDb();
  return Object.values(db.transactions)
    .filter(t => t.status === 'pending_verification')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Merchant / Admin approves a payment declaration
 * Verifies that the payment was received on 78 968 16 83 and activates 1 month Premium
 */
export function verifyAndApproveManualPayment(
  transactionId: string,
  verifiedBy: string = 'Marchand (78 968 16 83)',
  note?: string
): { success: boolean; subscription?: StoredSubscription; transaction?: StoredTransaction; error?: string } {
  const db = readDb();
  const tx = db.transactions[transactionId];

  if (!tx) {
    return { success: false, error: "Déclaration de transaction introuvable." };
  }

  if (tx.isCredited) {
    return { success: false, error: "Cette transaction a déjà été créditée et activée." };
  }

  // Update transaction status to completed
  tx.status = 'completed';
  tx.verifiedBy = verifiedBy;
  tx.verificationNote = note || "Paiement vérifié et validé avec succès sur le 78 968 16 83";
  tx.completedAt = new Date().toISOString();
  db.transactions[transactionId] = tx;
  writeDb(db);

  // Activate 1-month subscription
  const activation = activateSubscriptionForTransaction(transactionId);
  if (!activation.success) {
    return { success: false, error: activation.error };
  }

  return {
    success: true,
    subscription: activation.subscription,
    transaction: db.transactions[transactionId]
  };
}

/**
 * Merchant / Admin rejects an invalid payment declaration
 */
export function rejectManualPayment(
  transactionId: string,
  reason: string = "Aucun transfert correspondant reçu sur le 78 968 16 83"
): { success: boolean; transaction?: StoredTransaction; error?: string } {
  const db = readDb();
  const tx = db.transactions[transactionId];

  if (!tx) {
    return { success: false, error: "Transaction introuvable." };
  }

  if (tx.isCredited) {
    return { success: false, error: "Impossible de rejeter une transaction déjà créditée." };
  }

  tx.status = 'rejected';
  tx.errorMessage = reason;
  tx.verificationNote = `Rejeté : ${reason}`;
  db.transactions[transactionId] = tx;
  writeDb(db);

  return { success: true, transaction: tx };
}
