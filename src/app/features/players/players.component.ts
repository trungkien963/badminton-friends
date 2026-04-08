import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/models/player.model';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './players.component.html',
  styleUrls: ['./players.component.scss']
})
export class PlayersComponent implements OnInit {
  private playerService = inject(PlayerService);
  
  players: Player[] = [];
  
  // Form State
  newPlayerName: string = '';
  newPlayerLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Intermediate';
  newPlayerActive: boolean = true;
  levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  
  // Edit State
  isEditing: boolean = false;
  editingPlayerId: string | null = null;

  ngOnInit(): void {
    this.playerService.players$.subscribe(data => {
      this.players = data.sort((a,b) => b.rankingScore - a.rankingScore); 
    });
  }

  submitPlayer() {
    if (!this.newPlayerName.trim()) return;
    
    if (this.isEditing && this.editingPlayerId) {
      // Logic update
      const existingPlayer = this.players.find(p => p.id === this.editingPlayerId);
      if (existingPlayer) {
        this.playerService.updatePlayer({
          ...existingPlayer,
          name: this.newPlayerName,
          level: this.newPlayerLevel as any,
          isActive: this.newPlayerActive
        });
      }
      this.cancelEdit();
    } else {
      // Logic add
      this.playerService.addPlayer({
        name: this.newPlayerName,
        level: this.newPlayerLevel as any
      });
      // Optionally sync here or let user manually sync
      this.newPlayerName = '';
      this.newPlayerLevel = 'Intermediate';
      this.newPlayerActive = true;
    }
  }

  editPlayer(p: Player) {
    this.isEditing = true;
    this.editingPlayerId = p.id;
    this.newPlayerName = p.name;
    this.newPlayerLevel = p.level;
    this.newPlayerActive = p.isActive;
    
    // Scroll mobile view to top so they see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingPlayerId = null;
    this.newPlayerName = '';
    this.newPlayerLevel = 'Intermediate';
    this.newPlayerActive = true;
  }

  deletePlayer(id: string) {
    if(confirm('Cảnh báo: Hành động này sẽ xoá hoàn toàn tuyển thủ. Nếu người này đã từng chơi, dữ liệu trận đấu có thể bị mất. Bạn nên "Vô hiệu hóa" (Trạng thái Nghỉ) thay vì xóa. Bạn vẫn muốn xóa?')) {
      this.playerService.deletePlayer(id);
    }
  }

  manualSync() {
    const players = this.playerService.getPlayers();
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJxRtuHV-JXAkDBFXjJOvpr7w3eoBdU694OPlq-8fKhpHMtoGOu3_-mecvWjNMlB9mUQ/exec';
    const body = new URLSearchParams();
    body.set('payload', JSON.stringify({ action: 'SYNC_PLAYERS', players: players }));
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
    })
    .then(res => res.text())
    .then(() => {
        alert('Đã lưu dữ liệu người chơi thành công lên Mây!');
    })
    .catch(err => {
        alert('Có lỗi khi lưu lên Cloud: ' + err.message);
    });
  }
}
