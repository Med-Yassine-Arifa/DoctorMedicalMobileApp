import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface Document {
  id?: number;
  appointmentId: string;
  doctorId: string;
  filename: string;
  fileData: string; // Base64 encoded
  mimeType: string;
  createdAt: string;
  status: 'pending' | 'viewed';
}

@Injectable({
  providedIn: 'root'
})
export class SqliteStorageService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private platform: Platform) {
    this.platform.ready().then(() => {
      this.initDatabase();
    });
  }

  private async initDatabase() {
    try {
      if (this.platform.is('hybrid') || this.platform.is('android') || this.platform.is('ios')) {
        this.db = await this.sqlite.createConnection(
          'healthcare',
          false,
          'no-encryption',
          1,
          false
        );
        await this.db.open();
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appointmentId TEXT,
            doctorId TEXT,
            filename TEXT,
            fileData TEXT,
            mimeType TEXT,
            createdAt TEXT,
            status TEXT DEFAULT 'pending'
          )
        `);
        this.dbReady.next(true);
      } else {
        console.warn('SQLite not supported on this platform');
        this.dbReady.next(false);
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      this.dbReady.next(false);
    }
  }

  isDbReady(): Observable<boolean> {
    return this.dbReady.asObservable();
  }

  saveDocument(doc: Document): Observable<Document> {
    return this.isDbReady().pipe(
      switchMap(ready => {
        if (!ready || !this.db) {
          throw new Error('Database not ready');
        }
        const query = `
          INSERT INTO documents (appointmentId, doctorId, filename, fileData, mimeType, createdAt, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          doc.appointmentId,
          doc.doctorId,
          doc.filename,
          doc.fileData,
          doc.mimeType,
          doc.createdAt,
          doc.status
        ];
        return from(this.db.run(query, values)).pipe(
          map(() => ({ ...doc, id: undefined })), // ID is auto-generated
          catchError(error => {
            console.error('Error saving document:', error);
            throw new Error('Failed to save document');
          })
        );
      })
    );
  }

  getDocumentsByAppointment(appointmentId: string): Observable<Document[]> {
    return this.isDbReady().pipe(
      switchMap(ready => {
        if (!ready || !this.db) {
          return of([]);
        }
        const query = `SELECT * FROM documents WHERE appointmentId = ?`;
        return from(this.db.query(query, [appointmentId])).pipe(
          map(result => {
            return result.values || [];
          }),
          catchError(error => {
            console.error('Error fetching documents:', error);
            return of([]);
          })
        );
      })
    );
  }
}
