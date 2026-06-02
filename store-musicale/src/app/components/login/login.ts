import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Data } from '../../services/data';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  // Iniezione delle dipendenze necessarie
  private dataService = inject(Data);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Modello per il form di login
  email = '';
  password = '';
  
  // Gestione degli stati della UI
  errorMessage = '';

  onSubmit(): void {
    // Reset del messaggio prima del tentativo
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Inserisci tutti i campi richiesti.';
      this.cdr.detectChanges(); // Forziamo l'aggiornamento immediato del template
      return;
    }

    // Chiamata HTTP elementare al servizio dati
    this.dataService.login(this.email, this.password).subscribe({
      next: (risposta: any) => {
        // Salviamo l'utente nello stato globale (mock ID e username dalla risposta)
        const utenteId = risposta.id || 'usr_mock_123';
        const username = risposta.username || 'Utente';
        this.dataService.salvaUtenteLoggato(utenteId, username);

        // Forza il rilevamento prima del cambio rotta per sicurezza dello stato
        this.cdr.detectChanges();

        // Reindirizzamento alla schermata home
        this.router.navigate(['/home']);
      },
      error: (errore) => {
        // Gestione dell'errore di autenticazione
        this.errorMessage = 'Email o password errati. Riprova.';
        // Richiamiamo esplicitamente detectChanges per aggiornare la UI in modalità standalone reattiva
        this.cdr.detectChanges();
      }
    });
  }
}
