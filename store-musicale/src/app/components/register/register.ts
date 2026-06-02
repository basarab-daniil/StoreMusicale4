import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Data } from '../../services/data';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  // Iniezione delle dipendenze necessarie
  private dataService = inject(Data);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Modello per la registrazione
  username = '';
  email = '';
  password = '';

  // Stati per la gestione dei messaggi
  errorMessage = '';
  successMessage = '';

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'Compila tutti i campi richiesti.';
      this.cdr.detectChanges(); // Forza aggiornamento immediato della UI
      return;
    }

    // Chiamata HTTP elementare per la registrazione
    this.dataService.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.successMessage = 'Registrazione completata con successo! Verrai reindirizzato al login.';
        this.cdr.detectChanges(); // Notifica la UI del messaggio di successo

        // Timeout pulito per permettere la lettura del messaggio prima di reindirizzare al login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (errore) => {
        this.errorMessage = 'Errore durante la registrazione. Riprova con dati diversi.';
        // Aggiorna esplicitamente il template in caso di eccezione del server
        this.cdr.detectChanges();
      }
    });
  }
}
