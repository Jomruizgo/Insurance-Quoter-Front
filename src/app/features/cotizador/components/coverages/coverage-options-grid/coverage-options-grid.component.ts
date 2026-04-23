import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoverageOption } from '../../../models/coverage.model';
import { CoverageCardComponent } from '../coverage-card/coverage-card.component';

@Component({
  selector: 'app-coverage-options-grid',
  standalone: true,
  imports: [CommonModule, CoverageCardComponent],
  templateUrl: './coverage-options-grid.component.html',
  styleUrl: './coverage-options-grid.component.scss',
})
export class CoverageOptionsGridComponent {
  @Input() coverageOptions: CoverageOption[] = [];
  @Output() coverageChanged = new EventEmitter<CoverageOption>();

  onCardChanged(updated: CoverageOption): void {
    this.coverageChanged.emit(updated);
  }
}
