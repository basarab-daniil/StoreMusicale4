import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Data } from '../../services/data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  private dataService = inject(Data);
  private cdr = inject(ChangeDetectorRef);

  // Array contenente la lista degli album caricati dal server
  listaAlbums: any[] = [];
  errorMessage = '';

  ngOnInit(): void {
    // Caricamento asincrono iniziale degli album disponibili
    this.dataService.getAlbums().subscribe({
      next: (dati) => {
        this.listaAlbums = dati || [];
        // Forza l'aggiornamento del template standalone dopo l'arrivo dei dati asincroni
        this.cdr.detectChanges();
      },
      error: (errore) => {
        this.errorMessage = 'Impossibile caricare gli album al momento.';
        this.cdr.detectChanges();
      }
    });
  }
}
