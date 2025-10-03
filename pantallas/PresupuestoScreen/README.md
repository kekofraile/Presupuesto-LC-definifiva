# PresupuestoScreen

## Objetivo
Resumir los productos añadidos al presupuesto actual y calcular el total para comunicación al paciente.

## Contenido
- Lista de líneas con producto, modalidad, cantidad de packs, ojos cubiertos, subtotal.
- Total acumulado destacado.
- Acciones: eliminar línea, ajustar cantidad, finalizar presupuesto.

## Lógica
- Cada adición desde resultados/comparación crea una entrada con cantidad inicial 1.
- Permite duplicar entradas para ojo derecho/izquierdo si se diferencian.
- Guarda el presupuesto temporal en almacenamiento local para recuperar tras reinicios.
- `Finalizar` limpia el carrito y registra fecha/hora en un log local opcional.

## Navegación
- `Seguir añadiendo` → vuelve a `ResultadosScreen`.
- `Finalizar` → retorna a `SeleccionCriteriosScreen` y resetea filtros si se desea.
