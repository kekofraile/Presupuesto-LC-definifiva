# CargarTarifaScreen

## Objetivo
Permitir importar la tarifa anual de lentes en formato Excel (.xlsx) o CSV para uso offline.

## Flujo
1. Botón "Seleccionar archivo" abre el selector con filtros `.xlsx`, `.xls`, `.csv`.
2. Vista previa con nombre de archivo y fecha de modificación.
3. Botón "Cargar" ejecuta `logica/parse_tarifa.ts` y actualiza `datos/tarifa.json`.
4. Actualiza `datos/config.json` con la nueva versión y fecha.
5. Mensaje de éxito y navegación a `SeleccionCriteriosScreen`.

## Validaciones
- Verificar estructura de columnas según especificación.
- Proporcionar mensajes de error amigables con guía sobre formato correcto.
- Si la app está offline y el archivo reside localmente, la carga continúa sin conexión.
