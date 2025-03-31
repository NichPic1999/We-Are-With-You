import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './modules/shared/login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MFauthenticationComponent } from './modules/shared/mfauthentication/mfauthentication.component';
import { authGuard } from './guard/auth.guard';
import { SignUpComponent } from './modules/shared/sign-up/sign-up.component';
import { KeyErrorComponent } from './modules/shared/key-error/key-error.component';


const routes: Routes = [
  { path: 'signup',  component: SignUpComponent },
  { path: 'error',  component: KeyErrorComponent },
  { path: 'login',  component: LoginComponent },
  { path: 'auth',  component: MFauthenticationComponent },
  { path: 'verify-magic-link/:token', component: MFauthenticationComponent},

  { path: 'client', loadChildren: () => import('../app/modules/client/client.module').then(m => m.ClientModule),
    canActivate: [authGuard],
    data: {role:'client'}
   },
  { path: 'lawyer', loadChildren: () => import('../app/modules/lawyer/lawyer.module').then(m => m.LawyerModule),
    canActivate: [authGuard],
    data: {role:'lawyer'}
  },
  { path: 'admin', loadChildren: () => import('../app/modules/admin/admin.module').then(m => m.AdminModule),
    canActivate: [authGuard],
    data: {role:'admin'}
   },

  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirect di default
  { path: '**', redirectTo: '/login' }, // Gestione rotte non trovate
];

@NgModule({
  imports: [RouterModule.forRoot(routes),
    ReactiveFormsModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
