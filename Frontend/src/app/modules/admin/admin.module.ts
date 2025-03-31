import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from '../admin/components/home/home.component';
import { AdminRoutingModule } from './admin-routing.module';
import { SharedModule } from '../shared/shared.module';
import { RegisterLawyerComponent } from './components/register-lawyer/register-lawyer.component';
import { MatIconModule } from '@angular/material/icon';
import { SendEmailComponent } from './components/send-email/send-email.component';


@NgModule({
  declarations: [HomeComponent, AdminLayoutComponent, RegisterLawyerComponent, SendEmailComponent],
  imports: [
      CommonModule,
      AdminRoutingModule,
      ReactiveFormsModule,
      SharedModule,
      MatIconModule
    ],
})

export class AdminModule { }
