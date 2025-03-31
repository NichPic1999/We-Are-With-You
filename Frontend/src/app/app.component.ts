import { Component } from '@angular/core';
import { AuthService } from './modules/shared/services/authentication/auth.service';
import { CryptoService } from './modules/shared/services/cryptography-service/crypto.service';
import { LawyerService } from './modules/lawyer/service/lawyer.service';
import { Router } from '@angular/router';
CryptoService

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'cryptography-project';


  public publicKey: string | undefined;

  constructor(private authService: AuthService,
    private cryptoService: CryptoService,
    private router:Router ) { }

  ngOnInit() {

    //recupera la chiave pubblica del server, serve a cifrare esclusivamente i dati del login
    this.authService.getPublicKey().subscribe({
      next: (response) => {
        this.cryptoService.setPublicKeyServer(response.pub_key)
        console.log(response.pub_key)
        console.log("Server key successfully recovered")
      },
      error: (err) => {
        console.error('Error while retrieving server public key', err);
        this.router.navigate(['/error']);
      },
    });
  }

}
