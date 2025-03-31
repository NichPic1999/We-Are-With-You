import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LoginData } from '../interfaces/shared';
import sodium from 'libsodium-wrappers-sumo';
import Swal from 'sweetalert2';
import { AuthService } from '../../shared/services/authentication/auth.service';
import { CryptoService } from '../services/cryptography-service/crypto.service';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class LoginComponent {

  selectedRole: string  = '';
  toggleState: boolean = false;
  private encoder = new TextEncoder();

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    operator: new FormControl(false),
  });

  constructor(
    private authService: AuthService,
    private cryptoService: CryptoService,
    private router: Router
  ) {}

  selectRole(role: string) {

    this.selectedRole = role; // Salva il ruolo selezionato

    if (role === 'client') {
      this.toggleState = false;
    }
  }

  //metodo che esegue le seguenti operazioni:
  // - effettua lo stretch della password usando una funzione di derivazione delle chiavi
  // - cifra password e il ruolo con la chiave pubblica del server per inviare i dati cifrati
  cryptoForm(): LoginData | false {
    //verfico se la figura operativa è l'avvocato o l'admin
    if(this.selectedRole ==='operator' && !this.loginForm.value.operator)
      this.selectedRole = 'admin'
    else if(this.selectedRole ==='operator' && this.loginForm.value.operator)
      this.selectedRole = 'lawyer'

    const formValues = { ...this.loginForm.value,role: this.selectedRole};
    let postData: LoginData;

    // Se la password e l'email sono presenti nel form, eseguo lo stretch della password
    if (this.loginForm.value.password && this.loginForm.value.email) {
        const stretchPassword = this.cryptoService.resKeyToSave(
        this.loginForm.value.password,
        this.loginForm.value.email
        );

     //cifro successivamente la chiave stretchata con la chiave pubblica del server
      if (stretchPassword) {

        const encPassword = this.cryptoService.encryptData(
          sodium.to_hex(stretchPassword)
        );

        if (encPassword) {
          formValues.password = sodium.to_hex(encPassword);
        } else {
          Swal.fire({
            title: 'Error',
            text: 'Something went wrong with password encryption',
            icon: 'error',
          });
          return false;
        }
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong when creating the password ',
          icon: 'error',
        });
        return false;
      }
    }
    //cifro anche la stringa del ruolo
    const roleInByte = this.encoder.encode(this.selectedRole);
    const encRole = this.cryptoService.encryptData(
      sodium.to_hex(roleInByte),
    );

    if (encRole) {
      formValues.role = sodium.to_hex(encRole);
    }
    return (postData = { ...formValues } as LoginData);
  }


  //effettuo la chiamata al service per eseguire il login
  async onLogin() {
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

    const postData = this.cryptoForm();
    if (postData) {
      await this.authService.login(postData as LoginData).subscribe({
        next: (response) => {
          if(response.status === 200){
            Toast.fire({
              icon: 'success',
              title: response.message,
            });

          if(this.loginForm.value.email){
              //cifra la mail e il ruolo inseriti con la chiave pubblica del server e solo lui può risalire alla mail
              const encEmail = this.encoder.encode(this.loginForm.value.email)
              const encRole = this.encoder.encode(response.role)

              const emailCiphered = this.cryptoService.encryptData(sodium.to_hex(encEmail))
              const RoleCiphered = this.cryptoService.encryptData(sodium.to_hex(encRole))

              this.authService.setEmailsAndRoleForMFA(response.email,sodium.to_hex(emailCiphered),sodium.to_hex(RoleCiphered));
          }
          this.router.navigate(['/auth']);
        }
      },
        error: (err) => {
          if (err.status === 401) {
              Toast.fire({
                icon: 'error',
                title: err.error.error,
              });
          }
        },
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Missing login data',
        icon: 'error',
      });
    }
  }

  get email() {
    return this.loginForm.controls['email'];
  }

  get password() {
    return this.loginForm.controls['password'];
  }
}
