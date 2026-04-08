import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { MatchmakingService } from '../../core/services/matchmaking.service';
import { RankingService } from '../../core/services/ranking.service';
import { Player, Match } from '../../core/models/player.model';

@Component({
  selector: 'app-match',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './match.component.html',
  styleUrls: ['./match.component.scss']
})
export class MatchComponent implements OnInit {
  private playerService = inject(PlayerService);
  private matchmakingService = inject(MatchmakingService);
  private rankingService = inject(RankingService);

  allPlayers: Player[] = [];
  selectedPlayers: Set<string> = new Set();
  
  targetMatchCount: number = 11; // Mặc định 11 trận ~ 2 tiếng (1 trận 11 phút)

  matches: Match[] = [];
  generated = false;
  sessionFinalized = false;

  // Timeline estimations
  estimatedTimePerMatch = 10; // minutes
  restTime = 1; // minute

  ngOnInit() {
    this.playerService.players$.subscribe(data => {
      this.allPlayers = data;
    });
  }

  toggleSelection(playerId: string) {
    if (this.selectedPlayers.has(playerId)) {
      this.selectedPlayers.delete(playerId);
    } else {
      this.selectedPlayers.add(playerId);
    }
  }

  generateSession() {
    const participants = this.allPlayers.filter(p => this.selectedPlayers.has(p.id));
    
    if (participants.length < 4 || participants.length > 8) {
      alert(`Xin lỗi, bạn cần chọn từ 4 đến 8 người chơi! (Bạn đang chọn ${participants.length} người)`);
      return;
    }

    this.matches = this.matchmakingService.generateMatches(participants, this.targetMatchCount);
    this.generated = true;
    this.sessionFinalized = false;
  }

  resetSession() {
    this.generated = false;
    this.sessionFinalized = false;
    this.matches = [];
  }

  markWinner(matchIndex: number, winningTeam: 1 | 2) {
    if(this.sessionFinalized) return;
    const m = this.matches[matchIndex];
    m.isCompleted = true;
    if (winningTeam === 1) {
      m.scoreTeam1 = 1;
      m.scoreTeam2 = 0;
    } else {
      m.scoreTeam1 = 0;
      m.scoreTeam2 = 1;
    }
  }

  undoMatch(matchIndex: number) {
    if(this.sessionFinalized) return;
    const m = this.matches[matchIndex];
    m.isCompleted = false;
    m.scoreTeam1 = undefined;
    m.scoreTeam2 = undefined;
  }

  getTodayStats() {
    // Array of {player, wins, matches}
    const statsMap = new Map<string, { player: Player, wins: number, losses: number, played: number }>();
    
    // Initialize stats map for all selected players
    const participants = this.allPlayers.filter(p => this.selectedPlayers.has(p.id));
    participants.forEach(p => {
       statsMap.set(p.id, { player: p, wins: 0, losses: 0, played: 0 });
    });

    this.matches.filter(m => m.isCompleted).forEach(m => {
       const t1Wins = m.scoreTeam1! > m.scoreTeam2!;

       m.team1.forEach(p => {
          if(!p) return;
          const s = statsMap.get(p.id)!;
          s.played++;
          if(t1Wins) s.wins++;
          else s.losses++;
       });

       m.team2.forEach(p => {
          if(!p) return;
          const s = statsMap.get(p.id)!;
          s.played++;
          if(!t1Wins) s.wins++;
          else s.losses++;
       });
    });

    return Array.from(statsMap.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.losses - b.losses; // fewer losses is better
    });
  }

  finalizeSession() {
    this.sessionFinalized = true;
    const participants = this.allPlayers.filter(p => this.selectedPlayers.has(p.id));
    const updatedPlayers = this.rankingService.calculateRankings(participants, this.matches);
    
    // Get stats from this session to save into playHistory
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayStats = this.getTodayStats();

    // Update players in storage
    updatedPlayers.forEach(p => {
        const stats = todayStats.find(s => s.player.id === p.id);
        if (stats) {
            let history: { date: string, matches: number, wins: number, losses: number }[] = [];
            if (p.playHistory) {
                try {
                    history = JSON.parse(p.playHistory);
                } catch(e) {}
            }
            const existingDay = history.find(h => h.date === todayStr);
            if (existingDay) {
                existingDay.matches += stats.played;
                existingDay.wins += stats.wins;
                existingDay.losses += stats.losses;
            } else {
                history.push({
                   date: todayStr,
                   matches: stats.played,
                   wins: stats.wins,
                   losses: stats.losses
                });
            }
            p.playHistory = JSON.stringify(history);
        }
        this.playerService.updatePlayer(p);
    });

    alert('Đã lưu kết quả buổi cáp kèo và cập nhật Bảng Xếp Hạng thành công!');
  }

  getEstimatedTimeRange(index: number): string {
    // Start at e.g. 0 minutes -> Match 1: 0 - 10m. Match 2: 11 - 21m.
    const startMin = index * (this.estimatedTimePerMatch + this.restTime);
    const endMin = startMin + this.estimatedTimePerMatch;
    
    // Convert to relative labels: +0m -> +10m, +11m -> +21m
    return `+${startMin}m - ${endMin}m`;
  }

  getFixedPairs() {
    const pairsMap = new Map<string, Player[]>();
    // Iterate to find unique pairs
    this.matches.forEach(m => {
      const t1id = [...m.team1].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>p.id).join('_');
      if(!pairsMap.has(t1id)) pairsMap.set(t1id, m.team1);

      const t2id = [...m.team2].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>p.id).join('_');
      if(!pairsMap.has(t2id)) pairsMap.set(t2id, m.team2);
    });
    return Array.from(pairsMap.values());
  }

  isFixedPairsSession(): boolean {
    return this.selectedPlayers.size === 4 || this.selectedPlayers.size === 8;
  }
}
