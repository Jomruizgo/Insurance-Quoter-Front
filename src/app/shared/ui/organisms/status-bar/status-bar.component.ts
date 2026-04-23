import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusBadgeComponent } from '../../atoms/status-badge/status-badge.component';
import { SparklineComponent } from '../../atoms/sparkline/sparkline.component';
import { QuoteState } from '../../../../core/models/folio.model';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, SparklineComponent],
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
})
export class StatusBarComponent {
  @Input() state!: QuoteState;
}
