# ResultadosScreen

## Objetivo
Mostrar la lista de lentes compatibles ordenada por coste €/día y agrupada por marca.

## Presentación
- Secciones por marca con color definido en `colores_marcas.json`.
- Cada tarjeta incluye nombre, pack, precio, €/día, €/mes, €/año.
- Acciones: `Añadir al comparador`, `Añadir al presupuesto`.

## Lógica
- Orden ascendente por `eurPerDayPair`.
- Máximo de tres productos marcados para comparar.
- Si no hay resultados, mostrar mensaje contextual y sugerir ajustes.
- Si la geometría solicitada no existe (p.ej. multifocal_torica diaria), sugerir alternativa mensual.

## Navegación
- `Comparar` → `ComparacionScreen` con IDs seleccionados.
- `Ver presupuesto` → `PresupuestoScreen`.
