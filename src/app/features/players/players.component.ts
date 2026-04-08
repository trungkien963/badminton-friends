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
  styleUrls: ['./players.component.scss'] // Using global styles mostly
})
export class PlayersComponent implements OnInit {
  private playerService = inject(PlayerService);
  
  players: Player[] = [];
  
  newPlayerName: string = '';
  newPlayerLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Intermediate';
  levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  ngOnInit(): void {
    this.playerService.players$.subscribe(data => {
      this.players = data;
    });
  }

  addPlayer() {
    if (!this.newPlayerName.trim()) return;
    
    this.playerService.addPlayer({
      name: this.newPlayerName,
      level: this.newPlayerLevel as any
    });
    
    this.newPlayerName = '';
  }

  deletePlayer(id: string) {
    if(confirm('Bạn có chắc muốn xoá người này?')) {
      this.playerService.deletePlayer(id);
    }
  }

  manualSync() {
    const players = this.playerService.getPlayers();
    
    // Đọc URL từ service (qua 1 trick nhỏ) hoặc gọi báo lưu thủ công
    // Cách an toàn hơn: dùng chính API gốc đã được fix
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
        alert('Đã lưu dữ liệu người chơi thành công lên Google Sheets!');
    })
    .catch(err => {
        alert('Có lỗi khi lưu lên Cloud: ' + err.message);
    });
  }
}

