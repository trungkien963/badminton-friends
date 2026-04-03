import { Injectable } from '@angular/core';
import { Player, Match } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class RankingService {

  constructor() { }

  /**
   * Tính toán lại điểm số cho các người chơi sau một danh sách các trận đấu.
   * Công thức: PlayerRank = (Wins * 3) - (Losses * 1) + (Participation * 2)
   * Hoặc tính lại WinRate.
   */
  public calculateRankings(players: Player[], completedMatches: Match[]): Player[] {
    // 1. Reset Stats for calculation if we calculate from scratch, 
    // but typically we just add to existing metrics.
    // For this design, let's assume this updates players based on new completed matches.

    const updatedPlayers = players.map(p => ({...p}));

    completedMatches.forEach(match => {
      if (match.isCompleted && match.scoreTeam1 !== undefined && match.scoreTeam2 !== undefined) {
        const t1Wins = match.scoreTeam1 > match.scoreTeam2;
        const isDraw = match.scoreTeam1 === match.scoreTeam2;

        // Update Team 1
        match.team1.forEach(p1 => {
          const playerRecord = updatedPlayers.find(up => up.id === p1.id);
          if (playerRecord) {
             playerRecord.matchesPlayed += 1;
             if (t1Wins) playerRecord.totalWins += 1;
             else if (!isDraw) playerRecord.totalLosses += 1;
          }
        });

        // Update Team 2
        match.team2.forEach(p2 => {
            const playerRecord = updatedPlayers.find(up => up.id === p2.id);
            if (playerRecord) {
               playerRecord.matchesPlayed += 1;
               if (!t1Wins && !isDraw) playerRecord.totalWins += 1;
               else if (!isDraw) playerRecord.totalLosses += 1;
            }
        });
      }
    });

    // 2. Re-calculate WinRate and RankingScore
    updatedPlayers.forEach(p => {
        if (p.matchesPlayed > 0) {
            p.winRate = Math.round((p.totalWins / p.matchesPlayed) * 100);
        } else {
            p.winRate = 0;
        }

        // System: WinRate + Bonus for participation (e.g. 5 points per match played to encourage activity)
        p.rankingScore = p.winRate + (p.matchesPlayed * 5);
    });

    // 3. Sort by Ranking Score
    updatedPlayers.sort((a, b) => b.rankingScore - a.rankingScore);

    return updatedPlayers;
  }
}
