import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs,} from '@ionic/angular/standalone';
import {RouterLink} from "@angular/router";
import {addIcons} from "ionicons";
import {fileTrayFullOutline,  homeOutline, logOutOutline, calendarOutline , notificationsOutline} from "ionicons/icons";
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonTabBar, IonTabButton, IonIcon, IonTabs, IonLabel, RouterLink]
})
export class TabsPage implements OnInit {

  constructor() {
    addIcons({
      fileTrayFullOutline,
      homeOutline,
      logOutOutline,
      calendarOutline,
      notificationsOutline

    })
  }

  ngOnInit() {
  }

}
