import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

// Interfaccia per rappresentare l'utente nello stato globale
interface UtenteLoggato {
  id: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class Data {
  // Iniezione del client HTTP nativo
  private http = inject(HttpClient);

  // URL di base per le chiamate API verso il server locale
  private apiUrl = '/api';

  // Stato globale dell'utente tramite BehaviorSubject
  private utenteSubject = new BehaviorSubject<UtenteLoggato | null>(null);
  
  // Esponiamo lo stato come Observable per i vari componenti
  utenteCorrente$ = this.utenteSubject.asObservable();

  constructor() {}

  /**
   * Autenticazione utente (Login)
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  /**
   * Registrazione nuovo utente
   */
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  /**
   * Salva l'utente loggato all'interno dello stato globale
   */
  salvaUtenteLoggato(id: string, username: string): void {
    this.utenteSubject.next({ id, username });
  }

  /**
   * Effettua il logout e svuota lo stato dell'utente
   */
  logout(): void {
    this.utenteSubject.next(null);
  }

  /**
   * Recupera tutti gli album
   */
  getAlbums(): Observable<any> {
    return this.http.get(`${this.apiUrl}/albums`);
  }

  /**
   * Recupera i dettagli di un singolo album tramite ID
   */
  getAlbumDettaglio(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/albums/${id}`);
  }

  /**
   * Recupera i dettagli di un artista tramite ID
   */
  getArtistaDettaglio(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/artisti/${id}`);
  }

  /**
   * Recupera le playlist associate all'utente corrente
   */
  getPlaylistUtente(utenteId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/playlists?utenteId=${utenteId}`);
  }

  /**
   * Crea una nuova playlist vuota
   */
  creaPlaylist(nome: string, utenteId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/playlists`, { nome, utenteId });
  }

  /**
   * Elimina una playlist tramite ID
   */
  eliminaPlaylist(playlistId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/playlists/${playlistId}`);
  }

  /**
   * Aggiunge una canzone a una playlist
   */
  aggiungiCanzonePlaylist(playlistId: string, canzoneId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/playlists/${playlistId}/canzoni`, { canzoneId });
  }

  /**
   * Rimuove una canzone da una playlist
   */
  rimuoviCanzonePlaylist(playlistId: string, canzoneId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/playlists/${playlistId}/canzoni/${canzoneId}`);
  }

  /**
   * Recupera l'elenco completo di tutte le canzoni
   */
  getTutteCanzoni(): Observable<any> {
    return this.http.get(`${this.apiUrl}/canzoni`);
  }
}
