# Guía para usar Claude desde Warp — Proyecto Backend

Esta guía describe cómo trabajar con **Claude Code** dentro de la terminal
**Warp** sobre el backend de Contabilízate (.NET + CQRS con MediatR),
repartiendo el trabajo entre varios chats según el modelo más adecuado.
La idea es **gastar menos tokens** y aprovechar el modelo correcto para
cada tipo de tarea.

---

## 1. Estrategia de múltiples chats

Abre **un chat por modelo** y mantenlos vivos durante la jornada. Cada chat
acumula su propio contexto (y cache de prompt), así que conviene que cada
uno esté especializado.

| Chat                  | Modelo                                         | Para qué sirve                                    | Ejemplos backend                                                                                                                                                                                                  |
| --------------------- | ---------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#chat-haiku**       | `claude-haiku-4-5`                             | Tareas rápidas, mecánicas, de bajo riesgo         | Renombrar propiedad de un DTO, ajustar mensaje de un `Validator`, agregar un `using`, cambiar un `HttpStatusCode`, formatear un archivo, agregar un campo a un `record`                                           |
| **#chat-sonnet**      | `claude-sonnet-4-6`                            | Tareas medianas con lógica acotada                | Crear un Query+Handler+Validator nuevo, agregar un endpoint Minimal API, escribir tests unitarios de un Handler, mapeos AutoMapper/Mapster, agregar una migración EF Core simple                                  |
| **#chat-opus-medium** | `claude-opus-4-7` (potencia normal)            | Tareas largas pero acotadas                       | Implementar un Command completo con efectos secundarios (eventos, notificaciones), crear un módulo nuevo bajo `Application/<Dominio>/`, integrar un servicio externo (SAT, Stripe), refactor de un slice vertical |
| **#chat-opus-high**   | `claude-opus-4-7` con `/fast` o reasoning alto | Tareas extensas, arquitectura, debugging profundo | Rediseño de un bounded context, planear migración EF Core / .NET, depurar un bug que cruza varias capas, decidir estructura de proyectos en la solución, modelar transacciones distribuidas / outbox              |

> Consejo: **el modelo más barato que pueda hacer la tarea bien.**
> Si Haiku puede, no llames a Opus. Pero si la tarea cruza varios proyectos
> de la solución o toca infraestructura, súbele a Opus desde el inicio.

### Cuándo cambiar de chat

- El contexto del chat actual ya no es relevante a la nueva tarea → chat nuevo.
- La tarea cambió de nivel (ej. Haiku se atascó) → escala al siguiente.
- El chat lleva muchas horas y el contexto está lleno de ruido → arranca uno
  limpio con un resumen breve.

---

## 2. Cómo pasar contexto eficientemente (ahorrar tokens)

Claude lee archivos bajo demanda. **Tú decides qué leer.** Mientras más
preciso seas, menos tokens gasta.

### Sé explícito con rutas

Mal:

```
crea el endpoint de facturas
```

Bien:

```
En src/Api/Endpoints/InvoicesEndpoints.cs agrega un GET /invoices/pending/{rfc}
que mande GetPendingInvoicesByRfcQuery por IMediator. El Query y Handler
créalos en src/Application/Invoices/Queries/GetPendingInvoicesByRfc/.
No toques otros endpoints ni el DbContext.
```

### Indica el archivo Y la clase/método

- ✅ `src/Application/Taxpayers/Commands/CreateTaxpayer/CreateTaxpayerHandler.cs, método Handle`
- ✅ `src/Infrastructure/Persistence/AppDbContext.cs, OnModelCreating`
- ❌ "el handler de taxpayers"

### Carpetas donde se crean cosas nuevas

Dile a Claude _dónde_ debe crear archivos para que no invente rutas.
Estructura típica de una solución CQRS con MediatR:

Plantilla útil al iniciar una tarea:

```
Tarea: <qué quiero>
Archivos a leer: <lista>
Archivos a modificar: <lista>
Archivos nuevos a crear en: <ruta exacta>
No tocar: <lo que está fuera de alcance>
Tests a agregar/actualizar: <rutas>
```

### Pega solo lo necesario

