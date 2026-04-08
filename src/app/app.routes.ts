import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { PlayersComponent } from './features/players/players.component';
import { MatchComponent } from './features/match/match.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'match', component: MatchComponent },
  { path: 'statistics', loadComponent: () => import('./features/statistics/statistics.component').then(m => m.StatisticsComponent) }
];
