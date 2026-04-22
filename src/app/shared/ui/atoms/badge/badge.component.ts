import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeVariant } from '../atoms.models';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss'
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = '';
  @Input() dot?: string;
}
