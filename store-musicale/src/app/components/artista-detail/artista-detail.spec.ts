import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtistaDetail } from './artista-detail';

describe('ArtistaDetail', () => {
  let component: ArtistaDetail;
  let fixture: ComponentFixture<ArtistaDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtistaDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ArtistaDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
