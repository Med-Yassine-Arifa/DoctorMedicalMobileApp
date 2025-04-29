import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-appointment-book',
  templateUrl: './appointment-book.page.html',
  styleUrls: ['./appointment-book.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule]
})
export class AppointmentBookPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
