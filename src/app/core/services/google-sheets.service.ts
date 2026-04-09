import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, map } from 'rxjs';
import { Player } from '../models/player.model';

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  // Thay thế bằng Google Apps Script Web App URL của bạn ở đây:
  private readonly SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJxRtuHV-JXAkDBFXjJOvpr7w3eoBdU694OPlq-8fKhpHMtoGOu3_-mecvWjNMlB9mUQ/exec'; // Example URL, user to replace
  
  constructor(private http: HttpClient) {}

  /**
   * Đồng bộ toàn bộ dữ liệu người chơi lên Google Sheet
   */
  syncPlayersToSheet(players: Player[]): Observable<any> {
    if (!this.SCRIPT_URL || this.SCRIPT_URL.includes('YOUR_WEB_APP_URL_HERE')) {
      return of({ success: false, message: 'Chưa cấu hình Google Script URL' });
    }

    const payload = {
      action: 'SYNC_PLAYERS',
      players: players
    };

    const body = new URLSearchParams();
    body.set('payload', JSON.stringify(payload));

    const timestamp = new Date().getTime();
    return this.http.post(`${this.SCRIPT_URL}?t=${timestamp}`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'text'
    }).pipe(
      catchError(err => {
        console.error('Google Sheets Sync Error:', err);
        return of({ success: false, error: err });
      })
    );
  }

  /**
   * Tải toàn bộ dữ liệu từ Google Sheet xuống
   */
  fetchPlayersFromSheet(): Observable<Player[]> {
    if (!this.SCRIPT_URL || this.SCRIPT_URL.includes('YOUR_WEB_APP_URL_HERE')) {
      return of([]);
    }

    // Thêm timestamp để huỷ cache của trình duyệt (browser/mobile cache)
    const timestamp = new Date().getTime();
    return this.http.get<any[]>(`${this.SCRIPT_URL}?action=GET_PLAYERS&t=${timestamp}`).pipe(
      map(rows => {
        if (!rows || !Array.isArray(rows)) return [];
        // Chuyển rỗng hoặc chuỗi thành kiểu boolean/number tuỳ ý nếu cần,
        // Nhưng Google Apps script map object sẽ nhận string/number mặc định.
        return rows.map(r => ({
          ...r,
          winRate: Number(r.winRate) || 0,
          totalWins: Number(r.totalWins) || 0,
          totalLosses: Number(r.totalLosses) || 0,
          matchesPlayed: Number(r.matchesPlayed) || 0,
          rankingScore: Number(r.rankingScore) || 0,
          isActive: r.isActive === true || r.isActive === 'true' || r.isActive === 'TRUE'
        })) as Player[];
      }),
      catchError(err => {
        console.error('Google Sheets Fetch Error:', err);
        return of([]);
      })
    );
  }
  /**
   * Đồng bộ toàn bộ dữ liệu Tài Chính lên Google Sheet
   */
  syncFinanceToSheet(expenses: any[], feeStatus: any[]): Observable<any> {
    if (!this.SCRIPT_URL || this.SCRIPT_URL.includes('YOUR_WEB_APP_URL_HERE')) {
      return of({ success: false, message: 'Chưa cấu hình Google Script URL' });
    }

    const payload = {
      action: 'SYNC_FINANCE',
      expenses: expenses,
      feeStatus: feeStatus
    };

    const body = new URLSearchParams();
    body.set('payload', JSON.stringify(payload));

    const timestamp = new Date().getTime();
    return this.http.post(`${this.SCRIPT_URL}?t=${timestamp}`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      responseType: 'text'
    }).pipe(
      catchError(err => {
        console.error('Google Sheets Finance Sync Error:', err);
        return of({ success: false, error: err });
      })
    );
  }

  /**
   * Tải toàn bộ dữ liệu Tài Chính từ Google Sheet xuống
   */
  fetchFinanceFromSheet(): Observable<{ expenses: any[], feeStatus: any[] }> {
    if (!this.SCRIPT_URL || this.SCRIPT_URL.includes('YOUR_WEB_APP_URL_HERE')) {
      return of({ expenses: [], feeStatus: [] });
    }

    // Thêm timestamp để huỷ cache của trình duyệt (browser/mobile cache)
    const timestamp = new Date().getTime();
    return this.http.get<any>(`${this.SCRIPT_URL}?action=GET_FINANCE&t=${timestamp}`).pipe(
      map(res => {
        if (!res) return { expenses: [], feeStatus: [] };
        return {
          expenses: Array.isArray(res.expenses) ? res.expenses : [],
          feeStatus: Array.isArray(res.feeStatus) ? res.feeStatus : []
        };
      }),
      catchError(err => {
        console.error('Google Sheets Finance Fetch Error:', err);
        return of({ expenses: [], feeStatus: [] });
      })
    );
  }
}
