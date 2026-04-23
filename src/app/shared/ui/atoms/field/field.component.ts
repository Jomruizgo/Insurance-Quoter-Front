import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './field.component.html',
  styleUrl: './field.component.scss'
})
export class FieldComponent {
  @Input() label?: string;
  @Input() required: boolean = false;
  @Input() help?: string;
  @Input() error?: string;
  @Input() span?: number;
}
