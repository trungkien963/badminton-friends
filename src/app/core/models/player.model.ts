export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  winRate: number; // Percentage (0-100)
  totalWins: number;
  totalLosses: number;
  matchesPlayed: number;
  rankingScore: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'; // Just roughly based on logic
  isActive: boolean;
  historySetsResting?: number; // Used to track resting sets for <6 player condition
  playHistory?: string; // JSON string "[]" storing date history mappings for 1 column
}

export interface Match {
  id: string;
  date: Date;
  team1: Player[]; // 2 players
  team2: Player[]; // 2 players
  scoreTeam1?: number;
  scoreTeam2?: number;
  isCompleted: boolean;
}

export interface MatchSession {
  id: string;
  date: Date;
  participants: Player[];
  matches: Match[];
  status: 'Draft' | 'Ongoing' | 'Completed';
}
