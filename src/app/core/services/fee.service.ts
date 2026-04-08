import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Expense, PlayerFeeStatus } from '../models/fee.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeeService extends StorageService {
  private readonly EXPENSES_KEY = 'badminton_expenses';
  private readonly FEE_STATUS_KEY = 'badminton_fee_status';

  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  public expenses$ = this.expensesSubject.asObservable();

  private feeStatusSubject = new BehaviorSubject<PlayerFeeStatus[]>([]);
  public feeStatus$ = this.feeStatusSubject.asObservable();

  constructor() {
    super();
    this.loadData();
  }

  private loadData(): void {
    const expenses = this.getItems<Expense>(this.EXPENSES_KEY);
    this.expensesSubject.next(expenses);
    
    const statuses = this.getItems<PlayerFeeStatus>(this.FEE_STATUS_KEY);
    this.feeStatusSubject.next(statuses);
  }

  addExpense(expense: Partial<Expense>): void {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: expense.description || 'Chi phí',
      amount: expense.amount || 0,
      payerId: expense.payerId || '',
      date: expense.date || new Date().toISOString().split('T')[0],
      month: (expense.date ? expense.date.slice(0, 7) : new Date().toISOString().slice(0, 7)),
    };
    const expenses = [...this.expensesSubject.getValue(), newExpense];
    this.saveItems(this.EXPENSES_KEY, expenses);
    this.expensesSubject.next(expenses);
  }

  deleteExpense(id: string): void {
    const expenses = this.expensesSubject.getValue().filter(e => e.id !== id);
    this.saveItems(this.EXPENSES_KEY, expenses);
    this.expensesSubject.next(expenses);
  }

  togglePaymentStatus(playerId: string, month: string): void {
    const statuses = [...this.feeStatusSubject.getValue()];
    const index = statuses.findIndex(s => s.playerId === playerId && s.month === month);
    if (index >= 0) {
      statuses[index].isPaid = !statuses[index].isPaid;
    } else {
      statuses.push({ playerId, month, isPaid: true });
    }
    this.saveItems(this.FEE_STATUS_KEY, statuses);
    this.feeStatusSubject.next(statuses);
  }
}
