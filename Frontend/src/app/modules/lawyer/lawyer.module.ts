import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LawyerRoutingModule } from './lawyer-routing.module';
import { HomeComponent } from './components/home/home.component';
import { ReactiveFormsModule } from '@angular/forms';
import { LawyerLayoutComponent } from './lawyer-layout/lawyer-layout.component';
import { SharedModule } from '../shared/shared.module';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [HomeComponent, LawyerLayoutComponent],
  imports: [
    CommonModule,
    LawyerRoutingModule,
    ReactiveFormsModule,
    SharedModule,
    MatIconModule
  ],

})
export class LawyerModule { }
