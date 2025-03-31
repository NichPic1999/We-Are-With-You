import { Component } from '@angular/core';
import { AuthService } from '../../../shared/services/authentication/auth.service';

@Component({
  selector: 'app-home',
  standalone: false,

  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  showRegisterLawyerSection = false;
  showEmailSendsSection = false;
  isSidebarOpen: boolean = false;
  buttonsHidden: boolean = false;

  constructor(private authService:AuthService){}

  handleButtonClick() {
    this.buttonsHidden = true;  // Nascondi entrambi i bottoni
  }

  addSectionRegisterLawyer() {
    this.handleButtonClick();
    this.showRegisterLawyerSection = true;
  }

  sendEmails(){
    this.handleButtonClick();
    this.showEmailSendsSection = true;
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  onCloseRegisterLawyer(){
    this.showRegisterLawyerSection = false;
    this.buttonsHidden = false;
  }

  onCloseSendEmails(){
    this.showEmailSendsSection = false;
    this.buttonsHidden = false;
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
