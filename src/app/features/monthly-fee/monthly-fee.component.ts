import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { FeeService } from '../../core/services/fee.service';
import { Player } from '../../core/models/player.model';
import { Expense, PlayerFeeStatus } from '../../core/models/fee.model';
import { UiService } from '../../core/services/ui.service';

interface PlayerFeeRow {
  player: Player;
  daysPlayed: number;
  grossOwe: number;
  deduct: number;
  carryOver: number;
  totalOwe: number;
  isPaid: boolean;
}

@Component({
  selector: 'app-monthly-fee',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './monthly-fee.component.html',
  styleUrls: ['./monthly-fee.component.scss']
})
export class MonthlyFeeComponent implements OnInit {
  private playerService = inject(PlayerService);
  private feeService = inject(FeeService);
  private uiService = inject(UiService);

  players: Player[] = [];
  expenses: Expense[] = [];
  feeStatuses: PlayerFeeStatus[] = [];

  selectedMonth: string = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  expensesInMonth: Expense[] = [];
  totalExpenseAmount: number = 0;
  costPerDay: number = 0;

  feeRows: PlayerFeeRow[] = [];

  // Form
  showForm: boolean = false;
  selectedPlayerDetails: PlayerFeeRow | null = null;
  newExpense: Partial<Expense> = {
    description: '',
    amount: null as any,
    payerId: 'fund',
    date: new Date().toISOString().split('T')[0]
  };

  // Form State
  displayAmount: string = '';
  expenseCategory: string = 'Mua cầu';
  customExpenseDesc: string = '';

  onAmountChange(val: string) {
    if (!val) {
      this.displayAmount = '';
      this.newExpense.amount = null as any;
      return;
    }
    // Remove non-digit characters
    const numericStr = val.replace(/\D/g, '');
    if (numericStr) {
       this.newExpense.amount = parseInt(numericStr, 10);
       this.displayAmount = new Intl.NumberFormat('vi-VN').format(this.newExpense.amount);
    } else {
       this.displayAmount = '';
       this.newExpense.amount = null as any;
    }
  }

  ngOnInit() {
    this.playerService.players$.subscribe(data => {
      this.players = data.filter(p => p.isActive);
      this.calculateAll();
    });

    this.feeService.expenses$.subscribe(exps => {
      this.expenses = exps;
      this.calculateAll();
    });

    this.feeService.feeStatus$.subscribe(sts => {
      this.feeStatuses = sts;
      this.calculateAll();
    });
  }

