import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientRoutingModule } from './client-routing.module';
import { HomeComponent } from './components/home/home.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientLayoutComponent } from './client-layout/client-layout.component';
import { SharedModule } from '../shared/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { InputRecordComponent } from './components/input-record/input-record.component';
import { ViewRecordsComponent } from './components/view-records/view-records.component';


@NgModule({
  declarations: [ClientLayoutComponent,HomeComponent, InputRecordComponent, ViewRecordsComponent],
  imports: [
    CommonModule,
    ClientRoutingModule,
    ReactiveFormsModule,
    SharedModule,
    MatIconModule
  ],
})
export class ClientModule { }
