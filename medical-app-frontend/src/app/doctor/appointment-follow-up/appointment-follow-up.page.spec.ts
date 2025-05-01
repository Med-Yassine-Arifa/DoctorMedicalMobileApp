import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentFollowUpPage } from './appointment-follow-up.page';

describe('AppointmentFollowUpPage', () => {
  let component: AppointmentFollowUpPage;
  let fixture: ComponentFixture<AppointmentFollowUpPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentFollowUpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
