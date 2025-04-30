import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllDoctorsPage } from './all-doctors.page';

describe('AllDoctorsPage', () => {
  let component: AllDoctorsPage;
  let fixture: ComponentFixture<AllDoctorsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AllDoctorsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
