import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { Expense, PlayerFeeStatus } from '../models/fee.model';
import { BehaviorSubject } from 'rxjs';
import { GoogleSheetsService } from './google-sheets.service';
import { UiService } from './ui.service';

@Injectable({
  providedIn: 'root'
})
export class FeeService extends StorageService {
  private readonly EXPENSES_KEY = 'badminton_expenses';
  private readonly FEE_STATUS_KEY = 'badminton_fee_status';
  
  private googleSheetsService = inject(GoogleSheetsService);
  private uiService = inject(UiService);

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
    this.uiService.showLoading('Đang tải dữ liệu...');
    this.googleSheetsService.fetchFinanceFromSheet().subscribe({
      next: (res) => {
        let hasData = false;
        
        // Helper specifically for fixing Google Apps Script corrupted Date strings 
        // e.g., "2026-04" -> "2026-03-31T15:00:00.000Z" due to UTC shift
        const fixDateString = (isoString: string, isMonthOnly: boolean = false) => {
           if (!isoString) return '';
           if (!isoString.includes('T')) {
               return isMonthOnly ? isoString.substring(0, 7) : isoString.substring(0, 10);
           }
           const d = new Date(isoString);
           // Add 12 hours to safely push it into the intended day/month irrespective of timezone
           d.setHours(d.getHours() + 12);
           const yr = d.getFullYear();
           const mo = String(d.getMonth() + 1).padStart(2, '0');
           const dt = String(d.getDate()).padStart(2, '0');
           return isMonthOnly ? `${yr}-${mo}` : `${yr}-${mo}-${dt}`;
        };

        if (res.expenses && res.expenses.length > 0) {
           const mappedExpenses = res.expenses.map((e: any) => ({
              ...e,
              date: fixDateString(e.date),
              month: fixDateString(e.month, true) || fixDateString(e.date, true) || new Date().toISOString().slice(0, 7)
           }));
           this.saveItems(this.EXPENSES_KEY, mappedExpenses);
           this.expensesSubject.next(mappedExpenses);
           hasData = true;
        }
        if (res.feeStatus && res.feeStatus.length > 0) {
           const mappedStatuses = res.feeStatus.map((s: any) => ({
              ...s,
              month: fixDateString(s.month, true)
           }));
           this.saveItems(this.FEE_STATUS_KEY, mappedStatuses);
           this.feeStatusSubject.next(mappedStatuses);
           hasData = true;
        }
        this.uiService.hideLoading();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu tài chính:', err);
        this.uiService.hideLoading();
      }
    });
  }

  private syncToCloud(): void {
      this.uiService.showLoading('Đang lưu dữ liệu...');
      const expenses = this.expensesSubject.getValue();
      const feeStatus = this.feeStatusSubject.getValue();
      this.googleSheetsService.syncFinanceToSheet(expenses, feeStatus).subscribe({
          next: (res) => {
              console.log('Đã đồng bộ TÀI CHÍNH lên Google Sheet', res);
              this.uiService.hideLoading();
          },
          error: (err) => {
              console.error('Lỗi lưu dữ liệu tài chính:', err);
              this.uiService.hideLoading();
          }
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
