import { SharedData } from './../../shared/interfaces/shared';
import { CryptoService } from './../../shared/services/cryptography-service/crypto.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import sodium from 'libsodium-wrappers-sumo';
import { map } from 'rxjs/operators';
import { catchError, Observable, throwError } from 'rxjs';
import { Report } from '../interfaces/lawyer';
import Swal from 'sweetalert2';
import { lastValueFrom } from 'rxjs'; //chiamate asincrone

@Injectable({
  providedIn: 'root',
})
export class LawyerService {
  private baseUrl = 'http://localhost:3000/lawyer';
  private lawyerPubKey_touse: Uint8Array | null = null;
  private piValueKeymaps = new Map<string, Uint8Array>();
  private encoder = new TextEncoder();

  constructor(
    private http: HttpClient,
    private cryptoService: CryptoService,
  ) {}

  async setPublicKeyLawyer(): Promise<void> {
    try {
      const response = await lastValueFrom(
        this.http.get<any>(`${this.baseUrl}/lawyer_key`, {
          withCredentials: true,
        })
      );

      this.lawyerPubKey_touse = sodium.from_hex(response.data.PublicKey);
    } catch (error) {
      console.error('Errore durante la chiamata HTTP:', error);
      throw error; // Propaga l'errore in caso di necessità
    }
  }

  getLastMatch() {
    return this.http
      .get<any>(`${this.baseUrl}/last_match`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          console.log(response);
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  async verifyMatching(listOfReports: Report[]) {
    let decryptedValues: any[] = [];

    if (!this.lawyerPubKey_touse) {
      return;
    }

    for (let report of listOfReports) {
      //deciframo i cifrati "contenenti i segreti di ogni report (user e share)
      //e il cifrato della chiave k' da usare per l'ERecord"
      let decryptedValue;

      decryptedValue = await this.cryptoService.decryptCcipher(
        report,
        this.lawyerPubKey_touse
      );

      if (!decryptedValue) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'The record could not be deciphered!',
        });
        return null;
      } else {
        let jsonReport = JSON.parse(sodium.to_string(decryptedValue));

        //lo aggiungiamo al jsonReport perchè ci servirà per decifrare nell'AEAD
        jsonReport.PiValue = report.PiValue;

        //lo aggiungiamo al jsonReport così da sapere qual è l'ERecord da decifrare con la chiave che riotterremo
        jsonReport.ERecord = report.ERecord;
        jsonReport.UuidReport = report.UuidReport;

        decryptedValues.push(jsonReport);
      }
    }

    for (let i = 0; i < decryptedValues.length; i++) {
      const deserializedPiValueI: string[] = JSON.parse(
        decryptedValues[i].PiValue
      );

      for (let j = i + 1; j < decryptedValues.length; j++) {
        if (
          deserializedPiValueI[0] !== '' &&
          !this.piValueKeymaps.has(deserializedPiValueI[0])
        ) {
          const isPresent = decryptedValues[j].PiValue.includes(
            deserializedPiValueI[0]
          );
          if (isPresent) {
            if (
              decryptedValues[i][0].sharedData.user !== '0' &&
              decryptedValues[j][0].sharedData.user !== '0'
            ) {
              if (
                decryptedValues[i][0].sharedData.user !==
                decryptedValues[j][0].sharedData.user
              ) {
                let keyK = this.cryptoService.SSSReconstruction(
                  decryptedValues[i][0],
                  decryptedValues[j][0]
                );
                this.piValueKeymaps.set(deserializedPiValueI[0], keyK);

              }
            }
          }
        }

        if (
          deserializedPiValueI[1] !== '' &&
          !this.piValueKeymaps.has(deserializedPiValueI[1])
        ) {
          const isPresent = decryptedValues[j].PiValue.includes(
            deserializedPiValueI[1]
          );
          if (isPresent) {
            if (
              decryptedValues[i][1].sharedData.user !== '0' &&
              decryptedValues[j][1].sharedData.user !== '0'
            ) {
              if (
                decryptedValues[i][1].sharedData.user !==
                decryptedValues[j][1].sharedData.user
              ) {
                let keyK = this.cryptoService.SSSReconstruction(
                  decryptedValues[i][1],
                  decryptedValues[j][1]
                );
                this.piValueKeymaps.set(deserializedPiValueI[1], keyK);
              }
            }
          }
        }

        if (
          deserializedPiValueI[2] !== '' &&
          !this.piValueKeymaps.has(deserializedPiValueI[2])
        ) {
          const isPresent = decryptedValues[j].PiValue.includes(
            deserializedPiValueI[2]
          );
          if (isPresent) {
            if (
              decryptedValues[i][2].sharedData.user !== '0' &&
              decryptedValues[j][2].sharedData.user !== '0'
            ) {
              if (
                decryptedValues[i][2].sharedData.user !==
                decryptedValues[j][2].sharedData.user
              ) {
                let keyK = this.cryptoService.SSSReconstruction(
                  decryptedValues[i][2],
                  decryptedValues[j][2]
                );
                this.piValueKeymaps.set(deserializedPiValueI[2], keyK);
              }
            }
          }
        }
      }
    }

    if (this.piValueKeymaps.size === 0) {
      console.log('there are no prerequisites');
      return null;
    }

    let listPlaintext: any[] = [];


    const processedReports = new Set<string>(); // Traccia i PiValue già trattati

for (let piValue of this.piValueKeymaps) {

  let keyForPiValue = this.piValueKeymaps.get(piValue[0]);

  console.log(piValue[0])
  for (let decryptedValue of decryptedValues) {
    // Salta se questo report è già stato trattato
    if (processedReports.has(decryptedValue.UuidReport)) {
      continue;
    }

    if (decryptedValue.PiValue.includes(piValue[0])) {

      let decryptedKey;

      if (keyForPiValue) {

        //mi dice la posizione e in base a quello so quale dato usare (email =0, telephoneNumber =1, socialMediaURL=2)
        let position= this.getPositionOfCipherKeyK(decryptedValue.PiValue,piValue[0]);

        decryptedKey = this.cryptoService.decrypt(
          decryptedValue[position].CipherKeyWithK,
          keyForPiValue,
          this.encoder.encode(decryptedValue.PiValue)
        );
      }


      if (decryptedKey !== null) {
        let clientReport = this.cryptoService.decrypt(
          decryptedValue.ERecord,
          decryptedKey,
          this.encoder.encode(decryptedValue.PiValue)
        );

        if (clientReport) {
          clientReport = JSON.parse(sodium.to_string(clientReport));
          listPlaintext.push(clientReport);

          // Aggiungi il PiValue al Set dei processati
          processedReports.add(decryptedValue.UuidReport);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong with the retrieval of the user record!',
          });
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong with the recovery of the key!',
        });
      }
    }
  }
}

    listPlaintext.sort((a, b) =>
      a.perpetratorData.email.localeCompare(b.perpetratorData.email)
    );

    return listPlaintext;
  }

  getPositionOfCipherKeyK(reportPiValues:string, piValueToSearch: string){

    // Parse la stringa JSON per ottenere un array
    const array = JSON.parse(reportPiValues) as string[];

    // Trova l'indice dell'elemento
    const position = array.indexOf(piValueToSearch);

    console.log(position);
    return position;
  }
}

