import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorFormPage } from './doctor-form.page';

describe('DoctorFormPage', () => {
  let component: DoctorFormPage;
  let fixture: ComponentFixture<DoctorFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DoctorFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
