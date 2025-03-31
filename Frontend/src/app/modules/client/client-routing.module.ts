import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule,Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ClientLayoutComponent } from './client-layout/client-layout.component';


const routes: Routes = [
  {
    path: '', component: ClientLayoutComponent,  // Applica il layout ClientLayout
    children: [
      { path: '', component: HomeComponent },  // Questo è il contenuto della pagina
    ]
  },



];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
})
export class ClientRoutingModule { }
