import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Player } from '../models/player.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { GoogleSheetsService } from './google-sheets.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerService extends StorageService {
  private readonly PLAYERS_KEY = 'badminton_players';
  
  private playersSubject = new BehaviorSubject<Player[]>([]);
  public players$ = this.playersSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private googleSheetsService: GoogleSheetsService) {
    super();
    this.loadPlayers();
    this.syncFromCloud(); // Pull latest from cloud on load
  }

  private loadPlayers(): void {
    const players = this.getItems<Player>(this.PLAYERS_KEY);
    this.playersSubject.next(players);
  }

  private syncFromCloud(): void {
    this.isLoadingSubject.next(true);
    this.googleSheetsService.fetchPlayersFromSheet().subscribe({
      next: (cloudPlayers) => {
        if (cloudPlayers && cloudPlayers.length > 0) {
          // Cập nhật Local Storage bằng dữ liệu Cloud mới nhất
          this.saveItems(this.PLAYERS_KEY, cloudPlayers);
          this.playersSubject.next(cloudPlayers);
        }
        setTimeout(() => this.isLoadingSubject.next(false), 800);
      },
      error: () => {
        setTimeout(() => this.isLoadingSubject.next(false), 800);
      }
    });
  }

  private syncToCloud(): void {
    const players = this.getPlayers();
    this.googleSheetsService.syncPlayersToSheet(players).subscribe(res => {
      console.log('Đã lưu dữ liệu lên Google Sheets', res);
    });
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
    this.syncToCloud();
  }

  updatePlayer(updatedPlayer: Player): void {
    const players = this.getPlayers().map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    this.saveItems(this.PLAYERS_KEY, players);
    this.playersSubject.next(players);
    this.syncToCloud();
  }

  deletePlayer(id: string): void {
    const players = this.getPlayers().filter(p => p.id !== id);
    this.saveItems(this.PLAYERS_KEY, players);
    this.playersSubject.next(players);
    this.syncToCloud();
  }
}
