import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FolioSummary } from '../../models/folio-summary.model';
import { StatusBadgeComponent } from '../../../../shared/ui/atoms/status-badge/status-badge.component';
import { SparklineComponent } from '../../../../shared/ui/atoms/sparkline/sparkline.component';

@Component({
  selector: 'app-folio-summary-table',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, StatusBadgeComponent, SparklineComponent],
  templateUrl: './folio-summary-table.component.html',
  styleUrl: './folio-summary-table.component.scss',
})
export class FolioSummaryTableComponent {
  @Input() folios: FolioSummary[] = [];
  @Output() folioClick = new EventEmitter<string>();

  protected onRowClick(event: MouseEvent, folioNumber: string): void {
    const target = event.target as HTMLElement;
    // Do not navigate when clicking checkbox or options button
    if (target.closest('.folio-table__checkbox') || target.closest('.folio-table__options-btn')) {
      return;
    }
    this.folioClick.emit(folioNumber);
  }
}