- Snippet corto (<40 líneas) → pégalo en el prompt.
- Snippet largo → da la ruta + nombre de la clase/método.
- Evita pegar archivos completos si solo cambias 5 líneas.
- Para errores: pega **el stack trace literal**, no tu paráfrasis.

### Usa los chats como memoria

Si ya le explicaste a `#chat-opus-medium` la estructura de la solución,
no se la repitas; sigue ahí mismo. Si abres uno nuevo, empieza con un
**resumen de 3-5 líneas** del proyecto.

### Resumen de proyecto reutilizable (cópialo al abrir cada chat)

```
Proyecto: Contabilízate Backend (.NET 8/9, C#).
Arquitectura: Clean Architecture + CQRS con MediatR.
Capas: Domain (entidades/VOs/eventos), Application (Queries/Commands/Handlers/
Validators/Behaviors), Infrastructure (EF Core, repos, servicios externos),
Api (Minimal API endpoints que mandan IMediator.Send).
Validación: FluentValidation (un Validator por Request).
Persistencia: EF Core con AppDbContext. Migraciones en Infrastructure/Persistence/Migrations.
Resultado: cada Handler devuelve Result<T> (ok/fallo + payload), no excepciones de control de flujo.
```

---

## 3. Comandos útiles dentro del chat

- `Lee CLAUDE.md` — siempre, en chats nuevos, para que respete convenciones.
- `/clear` — limpia el chat (úsalo cuando cambies completamente de tarea).
- `/fast` — en Opus, acelera la salida sin perder modelo.
- `! <comando>` — ejecuta un comando local cuya salida queda en el chat
  (útil para `dotnet build`, `dotnet test`, `git diff`, `git log`).
- `/ultrareview` — review multi-agente de la rama actual antes de PR.

---

## 4. MediatR — patrón Request/Handler

MediatR implementa **CQRS**: cada operación es un mensaje (`Request`) que
un único `Handler` resuelve. Hay dos sabores:

- **Query** — lectura, no modifica estado. Devuelve datos.
  Ej. `GetTaxpayerByIdQuery`, `ListInvoicesByRfcQuery`.
- **Command** — escritura, modifica estado. Devuelve el resultado de la
  operación (no entidades grandes, solo lo necesario: id creado, `Unit`, etc.).
  Ej. `CreateTaxpayerCommand`, `UpdateInvoiceStatusCommand`.

### Convenciones del proyecto

- Sufijos obligatorios: `*Query` para lectura, `*Command` para escritura.
- **Un solo** `Handler` por Request.
- El Handler devuelve `Result<T>` (éxito/fallo + payload). **No** se usan
  excepciones como control de flujo.
- Validación previa con **FluentValidation**: un `Validator` por Request,
  enganchado por un `ValidationBehavior` en el pipeline de MediatR.
- Eventos de dominio se publican vía `IPublisher` (MediatR) dentro del
  mismo Handler (o desde la entidad y se despachan tras `SaveChanges`).
- Endpoints HTTP son finos: reciben el DTO/parametros, construyen el
  Request, hacen `IMediator.Send(...)` y mapean el `Result` a `IResult`
  HTTP (`Ok`, `BadRequest`, `NotFound`, `Created`).
- Pipeline de Behaviors recomendado (orden):
  `LoggingBehavior → ValidationBehavior → TransactionBehavior → UnhandledExceptionBehavior`.

### Estructura por operación (un folder por Request)

```
src/Application/Invoices/Queries/GetPendingInvoicesByRfc/
  GetPendingInvoicesByRfcQuery.cs       // record con los params + : IRequest<Result<List<InvoiceDto>>>
  GetPendingInvoicesByRfcHandler.cs     // IRequestHandler<Query, Result<List<InvoiceDto>>>
  GetPendingInvoicesByRfcValidator.cs   // AbstractValidator<Query>
  InvoiceDto.cs                          // (o en /Dtos si se reutiliza)
```

```
src/Application/Invoices/Commands/CreateInvoice/
  CreateInvoiceCommand.cs
  CreateInvoiceHandler.cs
  CreateInvoiceValidator.cs
```

### Cómo pedirle a Claude una operación nueva (plantilla)

