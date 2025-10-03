# Lógica de negocio

La lógica se implementa en la plataforma low-code mediante funciones personalizadas o, en la exportación React, como módulos TypeScript.

## Módulos previstos
- `parse_tarifa.ts`: transforma Excel/CSV en `tarifa.json`, normaliza campos y rellena valores heredados.
- `filtros.ts`: aplica los criterios seleccionados y devuelve listas agrupadas por marca.
- `calculos.ts`: calcula días cubiertos, coste por día/par, mes y año.
- `auth.ts`: valida el PIN y gestiona la sesión offline.

En este repositorio la implementación equivalente se encuentra en `src/utils/pricing.ts` y `src/components` mientras se concluye la migración al flujo low-code.
