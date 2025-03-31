import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/authentication/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-mfauthentication',
  standalone: false,

  templateUrl: './mfauthentication.component.html',
  styleUrl: './mfauthentication.component.css'
})
export class MFauthenticationComponent {

  emailAuthenticated:boolean = false;
  tokenVerified: boolean = false;


  verificationCodeform= new FormGroup(
    {
      verificationCode: new FormControl('',[Validators.required, Validators.minLength(6), Validators.maxLength(6)])
    }
  )

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
    var token = params.get('token');
      if (token && !this.tokenVerified) {
        // Se il token è presente e non è stato già verificato (non JWT, ma token per il controllo dell'autenticazione)
        console.log("il token è",token);
        this.verifyMagicLink(token)
       // token = ''
      }else
        this.sendMagicLink();
    });
  }

    //invia la richiesta di email se il token non è nell'URL
    async sendMagicLink(){

      if(!this.emailAuthenticated){
        await this.authService.sendMagicLink().subscribe({
          next: (response) => {
            console.log("Risposta ricevuta:", response);
          },
          error: (err) => {
            console.error("Errore nella chiamata HTTP:", err);
          }
        });

      }
    }

    verifyMagicLink(token: string) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });

      this.authService.verifyMagicLinkToken(token).subscribe({
        next: (response) => {
          this.emailAuthenticated = true;
          Toast.fire({
            icon: 'success',
            title: response.message,
          });
        },
        error: (err) => {

          Toast.fire({
            icon: 'error',
            title: err.error.error,
          });
        }
      });
    }

    resendMagicLink(event: MouseEvent) {
      event.preventDefault();

      this.sendMagicLink();
    }



}