```
Tarea: agregar endpoint para obtener facturas pendientes de un RFC.

Backend (.NET):
- Crear Query: GetPendingInvoicesByRfcQuery(string Rfc) : IRequest<Result<List<InvoiceDto>>>.
- Crear Handler en src/Application/Invoices/Queries/GetPendingInvoicesByRfc/.
  Inyectar IInvoiceRepository (read-only). Devolver Result.Success(list) o
  Result.Failure(Errors.Invoice.NotFoundForRfc).
- Crear Validator: RFC no vacío, longitud 12-13, formato válido (regex SAT).
- Exponer endpoint:
    GET /invoices/pending/{rfc}
  en src/Api/Endpoints/InvoicesEndpoints.cs, que haga
    var result = await mediator.Send(new GetPendingInvoicesByRfcQuery(rfc));
    return result.Match(Results.Ok, Results.BadRequest);
- Tests:
  - tests/Application.UnitTests/Invoices/Queries/GetPendingInvoicesByRfcHandlerTests.cs
    (happy path + RFC sin facturas + RFC inválido por Validator).
  - tests/Api.IntegrationTests/Invoices/GetPendingInvoicesByRfcTests.cs
    (200 con datos, 400 con RFC inválido).
- No tocar otros endpoints ni el DbContext salvo agregar el Include necesario.
```

### Anti-patrones a evitar (díselo a Claude explícitamente si hace falta)

- ❌ Handlers que llaman a otros Handlers directamente (acoplan).
- ❌ Lógica de dominio dentro del Handler — debe vivir en la entidad/servicio de dominio.
- ❌ `throw` para flujo esperado (RFC no encontrado, validación fallida) —
  usar `Result.Failure`.
- ❌ Endpoint con lógica de negocio — el endpoint solo orquesta `mediator.Send`.
- ❌ Un Handler que toca múltiples agregados sin transacción explícita.
- ❌ Queries que devuelven entidades de dominio — devolver **DTOs**.

---

## 5. Checklist al cerrar una tarea

Antes de aceptar el cambio que te dio Claude, valida:

1. ¿Tocó **solo** lo que pediste? (revisa el `git diff`).
2. ¿La Request está en su carpeta correcta (`Queries/<Nombre>/` o `Commands/<Nombre>/`)?
3. ¿Hay `Validator` y está cubierto por el `ValidationBehavior`?
4. ¿El Handler devuelve `Result<T>` y no lanza excepciones de control?
5. ¿El endpoint solo orquesta (`mediator.Send` + mapeo a `IResult`)?
6. ¿Se agregaron tests unitarios del Handler y, si aplica, de integración?
7. `dotnet build` y `dotnet test` pasan localmente.
8. Si tocó EF Core: ¿hay migración generada y revisada (`dotnet ef migrations add`)?
9. Si fue tarea de Haiku y quedó mal → reescala a Sonnet u Opus, no insistas
   con el mismo chat.

---

## 6. Tips finales para Warp

- **Un chat por modelo, no por tarea.** El contexto es oro: aprovecha la
  cache de prompt manteniendo el chat vivo.
- **Pestañas de Warp etiquetadas** (`haiku`, `sonnet`, `opus-med`, `opus-hi`).
- **Bloques de Warp** son útiles para copiar el output exacto de un comando
  (`dotnet build`, stack trace) y pegarlo en el chat correcto.
- Si una tarea **bloquea** un chat (Claude se confundió, gasta tokens en
  círculos), `/clear` o cierra y abre nuevo. No insistas.
- Para depurar errores de runtime: pega **stack trace completo + el Request
  que se mandó + el estado relevante de la BD**. Sin esos tres, Claude adivina.
- Para refactors grandes: pídele primero un **plan** en Opus high, revísalo,
  y luego ejecuta los pasos en Sonnet o Opus medium.

---

**Resumen ejecutivo**

> Haiku para lo trivial, Sonnet para Query/Command sencillos con tests,
> Opus normal para Commands con efectos secundarios o módulos nuevos,
> Opus high para arquitectura/debugging profundo. Pásale a Claude las
> rutas exactas y la carpeta donde crear cada artefacto. Todo pasa por
> MediatR: Request (Query/Command) + Handler + Validator + Result<T>,
> con endpoints finos que solo orquestan `mediator.Send`.
