import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/models/player.model';

interface PlayerMonthlyStat {
  player: Player;
  days: number;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface DailyRecord {
  date: string;
  matches: number;
  wins: number;
  losses: number;
}

type FilterMode = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  private playerService = inject(PlayerService);
  players: Player[] = [];
  leaderboardPlayers: Player[] = []; 

  filterMode: FilterMode = 'month';

  selectedDate: string = new Date().toISOString().slice(0, 10);
  selectedWeek: string = '';
  selectedMonth: string = new Date().toISOString().slice(0, 7);
  selectedQuarter: string = '1';
  selectedYearForQuarter: number = new Date().getFullYear();
  selectedYear: number = new Date().getFullYear();
  startDate: string = new Date().toISOString().slice(0, 10);
  endDate: string = new Date().toISOString().slice(0, 10);

  monthlyStats: PlayerMonthlyStat[] = [];
  
  // Detail Modal State
  selectedPlayerForDetails: Player | null = null;
  selectedPlayerHistory: DailyRecord[] = [];

  ngOnInit() {
    this.selectedQuarter = (Math.floor(new Date().getMonth() / 3) + 1).toString();
    this.selectedWeek = this.getCurrentWeekString();

    this.playerService.players$.subscribe(data => {
      this.players = data.filter(p => p.isActive);
      this.leaderboardPlayers = [...this.players]
        .filter(p => !p.name?.toUpperCase().includes('GUEST'))
        .sort((a, b) => b.rankingScore - a.rankingScore);
      this.generateData();
    });
  }

  getCurrentWeekString(): string {
     const date = new Date();
     date.setHours(0, 0, 0, 0);
     date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
     const week1 = new Date(date.getFullYear(), 0, 4);
     const week = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
     return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
  }

  getWeekRange(weekStr: string): [string, string] {
      if (!weekStr) return ['', ''];
      const parts = weekStr.split('-W');
      if (parts.length !== 2) return ['', ''];
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[1], 10);

      const d = new Date(year, 0, 4);
      const dayNum = d.getDay() || 7;
      d.setDate(d.getDate() - (dayNum - 1));
      d.setDate(d.getDate() + (week - 1) * 7);

      const start = new Date(d);
      d.setDate(d.getDate() + 6);
      const end = new Date(d);
      
