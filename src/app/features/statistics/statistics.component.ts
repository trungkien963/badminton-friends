import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  private playerService = inject(PlayerService);
  players: Player[] = [];
  leaderboardPlayers: Player[] = []; 

  selectedMonth: string = new Date().toISOString().slice(0, 7); // YYYY-MM
  monthlyStats: PlayerMonthlyStat[] = [];
  
  // Detail Modal State
  selectedPlayerForDetails: Player | null = null;
  selectedPlayerHistory: DailyRecord[] = [];

  ngOnInit() {
    this.playerService.players$.subscribe(data => {
      this.players = data.filter(p => p.isActive);
      this.leaderboardPlayers = [...this.players].sort((a, b) => b.rankingScore - a.rankingScore);
      this.generateMonthlyDataFromHistory();
    });
  }

  generateMonthlyDataFromHistory() {
    this.monthlyStats = [];
    const selectedYrMo = this.selectedMonth;

    this.players.forEach(p => {
       let totalDays = 0;
       let totalMatches = 0;
       let totalWins = 0;
       let totalLosses = 0;

       if (p.playHistory) {
           try {
               const history: DailyRecord[] = JSON.parse(p.playHistory);
               
               history.forEach(record => {
                   if (record.date && record.date.startsWith(selectedYrMo)) {
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

  onMonthChange(event: any) {
    this.selectedMonth = event.target.value;
    this.generateMonthlyDataFromHistory();
  }

  openDetails(stat: PlayerMonthlyStat) {
    this.selectedPlayerForDetails = stat.player;
    this.selectedPlayerHistory = [];
    
    if (stat.player.playHistory) {
      try {
        const fullHistory: DailyRecord[] = JSON.parse(stat.player.playHistory);
        this.selectedPlayerHistory = fullHistory
          .filter(h => h.date && h.date.startsWith(this.selectedMonth))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Latest first
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
