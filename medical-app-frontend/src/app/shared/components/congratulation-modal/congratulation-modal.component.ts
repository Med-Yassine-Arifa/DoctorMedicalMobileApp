import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-congratulation-modal',
  templateUrl: './congratulation-modal.component.html',
  styleUrls: ['./congratulation-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class CongratulationModalComponent {
  @Input() title: string = 'Congratulations 🎉';
  @Input() message: string = 'Your account is ready to use';
  @Input() buttonText: string = 'Back to Login';
  @Input() redirectUrl: string = '/auth/login';

  constructor(
    private modalController: ModalController,
    private router: Router
  ) {}

  dismiss() {
    this.modalController.dismiss();
    this.router.navigate([this.redirectUrl]);
  }
}
