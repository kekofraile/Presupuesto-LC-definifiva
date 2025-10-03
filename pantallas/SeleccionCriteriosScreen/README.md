# SeleccionCriteriosScreen

## Objetivo
Capturar las necesidades visuales del paciente para filtrar la tarifa localmente.

## Campos
- `presbicia`: toggle.
- `astigmatismo075`: toggle.
- `modalidad`: selector (Diaria, Semanal, Mensual; expandible).
- `pack`: chips dependientes de la modalidad.

## Lógica
- Determina la geometría (`esferica`, `torica`, `multifocal`, `multifocal_torica`).
- Consulta `ProductosLentes` en `datos/tarifa.json` filtrando por modalidad, geometría y pack.
- Habilita botón `Buscar` cuando existe al menos un resultado.

## Navegación
- `Buscar` → `ResultadosScreen` con filtros aplicados.
- `Actualizar tarifa` (opcional) → `CargarTarifaScreen`.
