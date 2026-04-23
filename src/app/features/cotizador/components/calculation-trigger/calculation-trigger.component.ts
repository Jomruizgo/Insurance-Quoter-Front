import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent } from '../../../../shared/ui/atoms/badge/badge.component';
import { BtnComponent } from '../../../../shared/ui/atoms/btn/btn.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';

@Component({
  selector: 'app-calculation-trigger',
  standalone: true,
  imports: [CommonModule, BadgeComponent, BtnComponent, IconComponent],
  templateUrl: './calculation-trigger.component.html',
  styleUrl: './calculation-trigger.component.scss',
})
export class CalculationTriggerComponent {
  @Input() calculableCount = 0;
  @Input() incompleteCount = 0;
  @Input() calculating = false;
  @Output() calculate = new EventEmitter<void>();

  get isDisabled(): boolean {
    return this.calculableCount === 0 || this.calculating;
  }

  onCalculate(): void {
    this.calculate.emit();
  }
}
