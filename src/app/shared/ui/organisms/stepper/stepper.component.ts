import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';
import { QuoteState, SectionStatus } from '../../../../core/models/folio.model';
import { QUOTE_STEPS } from './stepper.steps';

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
})
export class StepperComponent {
  @Input() folio: string = '';
  @Input() sections!: QuoteState['sections'];
  @Input() activeRoute: string = '';
  @Output() stepClick = new EventEmitter<string>();

  private readonly router = inject(Router);

  readonly steps = QUOTE_STEPS;

  getStepIndex(route: string): number {
    return this.steps.findIndex(s => s.route === route);
  }

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }

  statusOf(key: keyof QuoteState['sections']): SectionStatus {
    return this.sections?.[key] ?? 'PENDING';
  }

  stepNumber(index: number): number {
    return index + 1;
  }

  navigate(route: string): void {
    this.stepClick.emit(route);
    this.router.navigate(['/quotes', this.folio, route]);
  }
}
