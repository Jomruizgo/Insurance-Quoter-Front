import { TestBed } from '@angular/core/testing';
import { DashboardFilterService } from './dashboard-filter.service';
import { FolioSummary, DashboardFilters, DashboardStats } from '../models/folio-summary.model';

const FOLIOS: FolioSummary[] = [
  {
    folioNumber: 'FOL-2026-00001',
    client: 'Empresa Alfa SA de CV',
    agentCode: 'AGT-001',
    agentName: 'Carlos López',
    status: 'CREATED',
    locationCount: 1,
    completionPct: 10,
    commercialPremium: null,
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    folioNumber: 'FOL-2026-00002',
    client: 'Grupo Beta SRL',
    agentCode: 'AGT-002',
    agentName: 'María García',
    status: 'IN_PROGRESS',
    locationCount: 3,
    completionPct: 60,
    commercialPremium: 125000,
    updatedAt: '2026-04-21T09:00:00Z',
  },
  {
    folioNumber: 'FOL-2026-00003',
    client: 'Constructora Gama SA',
    agentCode: 'AGT-003',
    agentName: 'Roberto Díaz',
    status: 'CALCULATED',
    locationCount: 5,
    completionPct: 85,
    commercialPremium: 340000,
    updatedAt: '2026-04-19T14:30:00Z',
  },
  {
    folioNumber: 'FOL-2026-00004',
    client: 'Inmobiliaria Delta SC',
    agentCode: 'AGT-001',
    agentName: 'Carlos López',
    status: 'ISSUED',
    locationCount: 2,
    completionPct: 100,
    commercialPremium: 87500,
    updatedAt: '2026-04-18T11:00:00Z',
  },
  {
    folioNumber: 'FOL-2026-00005',
    client: 'Manufactura Épsilon SA de CV',
    agentCode: 'AGT-004',
    agentName: 'Laura Méndez',
    status: 'IN_PROGRESS',
    locationCount: 4,
    completionPct: 45,
    commercialPremium: null,
    updatedAt: '2026-04-22T08:00:00Z',
  },
];

describe('DashboardFilterService', () => {
  let service: DashboardFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ────────────────── filterFolios ──────────────────

  describe('filterFolios()', () => {
    it('should filter by folioNumber text case-insensitively', () => {
      // GIVEN
      const filters: DashboardFilters = { searchText: 'fol-2026-00002', statusFilter: 'ALL' };

      // WHEN
      const result = service.filterFolios(FOLIOS, filters);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].folioNumber).toBe('FOL-2026-00002');
    });

    it('should filter by client text case-insensitively', () => {
      // GIVEN
      const filters: DashboardFilters = { searchText: 'grupo beta', statusFilter: 'ALL' };

      // WHEN
      const result = service.filterFolios(FOLIOS, filters);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].client).toBe('Grupo Beta SRL');
    });

    it('should filter by exact status', () => {
      // GIVEN
      const filters: DashboardFilters = { searchText: '', statusFilter: 'IN_PROGRESS' };

      // WHEN
      const result = service.filterFolios(FOLIOS, filters);

      // THEN
      expect(result.length).toBe(2);
      result.forEach(f => expect(f.status).toBe('IN_PROGRESS'));
    });

    it('should return all folios when statusFilter is ALL', () => {
      // GIVEN
      const filters: DashboardFilters = { searchText: '', statusFilter: 'ALL' };

      // WHEN
      const result = service.filterFolios(FOLIOS, filters);

      // THEN
      expect(result.length).toBe(FOLIOS.length);
    });

    it('should apply text and status filters cumulatively (AND logic)', () => {
      // GIVEN — two IN_PROGRESS folios but only one matches "beta"
      const filters: DashboardFilters = { searchText: 'beta', statusFilter: 'IN_PROGRESS' };

      // WHEN
      const result = service.filterFolios(FOLIOS, filters);

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].folioNumber).toBe('FOL-2026-00002');
    });

    it('should return all folios when searchText is empty and statusFilter is ALL', () => {
      // GIVEN
      const filters: DashboardFilters = { searchText: '', statusFilter: 'ALL' };

      // WHEN
      const result = service.filterFolios(FOLIOS, filters);

      // THEN
      expect(result.length).toBe(FOLIOS.length);
    });

    it('should return empty array when no folio matches', () => {
      // GIVEN
      const filters: DashboardFilters = { searchText: 'NONEXISTENT', statusFilter: 'ALL' };

      // WHEN
      const result = service.filterFolios(FOLIOS, filters);

      // THEN
      expect(result.length).toBe(0);
    });
  });

  // ────────────────── computeStats ──────────────────

  describe('computeStats()', () => {
    it('should calculate total as folios.length', () => {
      // WHEN
      const stats: DashboardStats = service.computeStats(FOLIOS);

      // THEN
      expect(stats.total).toBe(5);
    });

    it('should calculate inProgress counting only IN_PROGRESS status', () => {
      // WHEN
      const stats: DashboardStats = service.computeStats(FOLIOS);

      // THEN
      expect(stats.inProgress).toBe(2); // FOL-00002 + FOL-00005
    });

    it('should calculate readyToIssue as sum of CALCULATED and ISSUED', () => {
      // WHEN
      const stats: DashboardStats = service.computeStats(FOLIOS);

      // THEN
      expect(stats.readyToIssue).toBe(2); // FOL-00003 (CALCULATED) + FOL-00004 (ISSUED)
    });

    it('should sum commercialPremium ignoring null values', () => {
      // GIVEN: FOL-00001 null, FOL-00002 125000, FOL-00003 340000, FOL-00004 87500, FOL-00005 null
      // WHEN
      const stats: DashboardStats = service.computeStats(FOLIOS);

      // THEN
      expect(stats.accumulatedPremium).toBe(125000 + 340000 + 87500); // 552500
    });

    it('should return zero accumulatedPremium when all premiums are null', () => {
      // GIVEN
      const noPremiumFolios = FOLIOS.map(f => ({ ...f, commercialPremium: null }));

      // WHEN
      const stats = service.computeStats(noPremiumFolios);

      // THEN
      expect(stats.accumulatedPremium).toBe(0);
    });

    it('should return zero stats for empty folios array', () => {
      // WHEN
      const stats = service.computeStats([]);

      // THEN
      expect(stats.total).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.readyToIssue).toBe(0);
      expect(stats.accumulatedPremium).toBe(0);
    });
  });
});
