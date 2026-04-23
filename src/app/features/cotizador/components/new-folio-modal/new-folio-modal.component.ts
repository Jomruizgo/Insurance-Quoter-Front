import { Component, Input, Output, EventEmitter, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BtnComponent } from '../../../../shared/ui/atoms/btn/btn.component';
import { SelectComponent } from '../../../../shared/ui/atoms/select/select.component';
import { IconComponent } from '../../../../shared/ui/atoms/icon/icon.component';
import { FolioService } from '../../../../core/services/folio.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { Subscriber, Agent } from '../../../../core/models/catalog.model';

@Component({
  selector: 'app-new-folio-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BtnComponent, SelectComponent, IconComponent],
  templateUrl: './new-folio-modal.component.html',
  styleUrl: './new-folio-modal.component.scss',
})
export class NewFolioModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();
  @Output() folioCreated = new EventEmitter<string>();

  private readonly fb = inject(FormBuilder);
  private readonly folioService = inject(FolioService);
  private readonly catalogService = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected subscribers: Subscriber[] = [];
  protected allAgents: Agent[] = [];
  protected filteredAgents: Agent[] = [];
  protected isLoading = false;
  protected errorMessage = '';

  protected form = this.fb.group({
    subscriberId: ['', Validators.required],
    agentCode: ['', Validators.required],
  });

  ngOnInit(): void {
    this.catalogService.obtenerSuscriptores()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => (this.subscribers = list));

    this.catalogService.obtenerAgentes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(list => {
        this.allAgents = list;
        this.filterAgents(this.form.value.subscriberId ?? '');
      });

    this.form.get('subscriberId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => {
        this.form.patchValue({ agentCode: '' }, { emitEvent: false });
        this.filterAgents(id ?? '');
      });
  }

  private filterAgents(subscriberId: string): void {
    this.filteredAgents = subscriberId
      ? this.allAgents.filter(a => a.subscriberId === subscriberId)
      : [];
  }

  protected submit(): void {
    if (this.form.invalid || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = '';
    const { subscriberId, agentCode } = this.form.value;

    this.folioService.crearFolio(subscriberId!, agentCode!).subscribe({
      next: res => {
        this.isLoading = false;
        this.folioCreated.emit(res.folioNumber);
        this.closed.emit();
        this.router.navigate(['/cotizador', 'quotes', res.folioNumber, 'general-info']);
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.error ?? 'Error al crear el folio. Intente de nuevo.';
      },
    });
  }

  protected cancel(): void {
    this.form.reset();
    this.errorMessage = '';
    this.closed.emit();
  }
}
