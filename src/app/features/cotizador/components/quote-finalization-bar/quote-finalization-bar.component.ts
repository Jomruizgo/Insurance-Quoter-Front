import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BtnComponent } from '../../../../shared/ui/atoms/btn/btn.component';

@Component({
  selector: 'app-quote-finalization-bar',
  standalone: true,
  imports: [CommonModule, BtnComponent],
  templateUrl: './quote-finalization-bar.component.html',
  styleUrl: './quote-finalization-bar.component.scss',
})
export class QuoteFinalizationBarComponent {
  @Input({ required: true }) calculatedAt!: string;
  @Input() submitEnabled = false;
  @Input() accepting = false;
  @Output() accept = new EventEmitter<void>();
  @Output() downloadPdf = new EventEmitter<void>();
}
