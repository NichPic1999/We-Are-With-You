import { CryptoService } from './../../../shared/services/cryptography-service/crypto.service';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  FormGroup,
  AbstractControl,
  FormBuilder,
  FormControl,
  Validators,
} from '@angular/forms';
import { DBTuple, PerpetratorData, Record } from '../../interfaces/client';
import { lastValueFrom } from 'rxjs';
import sodium from 'libsodium-wrappers-sumo';
import { ClientService } from '../../services/client.service';
import { CoefficientsDataPerpetrator } from '../../../shared/interfaces/shared';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-input-record',
  standalone: false,

  templateUrl: './input-record.component.html',
  styleUrl: './input-record.component.css',
})
export class InputRecordComponent {
  @Input() preloadedData: any;
  @Input() mode: 'create' | 'edit' = 'create';

  form: FormGroup;
  formSubmitted = false;

  // private dataPerpetrator: CoefficientsDataPerpetrator = {
  //   K_key: '',
  //   A_key: '',
  //   piValuesToMatchRecord: [],
  // };

  private passPhraseUserRegistration: string = '';

  private dataPerpetrator: CoefficientsDataPerpetrator[]=[];

  private emailFromDb: string = '';
  private passPhraseToCreateKeyToEncKey: string | undefined;
  private previousEmail: string = '';
  private previousTelphoneNumber: string = '';
  private previousSocialMediaURL: string = '';
  private previousDetails: string = '';
  private previouskeyToEncryptReport: Uint8Array | undefined;
  private previousUuidLaywer: string = '';

