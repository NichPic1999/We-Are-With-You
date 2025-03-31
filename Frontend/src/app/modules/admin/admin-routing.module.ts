import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { HomeComponent } from './components/home/home.component';



const routes: Routes = [
  {
    path: '', component: AdminLayoutComponent,  // Applica il layout LawyerLayout
    children: [
      { path: '', component: HomeComponent },  // Questo è il contenuto della pagina
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
