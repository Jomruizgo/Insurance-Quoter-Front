import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FolioSummary } from '../../models/folio-summary.model';
import { StatusBadgeComponent } from '../../../../shared/ui/atoms/status-badge/status-badge.component';
import { SparklineComponent } from '../../../../shared/ui/atoms/sparkline/sparkline.component';

@Component({
  selector: 'app-folio-summary-grid',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, StatusBadgeComponent, SparklineComponent],
  templateUrl: './folio-summary-grid.component.html',
  styleUrl: './folio-summary-grid.component.scss',
})
export class FolioSummaryGridComponent {
  @Input() folios: FolioSummary[] = [];
  @Output() folioClick = new EventEmitter<string>();

  protected onCardClick(folioNumber: string): void {
    this.folioClick.emit(folioNumber);
  }
}
