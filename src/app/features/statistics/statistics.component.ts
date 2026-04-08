import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/models/player.model';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, AfterViewInit, OnDestroy {
  private playerService = inject(PlayerService);
  players: Player[] = [];

  @ViewChild('daysChart') daysChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('matchesChart') matchesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('winLossChart') winLossChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  selectedMonth: string = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  // Mock monthly data mapped by player ID mapping to { days, matches, wins, losses }
  monthlyData: { [playerId: string]: { days: number, matches: number, wins: number, losses: number } } = {};

  ngOnInit() {
    this.playerService.players$.subscribe(data => {
      this.players = data.filter(p => p.isActive);
      this.generateMonthlyDataFromHistory();
      if (this.charts.length > 0) {
        this.updateCharts();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  generateMonthlyDataFromHistory() {
    this.monthlyData = {};
    const selectedYrMo = this.selectedMonth; // format 'YYYY-MM'

    this.players.forEach(p => {
       // Default state for the player
       this.monthlyData[p.id] = { days: 0, matches: 0, wins: 0, losses: 0 };

       if (p.playHistory) {
           try {
               const history: { date: string, matches: number, wins: number, losses: number }[] = JSON.parse(p.playHistory);
               
               let totalDays = 0;
               let totalMatches = 0;
               let totalWins = 0;
               let totalLosses = 0;

               history.forEach(record => {
                   if (record.date && record.date.startsWith(selectedYrMo)) {
                       totalDays += 1;
                       totalMatches += (record.matches || 0);
                       totalWins += (record.wins || 0);
                       totalLosses += (record.losses || 0);
                   }
               });

               this.monthlyData[p.id] = {
                   days: totalDays,
                   matches: totalMatches,
                   wins: totalWins,
                   losses: totalLosses
               };
           } catch(e) {
               console.error('Error parsing playHistory for player', p.name, e);
           }
       }
    });
  }

  onMonthChange(event: any) {
    this.selectedMonth = event.target.value;
    this.generateMonthlyDataFromHistory();
    this.updateCharts();
  }

  destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  initCharts() {
    this.destroyCharts();
    
    if (!this.daysChartRef || !this.matchesChartRef || !this.winLossChartRef) return;

    // Apply dark aesthetic to ChartJS defaults
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

    const labels = this.players.map(p => {
      // Just try to grab first name / nickname for cleaner labels
      const names = p.name.split(' ');
      return names[names.length - 1]; 
    });

    // Chart 1: Days Played
    const daysData = this.players.map(p => this.monthlyData[p.id].days);
    this.charts.push(new Chart(this.daysChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Số ngày chơi',
          data: daysData,
          backgroundColor: 'rgba(178, 216, 81, 0.8)',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    }));

    // Chart 2: Matches
    const matchesData = this.players.map(p => this.monthlyData[p.id].matches);
    this.charts.push(new Chart(this.matchesChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Số trận tham gia',
          data: matchesData,
          backgroundColor: 'rgba(74, 158, 255, 0.8)',
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    }));

    // Chart 3: Win / Loss
    const winData = this.players.map(p => this.monthlyData[p.id].wins);
    const lossData = this.players.map(p => this.monthlyData[p.id].losses);
    this.charts.push(new Chart(this.winLossChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Thắng', data: winData, backgroundColor: 'rgba(76, 175, 80, 0.8)' },
          { label: 'Thua', data: lossData, backgroundColor: 'rgba(244, 67, 54, 0.8)' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true }
        }
      }
    }));
  }

  updateCharts() {
    if(this.charts.length !== 3) {
      this.initCharts();
      return;
    }
    
    const labels = this.players.map(p => {
      const names = p.name.split(' ');
      return names[names.length - 1]; 
    });

    this.charts[0].data.labels = labels;
    this.charts[0].data.datasets[0].data = this.players.map(p => this.monthlyData[p.id].days);
    this.charts[0].update();

    this.charts[1].data.labels = labels;
    this.charts[1].data.datasets[0].data = this.players.map(p => this.monthlyData[p.id].matches);
    this.charts[1].update();

    this.charts[2].data.labels = labels;
    this.charts[2].data.datasets[0].data = this.players.map(p => this.monthlyData[p.id].wins);
    this.charts[2].data.datasets[1].data = this.players.map(p => this.monthlyData[p.id].losses);
    this.charts[2].update();
  }
}
