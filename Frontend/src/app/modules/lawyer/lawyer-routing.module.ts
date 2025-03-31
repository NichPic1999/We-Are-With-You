import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LawyerLayoutComponent } from './lawyer-layout/lawyer-layout.component';


const routes: Routes = [
  {
    path: '', component: LawyerLayoutComponent,  // Applica il layout LawyerLayout
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
export class LawyerRoutingModule { }
