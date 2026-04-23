import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SwitchComponent } from '../../../../../shared/ui/atoms/switch/switch.component';
import { BadgeComponent } from '../../../../../shared/ui/atoms/badge/badge.component';
import { CoverageOption } from '../../../models/coverage.model';

@Component({
  selector: 'app-coverage-card',
  standalone: true,
  imports: [CommonModule, FormsModule, SwitchComponent, BadgeComponent],
  templateUrl: './coverage-card.component.html',
  styleUrl: './coverage-card.component.scss',
})
export class CoverageCardComponent {
  @Input() coverage!: CoverageOption;
  @Output() changed = new EventEmitter<CoverageOption>();

  onToggle(value: boolean): void {
    this.changed.emit({ ...this.coverage, selected: value });
  }

  onDeductibleChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      this.changed.emit({ ...this.coverage, deductiblePercentage: value });
    }
  }

  onCoinsuranceChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      this.changed.emit({ ...this.coverage, coinsurancePercentage: value });
    }
  }
}
