import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';
import { TweaksPanelComponent } from '../tweaks-panel/tweaks-panel.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, TweaksPanelComponent],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  @Input() folioNumber?: string;
  @Input() userName: string = '';
  @Input() userRole: string = '';
}
