import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Data } from '../../services/data';

@Component({
  selector: 'app-playlist',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './playlist.html',
  styleUrls: ['./playlist.css']
})
export class Playlist implements OnInit {
  private dataService = inject(Data);
  private cdr = inject(ChangeDetectorRef);

  // Dati utente corrente e stati del database
  utenteId: string | null = null;
  username: string = '';
  
  listaPlaylist: any[] = [];
  tutteLeCanzoni: any[] = [];
  playlistSelezionata: any = null;

  // Stati per la gestione della UI
  mostraFormCreazione = false;
  nuovoNomePlaylist = '';
  errorMessage = '';

  ngOnInit(): void {
    // 1. Iscrizione allo stato dell'utente loggato
    this.dataService.utenteCorrente$.subscribe({
      next: (utente) => {
        if (utente) {
          this.utenteId = utente.id;
          this.username = utente.username;
          this.caricaPlaylistUtente();
          this.caricaTutteLeCanzoni();
        } else {
          this.utenteId = null;
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Recupera le playlist dell'utente connesso
  caricaPlaylistUtente(): void {
    if (!this.utenteId) return;
    this.dataService.getPlaylistUtente(this.utenteId).subscribe({
      next: (playlists) => {
        this.listaPlaylist = playlists || [];
        
        // Se c'è una playlist attiva selezionata, ne aggiorna i dati in tempo reale
        if (this.playlistSelezionata) {
          this.playlistSelezionata = this.listaPlaylist.find(p => p.id === this.playlistSelezionata.id) || null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Impossibile caricare le tue playlist.';
        this.cdr.detectChanges();
      }
    });
  }

  // Carica l'elenco globale delle canzoni del database
  caricaTutteLeCanzoni(): void {
    this.dataService.getTutteCanzoni().subscribe({
      next: (canzoni) => {
        this.tutteLeCanzoni = canzoni || [];
        this.cdr.detectChanges();
      }
    });
  }

  // Seleziona una playlist per vederne i dettagli e modificarla
  selezionaPlaylist(playlist: any): void {
    this.playlistSelezionata = playlist;
    this.cdr.detectChanges();
  }

  // Crea una nuova playlist sul database
  handleCreaPlaylist(): void {
    if (!this.nuovoNomePlaylist.trim() || !this.utenteId) return;

    this.dataService.creaPlaylist(this.nuovoNomePlaylist, this.utenteId).subscribe({
      next: () => {
        this.nuovoNomePlaylist = '';
        this.mostraFormCreazione = false;
        this.caricaPlaylistUtente(); // Ricarica e notifica la UI
      },
      error: () => {
        this.errorMessage = 'Errore durante la creazione della playlist.';
        this.cdr.detectChanges();
      }
    });
  }

  // Rimuove una playlist intera dal database
  handleEliminaPlaylist(event: Event, playlistId: string): void {
    event.stopPropagation(); // Evita che il click selezioni la playlist prima di cancellarla
    
    this.dataService.eliminaPlaylist(playlistId).subscribe({
      next: () => {
        if (this.playlistSelezionata?.id === playlistId) {
          this.playlistSelezionata = null;
        }
        this.caricaPlaylistUtente();
      }
    });
  }

  // Aggiunge una traccia alla playlist attiva
  handleAggiungiCanzone(canzoneId: string): void {
    if (!this.playlistSelezionata) return;

    this.dataService.aggiungiCanzonePlaylist(this.playlistSelezionata.id, canzoneId).subscribe({
      next: () => {
        this.caricaPlaylistUtente(); // Aggiorna i dati includendo la traccia
      }
    });
  }

  // Rimuove una traccia dalla playlist attiva
  handleRimuoviCanzone(canzoneId: string): void {
    if (!this.playlistSelezionata) return;

    this.dataService.rimuoviCanzonePlaylist(this.playlistSelezionata.id, canzoneId).subscribe({
      next: () => {
        this.caricaPlaylistUtente(); // Sincronizza lo stato dopo l'eliminazione
      }
    });
  }
}