  detForm = new FormGroup({
    details: new FormControl('', [Validators.required]),
  });

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private cryptoService: CryptoService
  ) {
    // Creazione del FormGroup con validatori
    this.form = this.fb.group(
      {
        socialMedia: [''], // Campo per URL social media
        telephone: [''], // Campo per numero di telefono
        email: [''], // Campo per email
      },
      { validators: this.atLeastOneRequired }
    ); // Validatore personalizzato
  }

  //il form viene usato si come primo inserimento sia nella modifica quindi serve distinguere in quel momento
  //in quale modalità lo si sta usando, inoltre recupera la mail del cliente che servirà nei processi successivi
  //verifica se è autenticato
  async ngOnInit(): Promise<void> {
    this.emailFromDb = await this.retrieveEmail();
    const currentMode = this.mode || 'create'; // Assegna 'create' se `mode` non è definito

    if (currentMode === 'edit') {
      this.editMode();
    }
  }

  atLeastOneRequired(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const { socialMedia, telephone, email } = control.value;
    if (socialMedia || telephone || email) {
      return null; // Almeno uno dei campi è compilato
    }

    return { atLeastOneRequired: true }; // Nessun campo è compilato
  }

  checkValidity() {
    this.formSubmitted = true; // Imposta il flag quando il modulo è inviato

    if (this.form.valid) {
      console.log('Form values:', this.form.value);

      return true;
    } else {
      console.log('Form is invalid');
      return false;
    }
  }

  async onSubmitReport() {
    if (this.mode === 'create') {
      if (!this.checkValidity()) {
        console.log('non posso procedere');
        return;
      }
      await this.sendReport();
    }

    this.form.reset();
    this.detForm.reset({
      details: '',
    });
    this.formSubmitted = false;
  }

  //la funzione si preoccupa inizialmente di cifrare tutte le informazioni e attuare le tecniche crittografiche
  // per quanto riguarda l'anonimato e la privacy dei dati insieri dall'utente
  async sendReport() {
    // Tupla di dati che sarà salvata nel database
    let dbTuple: DBTuple | undefined;

    try {
      dbTuple = await this.prepareTuple();

      if(!dbTuple){
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Error creating report!',
        });
        return;
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Error during record preparation,check if you have entered the correct key',
      });
      return;
    }
    if (this.mode === 'create') {
      if (dbTuple) {
        this.sendInfoToDb(dbTuple);
      } else {
        console.error('DBTuple is empty:');
        return;
      }
    } else {
      if (dbTuple) {
        this.updateInfoInDB(dbTuple);
      } else {
        console.error('DBTuple is empty:');
        return;
      }
    }
  }

  //effettua tutte le operazioni sui dati in input dell'utente per creare la tupla da inserire nel DB
  async prepareTuple() {
    //genera valori pseudorandomici dai dati dell'aggressore
    let pseudorandomPerpetratorValue = await this.calculateOPRF();


    //ottenuti i valori dei campi presentati calcolo:
    // **le chiavi k ed a utilizzati per la generazione del segreto condiviso
    //   (sono state scelte delle priorità su quali dei campi inseriti devono essere presi in considerazione);
    // ** i pi_value sono valori che serviranno per riscontrare i match tra i record
    this.dataPerpetrator = this.cryptoService.generatePerpetratorsKeys(
      pseudorandomPerpetratorValue
    );



    //creazione quota del segreto condiviso usando le chiavi k e A.
    const shares = this.cryptoService.generateShamirSecretSharing(
      this.dataPerpetrator,
      this.emailFromDb
    );



    if (!shares) return; // se non è stato possibile creare il segreto,qualcosa non va

    //creazione Record
    const record = await this.createRecord(this.emailFromDb);

    if (!record) {
      return;
    }

    //viene generata una chiave (k') per cifrare il record
    const keyToEncRecord = this.cryptoService.generateKeyToEncRecord();

    //per comodità creiamo un array di soli piValue
    const piValueArray = this.piValueArray(this.dataPerpetrator)


    //cifro il record con la chiave keyToEncRecord (k')
    const eRecord = this.cryptoService.createEncRecord(
      record,
      keyToEncRecord,
      piValueArray
    );


    //cifro la chiave keyToEncRecord (k') con le chiavi k del perpetrator
    const cipherKeyToEncRecordWithK = this.cryptoService.enckeys(
      keyToEncRecord,
      this.dataPerpetrator,
      piValueArray
    );

    //creazione passphrase da restituire all'utente
    this.passPhraseToCreateKeyToEncKey =
      this.cryptoService.generatepassphraseUserKey();

    //creazione chiave utente KU da usare per cifrare la chiave k
    const userKey = this.cryptoService.generateUserKey(
      sodium.from_string(this.passPhraseToCreateKeyToEncKey)
    );

    //cifro la chiave keyToEncRecord (k') con la chiave kU dell'utente
    const cipherKeyToWithUserKey = this.cryptoService.enckey(
      keyToEncRecord,
      userKey,
      piValueArray
    );

    let publicKeyLawyer;
    if (this.mode === 'create') {
      const response = await this.getLawyerKey(
        piValueArray
      );
      publicKeyLawyer = response.data.PublicKey;
    } else {
      //se modifico, un record già assegnato a un avvocato, chiamo lo stesso avvocato
      const response = await this.getSameLawyerKey(this.previousUuidLaywer);
      publicKeyLawyer = response.data.PublicKey;
    }



    //genero il cifrato che potrà essere aperto solo con la chiave privata dell'avvocato
    let cCipher = this.cryptoService.encryptCcipher(
      shares,
      cipherKeyToEncRecordWithK,
      publicKeyLawyer
    );

    if (!cCipher) return;

    //record da salvare nel db
    let DBTuple = this.cryptoService.createTupleForDB(
      piValueArray,
      sodium.to_hex(cCipher),
      sodium.to_hex(cipherKeyToWithUserKey),
      sodium.to_hex(eRecord),
      publicKeyLawyer
    );

    return DBTuple;
  }

  //si occupa di interrogare il service ed effettuare la chiamata al server delle chiavi per effettuare l'OPRF
  // dei tre valori simultaneamente

  async calculateOPRF() {

    let dataPerpetratorToOPRF: PerpetratorData = {
      email: '',
      telephoneNumber: '',
      socialMediaUrl: '',
    };

    let pseudorandomPerpetratorValue: string[] = [];

    dataPerpetratorToOPRF.email = this.form.get('email')?.value;
    dataPerpetratorToOPRF.telephoneNumber = this.form.get('telephone')?.value;
    dataPerpetratorToOPRF.socialMediaUrl = this.form.get('socialMedia')?.value;

    //calcolo valori pseudorandomici ad alta entropia fornendo gli input relativi dell'aggressore
    const response = await lastValueFrom(
      this.clientService.calculateOPRF(dataPerpetratorToOPRF)
    );

    if (response.email)
      pseudorandomPerpetratorValue[0] = response.email;

    if (response.telephoneNumber)
      pseudorandomPerpetratorValue[1] = response.telephoneNumber;

    if (response.socialMediaUrl)
      pseudorandomPerpetratorValue[2] = response.socialMediaUrl;

    return pseudorandomPerpetratorValue;
  }

  //si occupa di interrogare il service ed effettuare la chiamata al server applicativo per ritornare la email
  //opportunamente cifrata dell'utente
  async retrieveEmail() {
    const response = await lastValueFrom(this.clientService.retrieveEmail());
    if (response) return response.data.ClientEmail;
    else return null;
  }

  //crea il record che deve essere cifrato
  async createRecord(emailFromDb: string) {
    const result = await Swal.fire({
      title: 'Enter the passphrase you received during registration',
      html: `
        <div style="display: flex; justify-content: center; gap: 0px;">
          <input id="word1" class="swal2-input" style="width: 80px; margin: 6px;" maxlength="4">
          <input id="word2" class="swal2-input" style="width: 80px; margin: 6px;" maxlength="4">
          <input id="word3" class="swal2-input" style="width: 80px; margin: 6px;" maxlength="4">
          <input id="word4" class="swal2-input" style="width: 80px; margin: 6px;" maxlength="4">
        </div>
      `,
      customClass: {
        title: 'swal-title-small',
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Submit',
      preConfirm: () => {
        // Ottieni i valori SOLO all'interno di preConfirm
        const word1 = (document.getElementById('word1') as HTMLInputElement)
          .value;
        const word2 = (document.getElementById('word2') as HTMLInputElement)
          .value;
        const word3 = (document.getElementById('word3') as HTMLInputElement)
          .value;
        const word4 = (document.getElementById('word4') as HTMLInputElement)
          .value;

        // Validazione: controlla che i campi non siano vuoti e abbiano esattamente 4 caratteri
        if (!word1 || !word2 || !word3 || !word4) {
          Swal.showValidationMessage('All fields are required!');
          return false;
        }

        if (
          word1.length !== 4 ||
          word2.length !== 4 ||
          word3.length !== 4 ||
          word4.length !== 4
        ) {
          Swal.showValidationMessage(
            'Each word must contain exactly 4 characters!'
          );
          return false;
        }

        // Ritorna un oggetto con le parole
        return word1 + word2 + word3 + word4;
      },
    });

    const detailsValue = this.detForm.get('details')?.value;

    let record: Record = {
      user: '',
      perpetratorData: {
        email: '',
        telephoneNumber: '',
        socialMediaUrl: '',
      },
      details: '',
    };
    let userEmail;

    try{
       userEmail = this.cryptoService.decEmail(emailFromDb, result.value);

       if(userEmail && detailsValue) {
        record.user = userEmail;
        record.details = detailsValue;
        record.perpetratorData.email = this.form.get('email')?.value;
        record.perpetratorData.socialMediaUrl =
          this.form.get('socialMedia')?.value;
        record.perpetratorData.telephoneNumber =
          this.form.get('telephone')?.value;
      } else {
        console.log('non ho potuto completare il record');
        return null;
      }

      return record;

    }catch (error){
      throw error;
    }


  }

  piValueArray(coefficientsPerpetratorData: CoefficientsDataPerpetrator[]){
    let piValueArray: string [] = [];

    for (let i = 0; i < coefficientsPerpetratorData.length; i++) {
      if(coefficientsPerpetratorData[i].piValuesToMatchRecord != ''){
        piValueArray[i]= coefficientsPerpetratorData[i].piValuesToMatchRecord
      }else{
        piValueArray[i]= ''
    }
  }
    return piValueArray;

  }

  async getLawyerKey(piValue: string[]) {

    const piValueJson = JSON.stringify(piValue);

    const response = await lastValueFrom(
      this.clientService.getLawyerKey(piValueJson)
    );

    if (response) return response;
    else return null;
  }

  async getSameLawyerKey(uuidLawyer: string) {
    const response = await lastValueFrom(
      this.clientService.getLawyerKeyByUuidLawyer(uuidLawyer)
    );

    if (response) return response;
    else return null;
  }

  sendInfoToDb(DBTuple: DBTuple) {
    this.clientService.sendInfotoDB(DBTuple).subscribe({
      next: (response) => {
        if (!this.passPhraseToCreateKeyToEncKey)
          throw new Error('Error. Non-returnable passphrase');

        Swal.fire({
          title:
            "<strong style='font-size: 20px;'>" +
            response.message +
            '</strong>',
          html:
            "<p style='font-size: 15 px; margin: 0; padding: 5px;'>Save this code to access the report again: <br><br> <b>" +
            this.cryptoService.formatPassPhrase(
              this.passPhraseToCreateKeyToEncKey
            ) +
            '</b> </p>',
          icon: 'success',
        });
      },
      error: (err) => {
        console.log(err); //swalfire
      },
    });
  }

  /**Il componente è usato per la visualizzazione nonchè raccolta dei dati di report già inseriti */

  editMode() {
    this.previousEmail = this.preloadedData.perpetratorData?.email || '';
    this.previousTelphoneNumber =
      this.preloadedData.perpetratorData?.telephoneNumber || '';
    this.previousSocialMediaURL =
      this.preloadedData.perpetratorData?.socialMediaUrl || '';
    this.previousDetails = this.preloadedData?.details || '';
    this.previouskeyToEncryptReport =
      this.preloadedData?.keyToEncryptRecord || '';
    this.previousUuidLaywer = this.preloadedData?.uuidLawyer || '';

    this.form = this.fb.group({
      email: this.previousEmail,
      telephone: this.previousTelphoneNumber,
      socialMedia: this.previousSocialMediaURL,
    });

    this.detForm.patchValue({
      details: this.previousDetails,
    });
  }

  checkAllFieldsEmpty() {
    const emailValue = this.form.get('email')?.value;
    const socialMediaValue = this.form.get('socialMedia')?.value;
    const telephoneValue = this.form.get('telephone')?.value;

    if (!emailValue?.trim() && !socialMediaValue?.trim() && !telephoneValue?.trim()  ) {
      return false;
    }
    return true;

  }
  //effettua le operazioni a seconda di cosa è stato cambiato nel record rispetto a prima
  //nel caso è cambiato il perpetrator viene fatto un nuovo inserimento, altrimenti
  //ci si limita a cambiare i dettagli (nel caso di array di pi_value)
  async onUpdateReport() {

    if (this.mode === 'edit') {
      if (!this.checkAllFieldsEmpty() ) {
        Swal.fire({
                    title: 'Error',
                    text: 'operation not allowed, please enter at least one identifier',
                    icon: 'error',
                  });
        return;
      }

      if(!this.checkValidity()){
        Swal.fire({
          title: 'Error',
          text: 'operation not allowed',
          icon: 'error',
        });
        return;
      }


      if (
        this.previousEmail === this.form.get('email')?.value &&
        this.previousTelphoneNumber === this.form.get('telephone')?.value &&
        this.previousSocialMediaURL === this.form.get('socialMedia')?.value
      ) {

        if (this.previousDetails === this.detForm.get('details')?.value) {
          return;
        } else {
          //rigenero il record con i nuovi details
          const record = await this.createRecord(this.emailFromDb);

          if (!record) {
            return; //swal fire errore nella creazione del report
          }

          if(!this.previouskeyToEncryptReport)
            return; //nesssuna chiave con cui cifrare il record

          //Calcolo OPRF per avere i pivalue
          let pseudorandomPerpetratorValue = await this.calculateOPRF();

          //Calcolo OPRF per avere i pivalue
          let piValuePerpetrator: string[] = [];

          if(pseudorandomPerpetratorValue[0])
            piValuePerpetrator[0] = sodium.to_hex(this.cryptoService.derivePiValue(pseudorandomPerpetratorValue[0]));
          else
            piValuePerpetrator[0] =  '';

          if(pseudorandomPerpetratorValue[1])
            piValuePerpetrator[1] = sodium.to_hex(this.cryptoService.derivePiValue(pseudorandomPerpetratorValue[1]));
          else
            piValuePerpetrator[1] =  '';

          if(pseudorandomPerpetratorValue[2])
            piValuePerpetrator[2] = sodium.to_hex(this.cryptoService.derivePiValue(pseudorandomPerpetratorValue[2]));
          else
            piValuePerpetrator[2] =  '';

          const eRecord = this.cryptoService.createEncRecord(
            record,
            this.previouskeyToEncryptReport,
            piValuePerpetrator,
          );

         this.updateDetailsInDB(sodium.to_hex(eRecord))

        }
      } else {
        //se cambia l'aggressore cambia l'intero report quindi faccio un nuovo inserimento
        console.log("dovrei sta qua")
        await this.sendReport();
      }
    }

  }


  updateInfoInDB(DBTuple: DBTuple) {
    console.log('arrivato');

    let idReport = this.preloadedData?.idReport;

    this.clientService.updateInfoInDB(DBTuple, idReport).subscribe({
      next: (response) => {
        if (!this.passPhraseToCreateKeyToEncKey)
          throw new Error('Error. Non-returnable passphrase');

        Swal.fire({
          title:
            "<strong style='font-size: 20px;'>" +
            response.message +
            '</strong>',
          html:
            "<p style='font-size: 15 px; margin: 0; padding: 5px;'> New passphrase is: <br><br> <b>" +
            this.cryptoService.formatPassPhrase(
              this.passPhraseToCreateKeyToEncKey
            ) +
            '</b> </p>',
          icon: 'success',
        });
      },
      error: (err) => {
        console.log(err); //swalfire
      },
    });
  }

  //effettua la chiamata per la modifica solo ed esclusivamente dei dettagli
  updateDetailsInDB(newRecord: string) {
    let idReport = this.preloadedData?.idReport;
    console.log(idReport);

    this.clientService.updateDetailsInDB(newRecord, idReport).subscribe({
      next: (response) => {
        Swal.fire({
          title:
            "<strong style='font-size: 20px;'>" +
            response.message +
            '</strong>',
          html: "<p style='font-size: 15 px; margin: 0; padding: 5px;'> Record modificato con successo </p>",
          icon: 'success',
        });
      },
      error: (err) => {
        console.log(err); //swalfire
      },
    });
  }

  //effettua la cancellazione di un report precedentemente inserito da un utente
  deleteReport() {
    this.clientService.deleteReport(this.preloadedData?.idReport).subscribe({
      next: (response) => {
        console.log(response);
        Swal.fire({
          title: 'Successfully removed',
          text: response.message,
          icon: 'success',
        });
      },
      error: (err) => {
        if (err.status === 405) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'No report found with this informations!',
          });
        }
      },
    });

    this.resetForm();
  }

  resetForm(): void {
    this.form.reset(); // Reset dei campi del form
    this.formSubmitted = false;
    this.detForm.reset({
      details: '', // Imposta il valore di default per "details"
    });
    window.location.reload();
    this.mode = 'create';
  }

  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
    this.resetForm();
  }
}
