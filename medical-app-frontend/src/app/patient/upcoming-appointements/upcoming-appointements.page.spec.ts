import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpcomingAppointementsPage } from './upcoming-appointements.page';

describe('UpcomingAppointementsPage', () => {
  let component: UpcomingAppointementsPage;
  let fixture: ComponentFixture<UpcomingAppointementsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpcomingAppointementsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
