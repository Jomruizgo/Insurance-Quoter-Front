import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationSummaryItem } from '../../../models/location.model';

@Component({
  selector: 'app-coverage-context-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coverage-context-bar.component.html',
  styleUrl: './coverage-context-bar.component.scss',
})
export class CoverageContextBarComponent {
  @Input() locationName: string = '';
  @Input() activeCount: number = 0;
  @Input() totalCount: number = 0;
  @Input() otherLocations: LocationSummaryItem[] = [];
  @Output() copyFrom = new EventEmitter<number>();

  get hasOtherLocations(): boolean {
    return this.otherLocations.length > 0;
  }

  onCopyFrom(event: Event): void {
    const index = parseInt((event.target as HTMLSelectElement).value, 10);
    if (!isNaN(index)) {
      this.copyFrom.emit(index);
    }
  }

  formatLocationLabel(location: LocationSummaryItem): string {
    return `UBIC ${String(location.index).padStart(2, '0')} · ${location.locationName}`;
  }
}