  onMonthChange(event: any) {
    this.selectedMonth = event.target.value;
    this.newExpense.date = `${this.selectedMonth}-01`;
    // Optionally set to today if it's current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (this.selectedMonth === currentMonth) {
      this.newExpense.date = new Date().toISOString().split('T')[0];
    }
    this.calculateAll();
  }

  calculateAll() {
    this.expensesInMonth = this.expenses.filter(e => e.month === this.selectedMonth);
    this.totalExpenseAmount = this.expensesInMonth.reduce((acc, curr) => acc + Number(curr.amount), 0);

    // Get all unique months we have data for, to properly calculate carry over
    const allMonthsSet = new Set<string>();
    this.expenses.forEach(e => allMonthsSet.add(e.month));
    this.players.forEach(p => {
      if (p.playHistory) {
        try {
          const history = JSON.parse(p.playHistory);
          history.forEach((r: any) => {
            if (r.date) allMonthsSet.add(r.date.slice(0, 7));
          });
        } catch {}
      }
    });

    let allMonths = Array.from(allMonthsSet).sort((a, b) => a.localeCompare(b));
    // Must include selectedMonth
    if (!allMonths.includes(this.selectedMonth)) {
        allMonths.push(this.selectedMonth);
        allMonths.sort((a, b) => a.localeCompare(b));
    }

    this.feeRows = [];

    // Temporary calculations for Selected Month Globals
    let totalDaysInSelectedMonth = 0;

    const playerCalcs = new Map<string, PlayerFeeRow>();

    this.players.forEach(p => {
      let runningDebt = 0;
      let daysSelectedMonth = 0;
      let grossSelected = 0;
      let deductSelected = 0;
      
      const pHistory = p.playHistory ? JSON.parse(p.playHistory) : [];

      for (const m of allMonths) {
        if (m > this.selectedMonth) break;

        // Days played in month m
        let daysInM = 0;
        pHistory.forEach((r: any) => {
            if (r.date && r.date.startsWith(m)) daysInM += 1;
        });

        // Total attendance of everyone in month m
        let totalAttendanceInM = 0;
        this.players.forEach(otherP => {
           const otherHist = otherP.playHistory ? JSON.parse(otherP.playHistory) : [];
           otherHist.forEach((r: any) => {
               if (r.date && r.date.startsWith(m)) totalAttendanceInM += 1;
           });
        });

        const expsInM = this.expenses.filter(e => e.month === m);
        const totalExpInM = expsInM.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const myDeductInM = expsInM.filter(e => e.payerId === p.id).reduce((acc, curr) => acc + Number(curr.amount), 0);

        const costDayM = totalAttendanceInM > 0 ? (totalExpInM / totalAttendanceInM) : 0;
        const myGrossM = daysInM * costDayM;
        const myNetM = myGrossM - myDeductInM;

        if (m === this.selectedMonth) {
            daysSelectedMonth = daysInM;
            grossSelected = myGrossM;
            deductSelected = myDeductInM;
            totalDaysInSelectedMonth += daysInM;
        } else {
            runningDebt += myNetM;
            const statusM = this.feeStatuses.find(s => s.month === m && s.playerId === p.id);
            if (statusM && statusM.isPaid) {
                runningDebt = 0; // Reset
            }
        }
      }

      const statusSelected = this.feeStatuses.find(s => s.month === this.selectedMonth && s.playerId === p.id);

      playerCalcs.set(p.id, {
          player: p,
          daysPlayed: daysSelectedMonth,
          grossOwe: grossSelected,
          deduct: deductSelected,
          carryOver: runningDebt,
          totalOwe: grossSelected - deductSelected + runningDebt,
          isPaid: statusSelected ? statusSelected.isPaid : false
      });
    });

    this.costPerDay = totalDaysInSelectedMonth > 0 ? (this.totalExpenseAmount / totalDaysInSelectedMonth) : 0;

    // Build Rows
    this.players.forEach(p => {
        this.feeRows.push(playerCalcs.get(p.id)!);
    });
    
    // Sort so unpaid and owes are at top
    this.feeRows.sort((a,b) => b.totalOwe - a.totalOwe);
  }

  openDetails(row: PlayerFeeRow) {
      this.selectedPlayerDetails = row;
  }

  closeDetails() {
      this.selectedPlayerDetails = null;
  }

  addExpenseSubmit() {
    // Validate custom desc
    if (this.expenseCategory === 'Khác') {
        if (!this.customExpenseDesc.trim()) {
            this.uiService.showWarning('Thiếu thông tin', 'Vui lòng nhập chi tiết nội dung chi!');
            return;
        }
        this.newExpense.description = this.customExpenseDesc.trim();
    } else {
        this.newExpense.description = this.expenseCategory;
    }

    if (!this.newExpense.description || !this.newExpense.amount) return;
    this.feeService.addExpense(this.newExpense);
    this.showForm = false;
    this.newExpense = {
        description: '',
        amount: null as any,
        payerId: 'fund',
        date: new Date().toISOString().split('T')[0]
    };
    this.displayAmount = '';
    this.expenseCategory = 'Mua cầu';
    this.customExpenseDesc = '';
  }

  async deleteExpense(id: string) {
    const isConfirmed = await this.uiService.confirm(
      'Xóa khoản chi',
      'Bạn có chắc chắn muốn xoá khoản chi này?'
    );
    if(isConfirmed) {
        this.feeService.deleteExpense(id);
    }
  }

  togglePayment(playerId: string) {
    this.feeService.togglePaymentStatus(playerId, this.selectedMonth);
  }

  Math = Math;

  sortNull() {
    return 0;
  }

  getPlayerName(id: string): string {
    const p = this.players.find(p => p.id === id);
    return p ? p.name : 'Không rõ';
  }
}
