import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultationFormPage } from './consultation-form.page';

describe('ConsultationFormPage', () => {
  let component: ConsultationFormPage;
  let fixture: ComponentFixture<ConsultationFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultationFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
