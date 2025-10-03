# ComparacionScreen

## Objetivo
Comparar hasta tres productos simultáneamente para visualizar el coste de uso a distintos horizontes temporales.

## Contenido
- Tabla con columnas por producto y filas para `Precio pack`, `€/día (par)`, `€/mes (30d)`, `€/año (365d)`.
- Indicador de mejor valor (menor €/día).
- Diferencial porcentual frente al mejor.
- Botones "Añadir al presupuesto" por columna.

## Lógica
- Calcula métricas con utilidades de `logica/calculos.ts` basadas en modalidad y pack.
- Permite sustituir cualquier columna desde un selector global de productos.
- Ofrece sugerencias automáticas por marca/modalidad.

## Navegación
- `Añadir al presupuesto` → agrega producto y muestra confirmación.
- `Volver a resultados` → retorna a `ResultadosScreen` conservando selección previa.
