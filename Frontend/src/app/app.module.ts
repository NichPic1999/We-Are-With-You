import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './modules/shared/login/login.component';
import { MFauthenticationComponent } from './modules/shared/mfauthentication/mfauthentication.component';
import { provideHttpClient } from '@angular/common/http';
import { SignUpComponent } from './modules/shared/sign-up/sign-up.component';
import { KeyErrorComponent } from './modules/shared/key-error/key-error.component';



@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignUpComponent,
    MFauthenticationComponent,
    KeyErrorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    ],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent]
})

export class AppModule { }
