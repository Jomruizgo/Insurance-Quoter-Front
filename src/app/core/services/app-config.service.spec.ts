import { TestBed } from '@angular/core/testing';
import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppConfigService);
    fetchSpy = spyOn(window, 'fetch');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load()', () => {
    it('should fetch /assets/config.json and store apiUrl and coreUrl', async () => {
      const mockConfig = { apiUrl: 'http://api.example.com', coreUrl: 'http://core.example.com' };
      fetchSpy.and.returnValue(
        Promise.resolve(new Response(JSON.stringify(mockConfig), { status: 200 }))
      );

      await service.load();

      expect(fetchSpy).toHaveBeenCalledWith('/assets/config.json');
      expect(service.apiUrl).toBe('http://api.example.com');
      expect(service.coreUrl).toBe('http://core.example.com');
    });

    it('should keep default values when fetch fails', async () => {
      fetchSpy.and.returnValue(Promise.reject(new Error('Network error')));

      await service.load();

      expect(service.apiUrl).toBe('http://localhost:8080');
      expect(service.coreUrl).toBe('http://localhost:8081');
    });
  });

  describe('apiUrl', () => {
    it('should return default apiUrl before load() is called', () => {
      expect(service.apiUrl).toBe('http://localhost:8080');
    });
  });

  describe('coreUrl', () => {
    it('should return default coreUrl before load() is called', () => {
      expect(service.coreUrl).toBe('http://localhost:8081');
    });
  });
});
