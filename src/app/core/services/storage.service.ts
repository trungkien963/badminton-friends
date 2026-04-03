import { Injectable } from '@angular/core';

/**
 * StorageService abstracting the storage mechanism.
 * Currently uses LocalStorage but designed so it can be easily replaced by Google Sheets API in the future.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor() {}

  // ==================
  // Generic CRUD
  // ==================
  
  protected getItems<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  protected saveItems<T>(key: string, items: T[]): void {
    localStorage.setItem(key, JSON.stringify(items));
  }
}