      return [this.formatDateStr(start), this.formatDateStr(end)];
  }

  formatDateStr(d: Date): string {
     const y = d.getFullYear();
     const m = (d.getMonth()+1).toString().padStart(2, '0');
     const day = d.getDate().toString().padStart(2, '0');
     return `${y}-${m}-${day}`;
  }

  getDateRange(): [string, string] {
      switch (this.filterMode) {
        case 'day': return [this.selectedDate, this.selectedDate];
        case 'week': return this.getWeekRange(this.selectedWeek);
        case 'month': {
            if (!this.selectedMonth) return ['', ''];
            const parts = this.selectedMonth.split('-');
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const start = `${this.selectedMonth}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            const end = `${this.selectedMonth}-${lastDay}`;
            return [start, end];
        }
        case 'quarter': {
            const y = this.selectedYearForQuarter;
            const q = parseInt(this.selectedQuarter, 10);
            const startMonth = (q - 1) * 3 + 1;
            const endMonth = q * 3;
            const start = `${y}-${startMonth.toString().padStart(2, '0')}-01`;
            const lastDay = new Date(y, endMonth, 0).getDate();
            const end = `${y}-${endMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
            return [start, end];
        }
        case 'year': {
            const y = this.selectedYear;
            return [`${y}-01-01`, `${y}-12-31`];
        }
        case 'custom': {
            let s = this.startDate;
            let e = this.endDate;
            if (s > e) {
               [s, e] = [e, s];
            }
            return [s || '', e || ''];
        }
      }
      return ['', ''];
  }

  normalizeDate(dStr: string): string {
      if (!dStr) return '';
      if (dStr.includes('/')) {
          const p = dStr.split('/');
          if (p.length === 3) {
              return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
          }
      }
      if (dStr.includes('T')) {
          return dStr.split('T')[0];
      }
      return dStr;
  }

  generateData() {
    this.monthlyStats = [];
    let [start, end] = this.getDateRange();
    start = this.normalizeDate(start);
    end = this.normalizeDate(end);

    this.players.forEach(p => {
       let totalDays = 0;
       let totalMatches = 0;
       let totalWins = 0;
       let totalLosses = 0;

       if (p.playHistory) {
           try {
               const history: DailyRecord[] = JSON.parse(p.playHistory);
               
               history.forEach(record => {
                   const rDate = this.normalizeDate(record.date);
                   if (rDate && rDate >= start && rDate <= end) {
                       totalDays += 1;
                       totalMatches += (record.matches || 0);
                       totalWins += (record.wins || 0);
                       totalLosses += (record.losses || 0);
                   }
               });
           } catch(e) {
               console.error('Error parsing playHistory', e);
           }
       }
       
       const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

       this.monthlyStats.push({
         player: p,
         days: totalDays,
         matches: totalMatches,
         wins: totalWins,
         losses: totalLosses,
         winRate: winRate
       });
    });

    this.monthlyStats.sort((a, b) => {
      if (b.days !== a.days) return b.days - a.days;
      return b.winRate - a.winRate;
    });
  }

  onFilterModeChange() {
    this.generateData();
  }

  getFilterDisplayName(): string {
     switch (this.filterMode) {
        case 'day': {
            const parts = this.selectedDate.split('-');
            return parts.length === 3 ? `Ngày ${parts[2]}/${parts[1]}/${parts[0]}` : `Ngày ${this.selectedDate}`;
        }
        case 'week': {
            const parts = this.selectedWeek.split('-W');
            return parts.length === 2 ? `Tuần ${parts[1]} (${parts[0]})` : 'Tuần';
        }
        case 'month': {
            const parts = this.selectedMonth.split('-');
            return parts.length === 2 ? `Tháng ${parts[1]}/${parts[0]}` : `Tháng ${this.selectedMonth}`;
        }
        case 'quarter': return `Quý ${this.selectedQuarter}/${this.selectedYearForQuarter}`;
        case 'year': return `Năm ${this.selectedYear}`;
        case 'custom': {
            const sParts = this.startDate.split('-');
            const sFormat = sParts.length === 3 ? `${sParts[2]}/${sParts[1]}/${sParts[0]}` : this.startDate;
            const eParts = this.endDate.split('-');
            const eFormat = eParts.length === 3 ? `${eParts[2]}/${eParts[1]}/${eParts[0]}` : this.endDate;
            return `Từ ${sFormat} đến ${eFormat}`;
        }
     }
     return '';
  }

  openDetails(stat: PlayerMonthlyStat) {
    this.selectedPlayerForDetails = stat.player;
    this.selectedPlayerHistory = [];
    
    if (stat.player.playHistory) {
      try {
        let [start, end] = this.getDateRange();
        start = this.normalizeDate(start);
        end = this.normalizeDate(end);
        
        const fullHistory: DailyRecord[] = JSON.parse(stat.player.playHistory);
        this.selectedPlayerHistory = fullHistory
          .filter(h => {
              const rDate = this.normalizeDate(h.date);
              return rDate && rDate >= start && rDate <= end;
          })
          .sort((a, b) => {
              const d1 = this.normalizeDate(a.date);
              const d2 = this.normalizeDate(b.date);
              return new Date(d2).getTime() - new Date(d1).getTime();
          });
      } catch (e) {
        console.error('Error parsing history for details', e);
      }
    }
  }

  closeDetails() {
    this.selectedPlayerForDetails = null;
    this.selectedPlayerHistory = [];
  }
}
