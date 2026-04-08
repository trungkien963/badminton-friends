export interface Expense {
  id: string;
  description: string;
  amount: number;
  payerId: string; // The player who paid
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
}

export interface PlayerFeeStatus {
  playerId: string;
  month: string; // YYYY-MM
  isPaid: boolean;
}
