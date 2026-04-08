import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyFeeComponent } from './monthly-fee.component';

describe('MonthlyFeeComponent', () => {
  let component: MonthlyFeeComponent;
  let fixture: ComponentFixture<MonthlyFeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyFeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
