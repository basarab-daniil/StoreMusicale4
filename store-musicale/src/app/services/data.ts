import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.esempio-musica.com'; // Endpoint fittizio

  // Gestione dello stato dell'utente corrente con i Signals
  currentUser = signal<any>(null);

  constructor() {}

  getAlbumDetails(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/albums/${id}`);
  }

  getArtistaDetails(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/artisti/${id}`);
  }

  setUtente(user: any): void {
    this.currentUser.set(user);
  }

  logout(): void {
    this.currentUser.set(null);
  }
}
