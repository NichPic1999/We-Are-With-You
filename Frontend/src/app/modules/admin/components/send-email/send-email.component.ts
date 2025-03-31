import { Component, EventEmitter, Output } from '@angular/core';
import { AdminService } from '../../service/admin.service';

@Component({
  selector: 'app-send-email',
  standalone: false,

  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.css',
})
export class SendEmailComponent {
  selectedFile: File | null = null; // Variabile per memorizzare il file selezionato

  constructor(private amdinService: AdminService) {}

  // Funzione per gestire la selezione del file
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (!file) {
      alert('No file selected');
      this.selectedFile = file;
      return;
    }

    // Controllo formato (MIME Type e/o estensione)
    const allowedTypes = ['application/json', 'text/csv'];
    const allowedExtensions = ['.json', '.csv'];
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Please select a JSON or CSV file');
      this.selectedFile = null;
      return;
    }

    // Controllo dimensione massima (es. 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('The file exceeds the permitted size (Max 2MB)');
      this.selectedFile = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;

      // if (file.type === 'application/json' || fileExtension === '.json') {
      //   try {
      //     const jsonData = JSON.parse(content);
      //     const errors = this.validateJSON(jsonData);

      //     if (errors.length > 0) {
      //       alert('Invalid JSON format:\n' + errors.join('\n'));
      //       this.selectedFile = null;
      //       return;
      //     }
      //   } catch (error) {
      //     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      //     alert('The JSON file is invalid: ' + errorMessage);
      //     this.selectedFile = null;
      //     return;
      //   }
      // } else if (file.type === 'text/csv' || fileExtension === '.csv') {
      //   try {
      //     const errors = this.validateCSV(content);

      //     if (errors.length > 0) {
      //       alert('Invalid CSV format:\n' + errors.join('\n'));
      //       this.selectedFile = null;
      //       return;
      //     }
      //   } catch (error) {
      //     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      //     alert('The CSV file is invalid: ' + errorMessage);
      //     this.selectedFile = null;
      //     return;
      //   }
      // }

      // // Se tutti i controlli passano, salva il file
      this.selectedFile = file;
      alert("The file is ready")
    };

    console.log("Reading the file in progress:", file);
    reader.readAsText(file);
  }


  validateJSON(data: any): string[] {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push("JSON must be an array of objects.");
      return errors;
    }

    data.forEach((item, index) => {
      if (typeof item.email !== 'string' || !this.validateEmail(item.email)) {
        errors.push(`Error in JSON entry #${index + 1}: Invalid email "${item.email}"`);
      }
      if (typeof item.publicKey !== 'string' || !this.validatePublicKey(item.publicKey)) {
        errors.push(`Error in JSON entry #${index + 1}: Invalid public key`);
      }
    });

    return errors;
  }

  // Modifica per restituire errori specifici per ogni riga
  validateCSV(content: string): string[] {
    const errors: string[] = [];

    const lines = content.split('\n').map(line => line.trim()).filter(line => line !== "");;

    if (lines.length < 2) {
      errors.push("CSV file is empty or missing data.");
      return errors;
    }

    const header = lines[0].split(',');

    if (!header.includes('email') || !header.includes('publicKey')) {
      errors.push("CSV must contain 'email' and 'publicKey' columns.");
      return errors;
    }

    lines.slice(1).forEach((line, index) => {
      const [email, publicKey] = line.split(',');

      if (!this.validateEmail(email)) {
        errors.push(`Error in CSV line ${index + 2}: Invalid email "${email}"`);
      }

      if (!this.validatePublicKey(publicKey)) {
        errors.push(`Error in CSV line ${index + 2}: Invalid public key`);
      }
    });

    return errors;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePublicKey(key: string): boolean {
    // Rimuove eventuali spazi bianchi ai bordi
    let cleanedKey = key.trim();

    // Sostituisce \\n con \n per ottenere un formato leggibile
    cleanedKey = cleanedKey.replace(/\\n/g, '\n');

    // Espressione regolare per chiave PGP valida
    const pgpRegex = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]+-----END PGP PUBLIC KEY BLOCK-----/;

    return pgpRegex.test(cleanedKey);
  }

  displayErrors(error:any) {
    let errorMessage = 'There were some errors:\n';

    // Controlla se gli errori sono un array
    if (Array.isArray(error)) {
      error.forEach((err: { index: number; errors: any[]; }) => {
        errorMessage += `Entry #${err.index + 1}: ${err.errors.join(', ')}\n`;
      });
    } else {
      errorMessage += error.message; // Mostra un messaggio di errore generico
    }

    // Usa alert per mostrare i messaggi di errore
    alert(errorMessage);
  }


  // Funzione per inviare il file al backend
  async onSubmit() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      await this.amdinService.sendFile(formData).subscribe({
        next: (response) => {
          if (response.success === true) {
          alert(response.message);
          this.selectedFile = null;
          }
        },
        error: (err) => {
          console.log(err.error.type)

          if(err.error.type === 'validation'){
            console.log(err.error.errors)
            this.displayErrors(err.error.errors)
          }else
            alert(err.error.message)
          this.selectedFile = null;
        },
      });
    } else {
      alert('Please select a file');
    }
  }


  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
