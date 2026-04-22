import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatTone } from '../atoms.models';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  @Input() label!: string;
  @Input() value!: string;
  @Input() subtext?: string;
  @Input() tone: StatTone = 'neutral';

  get accentColor(): string {
    const map: Record<StatTone, string> = {
      brand:   'var(--brand-500)',
      info:    'var(--info)',
      neutral: 'var(--text-dim)',
    };
    return map[this.tone];
  }
}
