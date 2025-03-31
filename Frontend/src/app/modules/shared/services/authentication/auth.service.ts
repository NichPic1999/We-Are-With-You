import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  LoginData,
  SignUpData,
  AuthData,
  TokenData,
} from '../../interfaces/shared';
import {
  catchError,
  Observable,
  throwError,
  lastValueFrom,
  of,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrlForKeys = 'http://localhost:3000/getKeys';
  private baseUrlForClients = 'http://localhost:3000/clients';
  private serverKeyUrl = 'http://localhost:5000';

  private emailFromDB: string | undefined;
  private emailCipheredPKServer: string | undefined;
  private encRole: string | undefined;
  private intervalId: number | null = null;

  constructor(private http: HttpClient, private router: Router) {}




  //chiamata per ottenere la chiave pubblica del server
  getPublicKey(): Observable<any> {
    return this.http.get<any>(`${this.baseUrlForKeys}/server-publickey`).pipe(
      map((response: any) => {
        return response;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  verifyTokenSignUp(token: string): Observable<any> {
    let postData = {
      verifyToken: token,
    };

    if (!token) {
      return throwError(() => new Error('Null token'));
    }

    return this.http
      .post<any>(`${this.serverKeyUrl}/verify_token_signup`, postData)
      .pipe(
        map((response: any) => {
          return response; // Ritorna la risposta se la chiamata è andata a buon fine
        }),
        catchError((error) => {
          // Gestisci gli errori HTTP
          if (error.status === 400) {
            return throwError(() => new Error('Invalid token.'));
          } else if (error.status === 404) {
            return throwError(() => new Error('Invitation not found.'));
          } else if (error.status === 409) {
            return throwError(() => new Error('Invitation already used.'));
          } else {
            return throwError(
              () => new Error('There was an error verifying the token.')
            );
          }
        })
      );
  }

  //chiamata per effetuare la registrazione di un utente e inserimento dati nel db (al server applicativo)
  signup(postData: SignUpData) {
    return this.http
      .post(`${this.baseUrlForClients}/signup`, postData, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  //chiamata per effettuare il login di client,admin o avvocati (al server delle chiavi)
  login(postData: LoginData): Observable<any> {
    return this.http
      .post<any>(`${this.serverKeyUrl}/login`, postData, {
        headers: { 'Content-Type': 'application/json' },
      })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  //contiene le informazioni necessarie per l'invio e la verifica del magic link
  setEmailsAndRoleForMFA(
    emailFromDb: string,
    emailCipheredPKServer: string,
    encRole: string
  ) {
    this.emailFromDB = emailFromDb;
    this.emailCipheredPKServer = emailCipheredPKServer;
    this.encRole = encRole;
  }

  //richiesta per l'invio del magic-link per la verifica a due fattori sulla mail dell'utente (al server delle chiavi)
  sendMagicLink(): Observable<any> {
    let postData: AuthData = {
      email: '',
      emailFromDB: '',
      encRole: '',
    };

    if (this.emailCipheredPKServer && this.emailFromDB && this.encRole) {
      postData.email = this.emailCipheredPKServer;
      postData.emailFromDB = this.emailFromDB;
      postData.encRole = this.encRole;
    } else {
      console.log("Dati non disponibili per concludere l'autenticazione");
      return throwError(() => new Error("Dati mancanti per l'autenticazione"));
    }

    return this.http
      .post<any>(`${this.serverKeyUrl}/magic_link`, postData, {
        headers: { 'Content-Type': 'application/json' },
      })
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

  //richiesta per la verifica del magic-link con annessa restituzione del JWT creato dal serve delle chiavi
  verifyMagicLinkToken(token: string): Observable<any> {
    //Token del magicLink per la verifica NON JWT
    let postData: TokenData = {
      verifyToken: '',
    };

    if (token) {
      postData.verifyToken = token;
    } else {
      return throwError(() => new Error('Token nullo'));
    }

    return this.http
      .post<any>(`${this.serverKeyUrl}/verify_magic_link`, postData, {
        withCredentials: true,
      })
      .pipe(
        map((response: any) => {
          if (response.code === 200) {
            localStorage.setItem('USER_ROLE', response.role);
            this.checkCookiePeriodically();
            this.redirectBasedOnRole(response.role);
            return response;
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  //serve a ridirezionare l utente, una volta avvenuta l'autenticazione
  private redirectBasedOnRole(role: string): void {
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (role === 'client') {
      this.router.navigate(['/client']);
    } else if (role === 'lawyer') {
      this.router.navigate(['/lawyer']);
    } else {
      this.router.navigate(['/login']); // Se non c'è un ruolo valido, vai alla login
    }
  }

  isLoggedIn() {
    return this.http
      .get<any>(`${this.serverKeyUrl}/auth_token`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          return response;
        }),
        catchError((error) => {

          console.error('Errore in isLoggedIn:', error);
          return of(null);
        })
      );
  }

  checkCookiePeriodically() {
    this.intervalId = setInterval(async () => {
      try {
        const response = await lastValueFrom(this.isLoggedIn());
        console.log("risposta",response)
        if (!response) {
          Swal.fire({
            title: 'Session expired',
            text: 'Please login again to continue!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ok',
          })

          // Esegui il logout
          this.directlyLogout();
          this.stopCheckingCookie();
        }
      } catch (err) {
        Swal.fire({
          title: 'Session expired',
          text: 'Please login again to continue!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Ok',
        })

        // Esegui il logout
        this.directlyLogout();
        this.stopCheckingCookie();
      }
    }, 600000) as unknown as number;
  }

  stopCheckingCookie() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null; // Reimposta per sicurezza
      console.log('Intervallo fermato.');
    }
  }


  directlyLogout(){
    this.router.navigate(['/login']);
  }

  logout() {
    this.stopCheckingCookie();
    return this.http
      .get<any>(`${this.serverKeyUrl}/logout`, { withCredentials: true })
      .pipe(
        map((response: any) => {
          localStorage.removeItem('USER_ROLE');
          this.router.navigateByUrl('/login');
          return response;
        }),
        catchError((error) => {
          localStorage.removeItem('USER_ROLE');
          this.router.navigateByUrl('/login');
          return throwError(() => error);
        })
      );
  }
}
