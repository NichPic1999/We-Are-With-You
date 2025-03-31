import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MFauthenticationComponent } from './mfauthentication.component';

describe('MFauthenticationComponent', () => {
  let component: MFauthenticationComponent;
  let fixture: ComponentFixture<MFauthenticationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MFauthenticationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MFauthenticationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
