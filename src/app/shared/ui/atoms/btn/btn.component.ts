import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconName, BtnVariant, BtnSize } from '../atoms.models';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './btn.component.html',
  styleUrl: './btn.component.scss'
})
export class BtnComponent {
  @Input() variant: BtnVariant = 'secondary';
  @Input() size?: BtnSize;
  @Input() iconLeft?: IconName;
  @Input() iconRight?: IconName;
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  get iconSize(): number {
    if (this.size === 'xs') return 12;
    if (this.size === 'sm') return 14;
    return 16;
  }
}
