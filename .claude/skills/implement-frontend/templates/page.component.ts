// src/app/features/<feature>/pages/<feature>.page.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { <Feature>Service } from '../services/<feature>.service';
import { <Model> } from '../models/<feature>.model';

@Component({
  selector: 'app-<feature>-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './<feature>.page.html',
  styleUrl: './<feature>.page.scss'
})
export class <Feature>Page implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly <feature>Service = inject(<Feature>Service);

  protected data$!: Observable<<Model>>;
  protected errorMessage = '';

  ngOnInit(): void {
    const folio = this.route.snapshot.paramMap.get('folio') ?? '';
    this.data$ = this.<feature>Service.getByFolio(folio);
  }
}
