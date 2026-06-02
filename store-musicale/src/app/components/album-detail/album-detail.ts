import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Data } from '../../services/data';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './album-detail.html',
  styleUrls: ['./album-detail.css']
})
export class AlbumDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(Data);
  private cdr = inject(ChangeDetectorRef);

  // Dettagli dell'album attivo
  album: any = null;
  errorMessage = '';

  ngOnInit(): void {
    // Intercettiamo l'id dai parametri di rotta dell'URL
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dataService.getAlbumDettaglio(id).subscribe({
        next: (dati) => {
          this.album = dati;
          // Forza sincronizzazione della UI standalone con i dati recuperati
          this.cdr.detectChanges();
        },
        error: (errore) => {
          this.errorMessage = 'Errore nel caricamento dei dettagli dell\'album.';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
