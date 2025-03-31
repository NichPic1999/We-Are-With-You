import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError,map } from 'rxjs';
import {PerpetratorData,DBTuple,RetrieveReport,DataToGetLawyerKey,DataToGetLawyerKeyWithUuidLawyer} from '../../client/interfaces/client';
import { CryptoService } from '../../shared/services/cryptography-service/crypto.service'
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private serverKeyUrl = 'http://localhost:5000';
  private baseUrlForClients = 'http://localhost:3000/clients';

 // private tokenType = 'Bearer ';


   constructor(private http: HttpClient, private router: Router,private criptoService: CryptoService) {}

 // calcolo dell'OPRF con il server delle chiavi (con array di pi_value)
  calculateOPRF(dataToOPRF: PerpetratorData): Observable<any> {
    const postDataToOPRF = this.criptoService.hashDataPerpetrator(dataToOPRF);

    return this.http
      .post<any>(`${this.serverKeyUrl}/calculate_OPRF`, postDataToOPRF)
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.log(error);
          return throwError(() => error);
        })
      );
  }


  retrieveEmail(): Observable<any> {
    console.log("arrivo qua")

    return this.http
      .get<any>(`${this.baseUrlForClients}/retrieve_email`, {withCredentials:true})
      .pipe(
        map((response: any) => {
          console.log(response)
          return response;
        }),
        catchError((error) => {
          console.log(error);
          return throwError(() => error);
        })
      );
  }

  sendInfotoDB(dbTuple: DBTuple) {
    return this.http.post(`${this.baseUrlForClients}/complaint`, dbTuple, {withCredentials:true}).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  updateInfoInDB(dbTuple: DBTuple, idReport:string) {
    // const header = new HttpHeaders()
    //   .set('Authorization', this.tokenType + localStorage.getItem('ACCESS_TOKEN'))
    //   .set('Content-Type', 'application/json');
    // const headers = { headers: header };

    const payload = {
      dbTuple: dbTuple,
      idReport: idReport
    };

    return this.http.post(`${this.baseUrlForClients}/update_all_report`, payload, {withCredentials:true}).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  updateDetailsInDB(newRecord: string, idReport:string) {

    // const header = new HttpHeaders()
    //   .set('Authorization', this.tokenType + localStorage.getItem('ACCESS_TOKEN'))
    //   .set('Content-Type', 'application/json');
    // const headers = { headers: header };

    const payload = {
      newRecord: newRecord,
      idReport: idReport
    };

    return this.http.post(`${this.baseUrlForClients}/update_only_details`, payload, {withCredentials:true}).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  deleteReport(idReport: string) {

    return this.http
      .post(`${this.baseUrlForClients}/delete_report`, {idReport}, {withCredentials:true})
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  sendToRetrieveRecord(retrieveRecord: RetrieveReport) {

    return this.http
      .post(`${this.baseUrlForClients}/retrieve_record`, retrieveRecord, {withCredentials:true})
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

//con un pi_value, si effettua la ricerca per sapere a quale avvocato verrà assegnato il report del client
  getLawyerKey(piValue: string){
    const piValueToUse: DataToGetLawyerKey = {
      piValue: piValue,
    };

    return this.http
      .post<any>(`${this.baseUrlForClients}/lawyer-key`, piValueToUse, {withCredentials:true} )
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.log(error);
          return throwError(() => error);
        })
      );
  }

  getLawyerKeyByUuidLawyer(uuidLawyer: string){
    const uuidToUse: DataToGetLawyerKeyWithUuidLawyer = {
      uuidLawyer: uuidLawyer,
    };


    // const header = new HttpHeaders()
    // .set('Authorization', this.tokenType + localStorage.getItem('ACCESS_TOKEN'))
    // .set('Content-Type', 'application/json');
    // const headers = { headers: header };

    return this.http
      .post<any>(`${this.baseUrlForClients}/same_lawyer-key`, uuidToUse,{withCredentials:true} )
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          console.log(error);
          return throwError(() => error);
        })
      );
  }

}
