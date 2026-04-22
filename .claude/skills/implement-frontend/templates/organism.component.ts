// src/app/shared/ui/organisms/<name>/<name>.component.ts
// Or: src/app/features/<feature>/components/<name>/<name>.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-<name>',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './<name>.component.html',
  styleUrl: './<name>.component.scss'
})
export class <Name>Component {
  @Input() data!: <Model>;
  @Output() action = new EventEmitter<<OutputType>>();

  onAction(value: <OutputType>): void {
    this.action.emit(value);
  }
}
