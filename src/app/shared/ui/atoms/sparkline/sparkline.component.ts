import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { clampPct } from './sparkline.utils';

@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sparkline.component.html',
  styleUrl: './sparkline.component.scss'
})
export class SparklineComponent {
  @Input() pct: number = 0;
  @Input() height: number = 4;

  get clampedPct(): number {
    return clampPct(this.pct);
  }
}
