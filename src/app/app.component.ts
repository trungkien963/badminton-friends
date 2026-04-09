import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiService } from './core/services/ui.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

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
  private swUpdate = inject(SwUpdate);

  constructor() {
    this.translate.addLangs(['en', 'vn']);
    this.translate.setDefaultLang('vn');
    
    // Default is 'vn' unless previously saved
    const savedLang = localStorage.getItem('app_lang') || 'vn';
    this.translate.use(savedLang).subscribe({
      next: (res) => console.log('Successfully loaded language:', savedLang, res),
      error: (err) => console.error('Failed to load language:', savedLang, err)
    });
  }

  toggleLanguage() {
    const currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'vn';
    const newLang = currentLang === 'vn' ? 'en' : 'vn';
    console.log('Language switched from', currentLang, 'to', newLang);
    this.translate.use(newLang).subscribe({
      next: (res) => console.log('Successfully loaded language:', newLang, res),
      error: (err) => console.error('Failed to load language:', newLang, err)
    });
    localStorage.setItem('app_lang', newLang);
  }

  ngOnInit() {
    this.checkNetworkStatus(navigator.onLine);

    // Kích hoạt kiểm tra phiên bản mới từ PWA
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          if (confirm('Có phiên bản cập nhật mới! Bạn có muốn làm mới ứng dụng ngay không?')) {
            window.location.reload();
          }
        });
    }
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
