import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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
  private router = inject(Router);

  utenteId: string | null = null;
  username: string = '';
  
  listaPlaylist: any[] = [];
  tutteLeCanzoni: any[] = [];
  playlistSelezionata: any = null;
  mostraFormCreazione = false;
  nuovoNomePlaylist = '';

  ngOnInit(): void {
    // Ci iscriviamo allo stato dell'utente corrente
    this.dataService.utenteCorrente$.subscribe(utente => {
      if (utente) {
        this.utenteId = utente.id;
        this.username = utente.username;
        this.caricaPlaylistUtente();
        this.caricaTutteLeCanzoni();
      } else {
        // Se l'utente non è in memoria (es. refresh), vai direttamente al login
        this.router.navigate(['/login']);
      }
    });
  }

  caricaPlaylistUtente(): void {
    if (!this.utenteId) return;
    this.dataService.getPlaylistUtente(this.utenteId).subscribe(playlists => {
      this.listaPlaylist = playlists || [];
      if (this.playlistSelezionata) {
        this.playlistSelezionata = this.listaPlaylist.find(p => p.id === this.playlistSelezionata.id) || null;
      }
      this.cdr.detectChanges();
    });
  }

  caricaTutteLeCanzoni(): void {
    this.dataService.getTutteCanzoni().subscribe(canzoni => {
      this.tutteLeCanzoni = canzoni || [];
      this.cdr.detectChanges();
    });
  }

  selezionaPlaylist(playlist: any): void {
    this.playlistSelezionata = playlist;
    this.cdr.detectChanges();
  }

  handleCreaPlaylist(): void {
    if (!this.nuovoNomePlaylist.trim() || !this.utenteId) return;
    this.dataService.creaPlaylist(this.nuovoNomePlaylist, this.utenteId).subscribe(() => {
      this.nuovoNomePlaylist = '';
      this.mostraFormCreazione = false;
      this.caricaPlaylistUtente();
    });
  }

  handleEliminaPlaylist(event: Event, playlistId: string): void {
    event.stopPropagation();
    this.dataService.eliminaPlaylist(playlistId).subscribe(() => {
      if (this.playlistSelezionata?.id === playlistId) this.playlistSelezionata = null;
      this.caricaPlaylistUtente();
    });
  }

  handleAggiungiCanzone(canzoneId: string): void {
    if (!this.playlistSelezionata) return;
    this.dataService.aggiungiCanzonePlaylist(this.playlistSelezionata.id, canzoneId).subscribe(() => this.caricaPlaylistUtente());
  }

  handleRimuoviCanzone(canzoneId: string): void {
    if (!this.playlistSelezionata) return;
    this.dataService.rimuoviCanzonePlaylist(this.playlistSelezionata.id, canzoneId).subscribe(() => this.caricaPlaylistUtente());
  }
}
