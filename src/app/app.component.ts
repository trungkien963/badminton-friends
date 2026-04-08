import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { UiService } from './core/services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'badminton-friends';
  private uiService = inject(UiService);

  ngOnInit() {
    this.checkNetworkStatus(navigator.onLine);
  }

  @HostListener('window:offline')
  onOffline() {
    this.checkNetworkStatus(false);
  }

  @HostListener('window:online')
  onOnline() {
    this.checkNetworkStatus(true);
  }

  private checkNetworkStatus(isOnline: boolean) {
    if (!isOnline) {
      this.uiService.showOfflineModal();
    } else {
      this.uiService.closeModal();
    }
  }
}
