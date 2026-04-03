import { Injectable } from '@angular/core';
import { Player, Match } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {

  constructor() { }

  /**
   * Main entry logic for Matchmaking.
   */
  public generateMatches(participants: Player[], targetMatchCount: number = 6): Match[] {
    const num = participants.length;

    if (num === 8) {
      return this.generateMatchesFor8(participants, targetMatchCount);
    } else if (num === 4) {
      return this.generateMatchesFor4(participants, targetMatchCount);
    } else if (num >= 5 && num <= 7) {
      return this.generateMatchesWithResting(participants, targetMatchCount);
    }

    return [];
  }

  /**
   * 8 players: form 4 pairs, then Round Robin repeatedly until targetMatchCount.
   */
  private generateMatchesFor8(participants: Player[], targetMatchCount: number): Match[] {
    const sorted = [...participants].sort((a, b) => b.rankingScore - a.rankingScore);
    const strongPool = sorted.slice(0, 4);
    const weakPool = sorted.slice(4, 8);

    this.shuffleArray(strongPool);
    this.shuffleArray(weakPool);

    const pairs: Player[][] = [];
    for (let i = 0; i < 4; i++) {
        pairs.push([strongPool[i], weakPool[i]]);
    }
    
    // A distinct round robin for 4 pairs has exactly 6 unique match combinations.
    const roundRobinList: Match[] = [];
    roundRobinList.push(this.createMatch(pairs[0], pairs[1]));
    roundRobinList.push(this.createMatch(pairs[2], pairs[3]));
    roundRobinList.push(this.createMatch(pairs[0], pairs[2]));
    roundRobinList.push(this.createMatch(pairs[1], pairs[3]));
    roundRobinList.push(this.createMatch(pairs[0], pairs[3]));
    roundRobinList.push(this.createMatch(pairs[1], pairs[2]));

    // Extend to targetMatchCount
    return this.extendScheduleToTargetCount(roundRobinList, targetMatchCount);
  }

  /**
   * 4 players: 3 unique match combinations. Extend until target.
   */
  private generateMatchesFor4(participants: Player[], targetMatchCount: number): Match[] {
    const p = [...participants];
    this.shuffleArray(p);

    const roundRobinList: Match[] = [];
    roundRobinList.push(this.createMatch([p[0], p[1]], [p[2], p[3]]));
    roundRobinList.push(this.createMatch([p[0], p[2]], [p[1], p[3]]));
    roundRobinList.push(this.createMatch([p[0], p[3]], [p[1], p[2]]));

    return this.extendScheduleToTargetCount(roundRobinList, targetMatchCount);
  }

  private extendScheduleToTargetCount(baseSchedule: Match[], targetCount: number): Match[] {
    const extended: Match[] = [];
    let cycleCount = 0;
    while(extended.length < targetCount) {
       for(let i = 0; i < baseSchedule.length; i++) {
          if (extended.length >= targetCount) break;
          // clone the match layout
          extended.push(this.createMatch(baseSchedule[i].team1, baseSchedule[i].team2));
       }
       cycleCount++;
    }
    return extended;
  }

  /**
   * For 5, 6, 7 players. Rotate players so those with fewest matches play.
   */
  public generateMatchesWithResting(participants: Player[], targetMatchCount: number): Match[] {
    const p = [...participants];
    const matches: Match[] = [];
    
    // reset tracking for this generation
    let playCounts = new Map<string, number>();
    let restConsecutive = new Map<string, number>();
    p.forEach(player => {
        playCounts.set(player.id, 0);
        restConsecutive.set(player.id, 0);
    });

    for(let m = 0; m < targetMatchCount; m++) {
        // Sort players priority to PLAY:
        // 1. Highest priority: rested consecutively > 0 
        // 2. Play count lowest
        // 3. Random
        p.sort((a, b) => {
            const restA = restConsecutive.get(a.id)!;
            const restB = restConsecutive.get(b.id)!;
            if (restA !== restB) return restB - restA; // Higher rest comes first
            
            const countA = playCounts.get(a.id)!;
            const countB = playCounts.get(b.id)!;
            if (countA !== countB) return countA - countB; // Lower play count comes first
            return 0.5 - Math.random();
        });

        // Pick top 4 to play
        const playing = p.slice(0, 4);
        const resting = p.slice(4);

        // Update counts
        playing.forEach(player => {
            playCounts.set(player.id, playCounts.get(player.id)! + 1);
            restConsecutive.set(player.id, 0);
        });
        resting.forEach(player => {
            restConsecutive.set(player.id, restConsecutive.get(player.id)! + 1);
        });

        this.shuffleArray(playing);
        matches.push(this.createMatch([playing[0], playing[1]], [playing[2], playing[3]]));
    }

    return matches;
  }

  private createMatch(team1: Player[], team2: Player[]): Match {
    return {
      id: crypto.randomUUID(),
      date: new Date(),
      team1: [...team1],
      team2: [...team2],
      isCompleted: false
    };
  }

  private shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
