import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentBookPage } from './appointment-book.page';

describe('AppointmentBookPage', () => {
  let component: AppointmentBookPage;
  let fixture: ComponentFixture<AppointmentBookPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AppointmentBookPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
