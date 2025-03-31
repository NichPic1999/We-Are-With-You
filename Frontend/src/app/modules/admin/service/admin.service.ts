import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { catchError, Observable, throwError } from 'rxjs';
import { RegisterLawyer } from '../interfaces/admin';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = 'http://localhost:3000';
  private baseUrlForAdmins = 'http://localhost:3000/admin';

  constructor(private http: HttpClient) {}

  //chiamata per effettuare la registrazione, da parte esclusivamente di un admin, dell'avvocato e inserirlo nel DB (al server applicativo)
  registerLawyer(postData: RegisterLawyer) {

    return this.http
      .post(`${this.baseUrlForAdmins}/register-lawyer`, postData,  {withCredentials: true})
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  sendFile(formData: FormData) {

    return this.http
      .post<any>(`${this.baseUrl}/send-invitations`, formData,  {withCredentials: true})
      .pipe(
        map((response: any) => response),
        catchError((error) => throwError(() => error))
      );
  }
}
