import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { Expense, PlayerFeeStatus } from '../models/fee.model';
import { BehaviorSubject } from 'rxjs';
import { GoogleSheetsService } from './google-sheets.service';

@Injectable({
  providedIn: 'root'
})
export class FeeService extends StorageService {
  private readonly EXPENSES_KEY = 'badminton_expenses';
  private readonly FEE_STATUS_KEY = 'badminton_fee_status';
  
  private googleSheetsService = inject(GoogleSheetsService);

  private expensesSubject = new BehaviorSubject<Expense[]>([]);
  public expenses$ = this.expensesSubject.asObservable();

  private feeStatusSubject = new BehaviorSubject<PlayerFeeStatus[]>([]);
  public feeStatus$ = this.feeStatusSubject.asObservable();

  constructor() {
    super();
    this.loadData();
    this.syncFromCloud();
  }

  private loadData(): void {
    const expenses = this.getItems<Expense>(this.EXPENSES_KEY);
    this.expensesSubject.next(expenses);
    
    const statuses = this.getItems<PlayerFeeStatus>(this.FEE_STATUS_KEY);
    this.feeStatusSubject.next(statuses);
  }

  private syncFromCloud(): void {
    this.googleSheetsService.fetchFinanceFromSheet().subscribe(res => {
        if ((res.expenses && res.expenses.length > 0) || (res.feeStatus && res.feeStatus.length > 0)) {
           this.saveItems(this.EXPENSES_KEY, res.expenses);
           this.expensesSubject.next(res.expenses);

           this.saveItems(this.FEE_STATUS_KEY, res.feeStatus);
           this.feeStatusSubject.next(res.feeStatus);
        }
    });
  }

  private syncToCloud(): void {
      const expenses = this.expensesSubject.getValue();
      const feeStatus = this.feeStatusSubject.getValue();
      this.googleSheetsService.syncFinanceToSheet(expenses, feeStatus).subscribe(res => {
          console.log('Đã đồng bộ TÀI CHÍNH lên Google Sheet', res);
      });
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
    this.syncToCloud();
  }

  deleteExpense(id: string): void {
    const expenses = this.expensesSubject.getValue().filter(e => e.id !== id);
    this.saveItems(this.EXPENSES_KEY, expenses);
    this.expensesSubject.next(expenses);
    this.syncToCloud();
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
    this.syncToCloud();
  }
}
