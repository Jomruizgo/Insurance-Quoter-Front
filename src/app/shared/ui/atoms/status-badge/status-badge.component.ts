import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../badge/badge.component';
import { QuoteStatus, BadgeVariant } from '../atoms.models';

const STATUS_META: Record<QuoteStatus, { label: string; variant: BadgeVariant; dot: string }> = {
  CREATED:     { label: 'Creado',     variant: 'info',  dot: 'var(--info)' },
  IN_PROGRESS: { label: 'En proceso', variant: 'warn',  dot: 'var(--warn)' },
  CALCULATED:  { label: 'Calculado',  variant: 'ok',    dot: 'var(--ok)' },
  ISSUED:      { label: 'Emitido',    variant: 'brand', dot: 'var(--brand-500)' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, BadgeComponent],
  template: `
    <app-badge [variant]="meta.variant" [dot]="meta.dot">{{ meta.label }}</app-badge>
  `
})
export class StatusBadgeComponent {
  @Input() status!: QuoteStatus;

  get meta(): { label: string; variant: BadgeVariant; dot: string } {
    return STATUS_META[this.status] ?? { label: this.status, variant: '', dot: '' };
  }
}
