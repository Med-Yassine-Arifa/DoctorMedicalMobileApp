import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageUtil {

  // Async methods for most use cases
  async set(key: string, value: any): Promise<void> {
    await Preferences.set({
      key,
      value: JSON.stringify(value)
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) as T : null;
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  // Synchronous method for interceptors
  getSync<T>(key: string): T | null {
    // For interceptors, we need a synchronous method
    // This is a fallback that works for web but may not work in all contexts
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  }
}
