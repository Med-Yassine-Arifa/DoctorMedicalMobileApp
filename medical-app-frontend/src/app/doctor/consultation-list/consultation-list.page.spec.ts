import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsultationListPage } from './consultation-list.page';

describe('ConsultationListPage', () => {
  let component: ConsultationListPage;
  let fixture: ComponentFixture<ConsultationListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultationListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
