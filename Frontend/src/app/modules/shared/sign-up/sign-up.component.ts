import { SignUpData } from './../interfaces/shared';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import sodium from 'libsodium-wrappers-sumo';
import { AuthService } from '../services/authentication/auth.service';
import { CryptoService } from '../services/cryptography-service/crypto.service';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: false,

  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css',
})
export class SignUpComponent {
  private hashEmail: string = '';
  private token: string | null = null;
  isTokenValid: boolean = false;
  isLoading: boolean = true; // Indica se il token è in fase di verifica
  errorMessage: string | null = null;
  private passPhrase: string = '';

  signUpForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.pattern(/[a-z0-9\._%\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,}$/),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8), // Lunghezza minima 8 caratteri
      this.specialCharacterValidator,
      this.uppercaseValidator,
      this.numberValidator,
    ]), //ricorda sempre altre accortezze sulla password
    telephoneNumber: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{6,15}$/),
    ]),
  });

  constructor(
    private authService: AuthService,
    private cryptoService: CryptoService,
    private router: Router,
    private Acroute: ActivatedRoute
  ) {}

  specialCharacterValidator(control: AbstractControl): ValidationErrors | null {
    const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/; // Caratteri speciali
    if (control.value && !specialCharacterPattern.test(control.value)) {
      return {
        specialCharacter:
          'Password must contain at least one special character.',
      };
    }
    return null;
  }

  uppercaseValidator(control: AbstractControl): ValidationErrors | null {
    const uppercasePattern = /[A-Z]/; // Lettere maiuscole
    if (control.value && !uppercasePattern.test(control.value)) {
      return {
        uppercase: 'Password must contain at least one uppercase letter.',
      };
    }
    return null;
  }

  numberValidator(control: AbstractControl): ValidationErrors | null {
    const numberPattern = /[0-9]/; // Numeri
    if (control.value && !numberPattern.test(control.value)) {
      return { number: 'Password must contain at least one number.' };
    }
    return null;
  }

  ngOnInit(): void {
    this.Acroute.queryParams.subscribe(params => {
      this.token = params['token'];  // Salva il token dalla query string
      console.log("Received token:", this.token);

      if (this.token) {
        this.isLoading = true;  // Avvia il caricamento

        this.authService.verifyTokenSignUp(this.token).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              console.log("Token is valid");
              this.isTokenValid = true;
              // Rimuovi il token dall'URL
              window.history.replaceState({}, '', window.location.pathname);
            } else {
              console.log("Invalid token:", response.message);
              this.errorMessage = response.message;
              this.isTokenValid = false;  // Il token non è valido
            }
            this.isLoading = false;  // Termina il caricamento
          },
          error: (error) => {
            console.error('Error verifying token:', error);
            this.errorMessage = error.message || 'There was an error verifying the token.';
            this.isTokenValid = false;  // Il token è considerato non valido in caso di errore
            this.isLoading = false;  // Termina il caricamento in caso di errore
          }
        });
      } else {
        this.isLoading = false;
        this.errorMessage = 'No token provided.';
        this.isTokenValid = false;  // Se non c'è il token, consideralo non valido
      }
    });
  }




  cryptoForm(): SignUpData | false {
    const formValues = { ...this.signUpForm.value };
    let postData: SignUpData;


    //creazione di una passphrase con il quale viene generata una chiave e cifrati i dati da inserire nel db
    this.passPhrase = this.cryptoService.generatepassphraseUserKey();
    console.log(this.passPhrase)
    //creazione chiave generata dalla passphrase creata per cifrare i dati dell'utente
    const keyToCipherUserData = this.cryptoService.generateUserKey(
      sodium.from_string(this.passPhrase)
    );

    if (this.signUpForm.value.password && this.signUpForm.value.email) {
      const hashPassword = this.cryptoService.resKeyToSave(
        this.signUpForm.value.password,
        this.signUpForm.value.email
      );
      formValues.password = sodium.to_hex(hashPassword);
    } else {
      console.error('Password or email not defined');
      return false;
    }

    if (this.signUpForm.value.email && this.signUpForm.value.telephoneNumber) {
      const email = this.cryptoService.encUserDataRegistration(
        this.signUpForm.value.email,
        keyToCipherUserData
      );

      //viene fatto per verificare una possibile duplice entry nella tabella
      this.hashEmail = sodium.to_hex(
        this.cryptoService.generateHashForEmail(this.signUpForm.value.email)
      );


      const telephoneNumber = this.cryptoService.encUserDataRegistration(
        this.signUpForm.value.telephoneNumber,
        keyToCipherUserData
      );

      if (email && telephoneNumber) {
        formValues.email = sodium.to_hex(email);
        formValues.telephoneNumber = sodium.to_hex(telephoneNumber);
      } else {
        console.error('Missing email or telephone number');
        return false;
      }
    }

    return (postData = {
      ...formValues,
      hashEmail: this.hashEmail,
    } as SignUpData);
  }

  onSignUp() {

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
      this.authService.signup(postData as SignUpData).subscribe({
        next: (response) => {

           Swal.fire({
                    title:
                      "<strong style='font-size: 20px;'>" +
                      response.message +
                      '</strong>',
                    html:
                      "<p style='font-size: 15 px; margin: 0; padding: 5px;'>Save this code to write any report: <br><br> <b>" +
                      this.cryptoService.formatPassPhrase(this.passPhrase) +
                      '</b> </p>',
                    icon: 'success',
                  });

          this.router.navigate(['/login']);
        },
        error: (err) => {
          Toast.fire({
            icon: 'error',
            title: err.error.message,
          });
        },
      });
    }
  }

  get email() {
    return this.signUpForm.controls['email'];
  }

  get password() {
    return this.signUpForm.controls['password'];
  }

  get telephoneNumber() {
    return this.signUpForm.controls['telephoneNumber'];
  }
}
