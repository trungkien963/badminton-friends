import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Player } from '../models/player.model';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlayerService extends StorageService {
  private readonly PLAYERS_KEY = 'badminton_players';
  
  private playersSubject = new BehaviorSubject<Player[]>([]);
  public players$ = this.playersSubject.asObservable();

  constructor() {
    super();
    this.loadPlayers();
  }

  private loadPlayers(): void {
    const players = this.getItems<Player>(this.PLAYERS_KEY);
    this.playersSubject.next(players);
  }

  getPlayers(): Player[] {
    return this.playersSubject.getValue();
  }

  addPlayer(player: Partial<Player>): void {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: player.name || 'New Player',
      winRate: 0,
      totalWins: 0,
      totalLosses: 0,
      matchesPlayed: 0,
      rankingScore: 0,
      level: player.level || 'Intermediate',
      isActive: true,
      historySetsResting: 0,
      ...player
    };
    
    const players = [...this.getPlayers(), newPlayer];
    this.saveItems(this.PLAYERS_KEY, players);
    this.playersSubject.next(players);
  }

  updatePlayer(updatedPlayer: Player): void {
    const players = this.getPlayers().map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    this.saveItems(this.PLAYERS_KEY, players);
    this.playersSubject.next(players);
  }

  deletePlayer(id: string): void {
    const players = this.getPlayers().filter(p => p.id !== id);
    this.saveItems(this.PLAYERS_KEY, players);
    this.playersSubject.next(players);
  }
}
