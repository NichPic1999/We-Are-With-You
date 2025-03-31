import { Component } from '@angular/core';
import { LawyerService } from '../../service/lawyer.service';
import { Report,ReportToView } from '../../interfaces/lawyer';
import { AuthService } from '../../../shared/services/authentication/auth.service';
import Swal from 'sweetalert2';
import sodium from 'libsodium-wrappers-sumo';



@Component({
  selector: 'app-home',
  standalone: false,

  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private lawyerService: LawyerService,private authService:AuthService) {}

  listOfAllReports: Report[] = [];
  filteredList:Report[] =[];
  noReportsMessage: string = '';
  selectedReport: any = null;
  isSidebarOpen: boolean = false;
  listOfMatchingReports: ReportToView[] = [];


  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }


  async ngOnInit(): Promise<void> {
    await this.lawyerService.setPublicKeyLawyer()
    await this.getLastMatch();
    this.viewMatching();
  }

  async verifyUpdate(){
    await this.getLastMatch();
    this.viewMatching();
  }

  async getLastMatch() {
    this.listOfAllReports = [];

    return new Promise<void>((resolve, reject) => {
      this.lawyerService.getLastMatch().subscribe({
        next: (response) => {
          let listReports = response.listReports;
          if (response.listReports.length > 0) {
            this.listOfAllReports = listReports;
            console.log('Contenuti aggiornati:', response);
            resolve();  // Risolve la promessa dopo aver ricevuto i dati
          } else {
            this.noReportsMessage = 'Non ci sono matching';
            resolve();  // Risolve comunque se non ci sono matching
          }
        },
        error: (err) => {
          console.error('Errore nel recupero dei contenuti', err);
          reject(err);  // Rifiuta la promessa in caso di errore
        }
      });
    });

  }

  async viewMatching(): Promise<void> {
    this.listOfMatchingReports = [];
    let jsonReport;

    let returnlist = await this.lawyerService.verifyMatching(this.listOfAllReports);

    if (!returnlist){
      Swal.fire({
        title: "No report to see",
        text: "One cannot proceed. The keys cannot be retrieved",
      });
      return;
    }else{
      for(const report of returnlist){

        console.log(report)

        const reportObject: ReportToView = {
          UuidReport: report.UuidReport,
          User: report.user,
          EmailPerpetrator: report.perpetratorData.email || 'No Email',
          TelephoneNumberPerpetrator: report.perpetratorData.telephoneNumber || 'No Telephone Number ',
          SocialMediaURL:  report.perpetratorData.socialMediaUrl || 'No  Social Media URL',
          Details: report.details || 'No details',
        };


        this.listOfMatchingReports.push(reportObject);
      }
    }
}


//   async onReportClick(report: any): Promise<void> {
//     this.listOfMatchingReports = [];

//     this.selectedReport = report;
//     let jsonReport;
//     let returnlist = await this.lawyerService.verifyMatching(this.listOfAllReports,this.selectedReport);
//     if (!returnlist){
//       Swal.fire({
//         icon: "error",
//         title: "Oops...",
//         text: "One cannot proceed. The key cannot be retrieved",
//       });
//       return;
//     }else{
//       for(const report of returnlist){
//         console.log(report)
//         jsonReport = JSON.parse(report);

//         const reportObject: ReportToView = {
//           UuidReport: jsonReport.UuidReport,
//           User: jsonReport.user,
//           EmailPerpetrator: jsonReport.perpetratorData.email || 'No Email',
//           TelephoneNumberPerpetrator: jsonReport.perpetratorData.telephoneNumber || 'No Telephone Number ',
//           SocialMediaURL:  jsonReport.perpetratorData.socialMediaUrl || 'No  Social Media URL',
//           Details: jsonReport.details || 'No details',
//         };


//         this.listOfMatchingReports.push(reportObject);
//       }


//     }
// }

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
