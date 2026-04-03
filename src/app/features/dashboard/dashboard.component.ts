import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/models/player.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private playerService = inject(PlayerService);
  playersList: Player[] = [];

  ngOnInit() {
    this.playerService.players$.subscribe(data => {
      // Sort players by ranking score descending
      this.playersList = [...data].sort((a, b) => b.rankingScore - a.rankingScore);
    });
  }
}
