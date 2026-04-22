---
name: unit-testing
description: Genera tests unitarios e integración para backend y/o frontend. Lee la spec y el código implementado. Requiere spec APPROVED e implementación completa.
argument-hint: "<nombre-feature> [backend|frontend|ambos]"
---

# Unit Testing

## Definition of Done — verificar al completar

- [ ] Cobertura ≥ 80% en lógica de negocio (quality gate bloqueante)
- [ ] Tests aislados — sin conexión a DB real ni servicios externos (siempre mocks)
- [ ] Escenario feliz + errores de negocio + validaciones de entrada cubiertos
- [ ] Los cambios no rompen contratos existentes del módulo

## Prerequisito — Lee en paralelo

```
.claude/specs/<feature>.spec.md        (criterios de aceptación)
código implementado en los módulos correspondientes
.claude/rules/backend.md               (stack de test: JUnit 5 + Mockito + Spring Boot Test)
.claude/rules/frontend.md              (stack de test: Jasmine + Karma — solo lógica)
.claude/rules/testing.md               (principios AAA, pirámide, convenciones)
```

## Output por scope

### Backend → `Insurance-Quoter-Back/src/test/`

| Archivo | Cubre |
|---------|-------|
| `..../usecase/<Feature>UseCaseTest.java` | Lógica de negocio: happy path + errores + edge cases |
| `..../adapter/in/rest/<Feature>ControllerTest.java` | Endpoints: 200/201, 400, 404, 422, 409 |
| `..../adapter/out/persistence/<Feature>PersistenceAdapterTest.java` | Queries: parámetros y retornos correctos |

Framework: **JUnit 5** + **Mockito** + `@WebMvcTest` / `@DataJpaTest` / `@SpringBootTest`.

### Frontend → `Insurance-Quoter-Front/src/` (junto al código fuente, como `*.spec.ts`)

**Alcance estricto — solo lógica pura:**

| Archivo | Cubre |
|---------|-------|
| `<feature>/services/<feature>.service.spec.ts` | HTTP: happy path + 404 + 409 + 422 + 500 |
| `core/guards/<guard>.guard.spec.ts` | Acceso permitido + redirección + estado intermedio |
| `shared/pipes/<pipe>.pipe.spec.ts` | Valores válidos + límites + entradas inválidas |

**No se generan tests para:**
- ❌ Atoms, Molecules, Organisms (`*.component.ts`)
- ❌ Templates de layout
- ❌ Pages (componentes de ruta)
- ❌ Templates HTML (`.html`)

Framework: **Jasmine** + **Karma** (Angular default). Ver plantilla en `templates/service.spec.ts`.

## Patrones core

```java
// Backend — JUnit 5 + Mockito
@ExtendWith(MockitoExtension.class)
class FeatureUseCaseTest {

    @Mock
    private FeatureRepository featureRepository;

    @InjectMocks
    private FeatureUseCaseImpl featureUseCase;

    @Test
    void shouldCreate_whenValidData_thenReturnCreated() {
        // GIVEN
        when(featureRepository.save(any())).thenReturn(featureMock());

        // WHEN
        var result = featureUseCase.create(featureCreateMock());

        // THEN
        assertThat(result.getId()).isNotNull();
        verify(featureRepository).save(any(Feature.class));
    }
}
```

```typescript
// Frontend — Jasmine + Karma + Angular Testing
describe('FeatureService', () => {
  let service: FeatureService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatureService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(FeatureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should return data when request succeeds', () => {
    // GIVEN
    const mockResponse = { id: '1' };

    // WHEN
    service.getAll().subscribe(res => {
      // THEN
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/feature`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should propagate HTTP 404 error', () => {
    service.getAll().subscribe({ error: (err) => expect(err.status).toBe(404) });
    httpMock.expectOne(`${environment.apiUrl}/v1/feature`).flush(
      'Not found', { status: 404, statusText: 'Not Found' }
    );
  });
});
```

## Reglas

Ver `.claude/rules/testing.md` — AAA, aislamiento, determinismo, cobertura ≥ 80%.

## Restricciones

- Backend: solo `Insurance-Quoter-Back/src/test/`. No modificar código de producción.
- Frontend: solo archivos `*.spec.ts` junto al código fuente. No crear `__tests__/`.
- Nunca conectar a DB real ni servicios externos — siempre mocks.
- Frontend: nunca generar tests de componentes (atoms/molecules/organisms/templates/pages).
