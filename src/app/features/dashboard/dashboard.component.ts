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
  totalMembers: number = 0;
  topPlayers: Player[] = [];
  isLoading: boolean = true;
  skeletonArray = [1, 2, 3, 4];

  ngOnInit() {
    this.playerService.players$.subscribe(data => {
      // Sort players by ranking score descending
      const sorted = [...data].sort((a, b) => b.rankingScore - a.rankingScore);
      this.totalMembers = sorted.length;
      // Get only top 5 for the dashboard to keep it concise
      this.topPlayers = sorted.slice(0, 5);
    });

    this.playerService.isLoading$.subscribe(loading => {
      this.isLoading = loading;
    });
  }
}
