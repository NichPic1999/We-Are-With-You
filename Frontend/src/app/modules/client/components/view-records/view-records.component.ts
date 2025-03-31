import {
  Component,
  EventEmitter,
  Output,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder } from '@angular/forms';
import { PerpetratorData, RetrieveReport } from '../../interfaces/client';
import { CryptoService } from '../../../shared/services/cryptography-service/crypto.service';
import sodium from 'libsodium-wrappers-sumo';
import { lastValueFrom } from 'rxjs';
import { ClientService } from '../../services/client.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-view-records',
  standalone: false,

  templateUrl: './view-records.component.html',
  styleUrl: './view-records.component.css',
})
export class ViewRecordsComponent {
  @ViewChildren('inputField') inputFields!: QueryList<
    ElementRef<HTMLInputElement>
  >;
  @Output() dataSelected = new EventEmitter<any>();

  form: FormGroup;
  formSubmitted = false;
  private pseudorandomPerpetratorValue: string[] = [];
  private piValuePepetrator: string[] = [];


  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private cryptoService: CryptoService
  ) {
    // Creazione del FormGroup con validatori
    this.form = this.fb.group(
      {
        socialMedia: [''],
        telephone: [''],
        email: [''],
      },
      { validators: this.atLeastOneRequired }
    );
  }

  atLeastOneRequired(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const { socialMedia, telephone, email } = control.value;
    if (socialMedia || telephone || email) {
      return null;
    }
    return { atLeastOneRequired: true };
  }

  //spostare automaticamente il cursore una volta avanti o indietro per scrivere la passphrase
  ngAfterViewInit() {
    this.inputFields.forEach((input, index) => {
      const element = input.nativeElement;

      element.addEventListener('input', () => {
        // Sposta il focus al prossimo input se la lunghezza è 4
        if (element.value.length === 4 && index < this.inputFields.length - 1) {
          this.inputFields.toArray()[index + 1].nativeElement.focus();
        }
      });

      element.addEventListener('keydown', (event) => {
        // Permetti di spostarti indietro se premi "Backspace" su un campo vuoto
        if (
          event.key === 'Backspace' &&
          element.value.length === 0 &&
          index > 0
        ) {
          this.inputFields.toArray()[index - 1].nativeElement.focus();
        }
      });
    });
  }

  checkValidity() {
    this.formSubmitted = true;
    if (this.form.valid) {
      console.log('Form values:', this.form.value);
      return true;
    } else {
      console.log('Form is invalid');
      return false;
    }
  }

  //se i considera array di pi_value

  async onSubmit(){

    if(!this.checkValidity()){
      console.log("non posso procedere");
      return;
    }

    let dataPerpetratorToOPRF: PerpetratorData = {
      email: '',
      telephoneNumber: '',
      socialMediaUrl: '',
    };

    const part1 = (document.getElementById('part1') as HTMLInputElement)?.value || '';
    const part2 = (document.getElementById('part2') as HTMLInputElement)?.value || '';
    const part3 = (document.getElementById('part3') as HTMLInputElement)?.value || '';
    const part4 = (document.getElementById('part4') as HTMLInputElement)?.value || '';

    const passPhrase = this.recreatePassPhrase(part1,part2,part3,part4)
    const userKey = this.cryptoService.generateUserKey(sodium.from_string(passPhrase))

    dataPerpetratorToOPRF.email = this.form.get('email')?.value
    dataPerpetratorToOPRF.telephoneNumber = this.form.get('telephone')?.value
    dataPerpetratorToOPRF.socialMediaUrl =  this.form.get('socialMedia')?.value

    const response = await lastValueFrom(this.clientService.calculateOPRF(dataPerpetratorToOPRF));
        this.pseudorandomPerpetratorValue =[];  //contiene i valori pseudorandomici dell'identità dei diversi utenti (NON PI VALUE)


        if(response.email)
          this.pseudorandomPerpetratorValue[0]=response.email

        if(response.telephoneNumber)
          this.pseudorandomPerpetratorValue[1]=response.telephoneNumber

        if(response.socialMediaUrl)
          this.pseudorandomPerpetratorValue[2]=response.socialMediaUrl


    if(this.pseudorandomPerpetratorValue[0] !== undefined)
      this.piValuePepetrator[0]=sodium.to_hex(this.cryptoService.derivePiValue(this.pseudorandomPerpetratorValue[0]))
    else
      this.piValuePepetrator[0] = ''

    if(this.pseudorandomPerpetratorValue[1] !== undefined)
      this.piValuePepetrator[1]=sodium.to_hex(this.cryptoService.derivePiValue(this.pseudorandomPerpetratorValue[1]))
    else
      this.piValuePepetrator[1] = ''

    if(this.pseudorandomPerpetratorValue[2] !== undefined)
      this.piValuePepetrator[2] = sodium.to_hex(this.cryptoService.derivePiValue(this.pseudorandomPerpetratorValue[2]))
    else
    this.piValuePepetrator[2] = ''

    const jsonToRetrieve = this.cryptoService.createJsonToRetrieveRecord(this.piValuePepetrator,sodium.to_hex(userKey))
    this.sendToRetrieveRecord(jsonToRetrieve);

  }


  //prende la passphrase inserita nei 4 campi in input e li riunisce
  recreatePassPhrase(
    part1: string,
    part2: string,
    part3: string,
    part4: string
  ) {
    return part1 + part2 + part3 + part4;
  }

  //si occupa di contattare il service ed effettuare la chiamata al backend
  sendToRetrieveRecord(retrieveRecord: RetrieveReport) {
    this.clientService.sendToRetrieveRecord(retrieveRecord).subscribe({
      next: (response) => {
        //recuperiamo prima la chiave (K') per decifrare l'Erecord
        let decryptedKey = this.cryptoService.decrypt(
          response.report.CipherUser,
          sodium.from_hex(retrieveRecord.userKey),
          sodium.from_string(retrieveRecord.piValuePerpetrator)
        );

        //decifriamo l'erecord
        if (decryptedKey != null) {
          let reportData = this.cryptoService.decrypt(
            response.report.ERecord,
            decryptedKey,
            sodium.from_string(retrieveRecord.piValuePerpetrator)
          );

          if (reportData != null) {
            console.log(response);
            const dataSavedReport = JSON.parse(sodium.to_string(reportData));
            dataSavedReport.idReport = response.report.UuidReport;
            dataSavedReport.keyToEncryptRecord = decryptedKey;
            dataSavedReport.uuidLawyer = response.report.UuidLawyer;

            this.dataSelected.emit(dataSavedReport);
          }
        }
        return response;
      },
      error: (err) => {
        if(err.status === 405){
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "No report found with this informations!",
        });
      }
      },
    });
  }

  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
