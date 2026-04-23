import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DashboardFilters, ViewMode, QuoteStatus } from '../../models/folio-summary.model';
import { BtnComponent } from '../../../../shared/ui/atoms/btn/btn.component';

@Component({
  selector: 'app-folio-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BtnComponent],
  templateUrl: './folio-filters.component.html',
  styleUrl: './folio-filters.component.scss',
})
export class FolioFiltersComponent implements OnInit, OnChanges, OnDestroy {
  @Input() filters: DashboardFilters = { searchText: '', statusFilter: 'ALL' };
  @Input() viewMode: ViewMode = 'list';

  @Output() filtersChange = new EventEmitter<DashboardFilters>();
  @Output() viewModeChange = new EventEmitter<ViewMode>();

  protected form = new FormGroup({
    searchText: new FormControl<string>('', { nonNullable: true }),
    statusFilter: new FormControl<QuoteStatus | 'ALL'>('ALL', { nonNullable: true }),
  });

  private subscription?: Subscription;

  ngOnInit(): void {
    this.patchForm();
    this.subscription = this.form.valueChanges
      .pipe(debounceTime(200))
      .subscribe(value => {
        this.filtersChange.emit({
          searchText: value.searchText ?? '',
          statusFilter: (value.statusFilter ?? 'ALL') as QuoteStatus | 'ALL',
        });
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters'] && !changes['filters'].firstChange) {
      this.patchForm();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  protected setViewMode(mode: ViewMode): void {
    if (this.viewMode !== mode) {
      this.viewModeChange.emit(mode);
    }
  }

  private patchForm(): void {
    this.form.patchValue(
      { searchText: this.filters.searchText, statusFilter: this.filters.statusFilter },
      { emitEvent: false }
    );
  }
}
