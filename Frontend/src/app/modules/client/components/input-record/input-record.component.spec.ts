import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputRecordComponent } from './input-record.component';

describe('InputRecordComponent', () => {
  let component: InputRecordComponent;
  let fixture: ComponentFixture<InputRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputRecordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
