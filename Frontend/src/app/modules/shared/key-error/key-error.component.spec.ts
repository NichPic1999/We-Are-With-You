import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyErrorComponent } from './key-error.component';

describe('KeyErrorComponent', () => {
  let component: KeyErrorComponent;
  let fixture: ComponentFixture<KeyErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KeyErrorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KeyErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
