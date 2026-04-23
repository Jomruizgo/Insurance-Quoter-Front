import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationSummaryItem } from '../../../models/location.model';
import { CoverageOption } from '../../../models/coverage.model';
import { BtnComponent } from '../../../../../shared/ui/atoms/btn/btn.component';

@Component({
  selector: 'app-location-tab-selector',
  standalone: true,
  imports: [CommonModule, BtnComponent],
  templateUrl: './location-tab-selector.component.html',
  styleUrl: './location-tab-selector.component.scss',
})
export class LocationTabSelectorComponent {
  @Input() locations: LocationSummaryItem[] = [];
  @Input() activeIndex: number = 1;
  @Input() coverageOptions: CoverageOption[] = [];
  @Output() tabSelected = new EventEmitter<number>();
  @Output() applyToAll = new EventEmitter<void>();

  get activeCount(): number {
    return this.coverageOptions.filter(opt => opt.selected).length;
  }

  get totalCount(): number {
    return this.coverageOptions.length;
  }

  get isApplyToAllDisabled(): boolean {
    return this.locations.length <= 1;
  }

  onTabClick(index: number): void {
    this.tabSelected.emit(index);
  }

  onApplyToAll(): void {
    this.applyToAll.emit();
  }

  formatLocationLabel(index: number): string {
    return `UBIC ${String(index).padStart(2, '0')}`;
  }
}
