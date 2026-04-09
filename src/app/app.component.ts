import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiService } from './core/services/ui.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'badminton-friends';
  private uiService = inject(UiService);
  public translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(['en', 'vn']);
    this.translate.setDefaultLang('en');
    
    // Default is 'en' unless previously saved
    const savedLang = localStorage.getItem('app_lang') || 'en';
    this.translate.use(savedLang).subscribe({
      next: (res) => console.log('Successfully loaded language:', savedLang, res),
      error: (err) => console.error('Failed to load language:', savedLang, err)
    });
  }

  toggleLanguage() {
    const currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';
    const newLang = currentLang === 'en' ? 'vn' : 'en';
    console.log('Language switched from', currentLang, 'to', newLang);
    this.translate.use(newLang).subscribe({
      next: (res) => console.log('Successfully loaded language:', newLang, res),
      error: (err) => console.error('Failed to load language:', newLang, err)
    });
    localStorage.setItem('app_lang', newLang);
  }

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
