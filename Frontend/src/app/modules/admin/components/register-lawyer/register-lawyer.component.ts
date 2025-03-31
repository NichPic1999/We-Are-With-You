import { CryptoService } from './../../../shared/services/cryptography-service/crypto.service';
import { Component,EventEmitter,Output } from '@angular/core';
import { FormControl, FormGroup, Validators,AbstractControl,ValidationErrors } from '@angular/forms';
import { RegisterLawyer } from '../../interfaces/admin';
import sodium from 'libsodium-wrappers-sumo'
import { AdminService } from '../../service/admin.service';
import Swal from 'sweetalert2';



@Component({
  selector: 'app-register-lawyer',
  standalone: false,

  templateUrl: './register-lawyer.component.html',
  styleUrl: './register-lawyer.component.css'
})
export class RegisterLawyerComponent {


  signLawyerForm= new FormGroup(
    {
      email: new FormControl('', [Validators.required, Validators.pattern(/[a-z0-9\._%\+\-]+@[a-z0-9\.\-]+\.[a-z]{2,}$/)]),
      password: new FormControl('', [Validators.required,
        Validators.minLength(8),
        this.specialCharacterValidator,
        this.uppercaseValidator,
        this.numberValidator
      ]),
      publicKey: new FormControl('', [Validators.required]),

    }
  )


  constructor(private cryptoService: CryptoService,private adminService:AdminService) {}

  specialCharacterValidator(control: AbstractControl): ValidationErrors | null {
    const specialCharacterPattern = /[!@#$%^&*(),.?":{}|<>]/; // Caratteri speciali
    if (control.value && !specialCharacterPattern.test(control.value)) {
      return { specialCharacter: 'Password must contain at least one special character.' };
    }
    return null;
  }

  uppercaseValidator(control: AbstractControl): ValidationErrors | null {
    const uppercasePattern = /[A-Z]/; // Lettere maiuscole
    if (control.value && !uppercasePattern.test(control.value)) {
      return { uppercase: 'Password must contain at least one uppercase letter.' };
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


  cryptoForm(): RegisterLawyer|false {
    const formValues = { ...this.signLawyerForm.value };
    let postData: RegisterLawyer;
    //const hashUsername = await this.encryptionService.usernameStretch("Nicho99"); //username

    console.log(formValues.email)
    console.log(formValues.password)
    console.log(formValues.publicKey)

    if (this.signLawyerForm.value.password && this.signLawyerForm.value.email) {
        const hashPassword = this.cryptoService.resKeyToSave(this.signLawyerForm.value.password,this.signLawyerForm.value.email)  //password
        formValues.password=sodium.to_hex(hashPassword);
    } else {
        console.error('Password o email non definita');
        return false;
    }

    if (this.signLawyerForm.value.email &&  this.signLawyerForm.value.publicKey) {
      const email = this.cryptoService.generateLawyerHashEmail(this.signLawyerForm.value.email);

      if(email ){
        formValues.email=sodium.to_hex(email);
      }else{
        console.error('Miss email');
        return false;
      }
    }



    return postData = { ...formValues } as RegisterLawyer;

  }

  registerLawyer(){

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

    const postData = this.cryptoForm()

    if(postData){

    this.adminService.registerLawyer(postData as RegisterLawyer).subscribe({

        next: (response) => {
          console.log(response)
          if(response.success === true){
            console.log("1")
            Toast.fire({
              icon: 'success',
              title: response.message,
            });
          }else{
            console.log("2")
            Toast.fire({
              icon: 'error',
              title: response.message,
            });
          }
        },
        error: (err) => {
          Toast.fire({
            icon: 'error',
            title: err,
          });
        },
      });
    }

    this.signLawyerForm.reset({
      email: '', // Imposta il valore di default per "details"
      password: '',
      publicKey: '',
    });
  }



  get email(){
    return this.signLawyerForm.controls['email'];
  }

  get password(){
    return this.signLawyerForm.controls['password'];
  }


  get publicKey(){
    return this.signLawyerForm.controls['publicKey'];
  }


  @Output() closed = new EventEmitter<void>();

    close() {
      this.closed.emit();
    }
}
