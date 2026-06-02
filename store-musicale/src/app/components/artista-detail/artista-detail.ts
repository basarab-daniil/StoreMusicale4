import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Data } from '../../services/data';

@Component({
  selector: 'app-artista-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './artista-detail.html',
  styleUrls: ['./artista-detail.css']
})
export class ArtistaDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(Data);
  private cdr = inject(ChangeDetectorRef);

  // Informazioni dell'artista da visualizzare
  artista: any = null;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dataService.getArtistaDettaglio(id).subscribe({
        next: (dati) => {
          this.artista = dati;
          // Aggiornamento dello scope interno del componente standalone
          this.cdr.detectChanges();
        },
        error: (errore) => {
          this.errorMessage = 'Errore durante il recupero del profilo artista.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
