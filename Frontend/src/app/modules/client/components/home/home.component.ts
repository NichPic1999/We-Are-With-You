import { Component } from '@angular/core';
import { AuthService } from '../../../shared/services/authentication/auth.service';
AuthService
@Component({
  selector: 'app-home',
  standalone: false,

  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private authService: AuthService) {}

  isSidebarOpen: boolean = false;
  showInputRecordSection = false;
  showViewsRecords = false;

  reportData: any = null; // Contiene i dati del report

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  addSectionReport(){
    this.showInputRecordSection = !this.showInputRecordSection;
  }

  addSectionViewReports(){
    this.showViewsRecords = !this.showViewsRecords;
  }

  handleReportData(data: any) {
    this.reportData = data; // Salva i dati ricevuti
    this.showViewsRecords = false; // Chiude la view
    this.showInputRecordSection = true; // Mostra l'input component
  }

  onLogout(){
    this.authService.logout().subscribe({
      next: (response) => {
        console.log(response)
    },
      error: (err) => {
        console.log(err)
      }
    });
  }

}
