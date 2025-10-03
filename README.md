# Aplicacion de Presupuestos de Lentes de Contacto Offline

Esta especificacion tecnica describe la solucion prevista para generar presupuestos de lentes de contacto sin conexion utilizando una plataforma no-code/low-code (Lovable, Glide, AppSheet u otras exportables a codigo). El repositorio sirve como referencia funcional y documental para implementar o exportar la app.

## 1. Objetivo general
- Permitir a opticas crear presupuestos de lentes de contacto offline partiendo de una tarifa Excel.
- Ofrecer un flujo guiado desde login con PIN hasta la creacion del presupuesto y comparativa de productos.
- Facilitar la actualizacion anual de precios mediante la carga de un nuevo Excel.
- Mantener la logica de filtrado, calculo y comparacion en almacenamiento local para garantizar funcionamiento sin red.

## 2. Estructura del repositorio
| Ruta | Contenido | Notas |
| --- | --- | --- |
| `src/` | Implementacion React/Vite de referencia (UI, logica de precios y comparador). | Base funcional exportable desde Lovable. |
| `datos/` | Archivos gestionados por el usuario (`tarifa.xlsx`, `tarifa.json`, `config.json`, `colores_marcas.json`). | Persisten en almacenamiento local (IndexedDB/FS). |
| `pantallas/` | Documentacion por pantalla (Login, CargarTarifa, SeleccionCriterios, Resultados, Comparacion, Presupuesto). | Cada carpeta detalla componentes y reglas. |
| `logica/` | Guia de modulos (`parse_tarifa.ts`, `filtros.ts`, `calculos.ts`, `auth.ts`). | Referencia para codigo personalizado. |
| `assets/` | Recursos estaticos (imagenes y estilos). | Se cachean para uso offline. |
| `README.md` | Especificacion tecnica completa y pasos de despliegue. | Este documento. |

Los nuevos directorios permanecen sincronizados con la estructura conceptual sugerida para una herramienta low-code y facilitan exportaciones futuras.

## 3. Modelo de datos interno
La tabla principal `ProductosLentes` se genera a partir de `tarifa.xlsx` (representada localmente en `datos/tarifa.json`). Cada registro contiene:
- `id` (string): identificador unico o codigo interno.
- `modalidad` (string): diaria, semanal, mensual, trimestral, semestral, anual.
- `tipo` (string): esferica, torica, multifocal, multifocal_torica; se admiten extensiones como color.
- `marca` (string): fabricante (Alcon, Bausch & Lomb, CooperVision, Johnson & Johnson, etc.).
- `producto` (string): nombre comercial.
- `pack` (number): numero de lentes en la caja (30, 90, 12, 27, 3, 6, 12...).
- `precio` (number): PVP del pack.
- `codigo` (string, opcional): abreviatura unica.
- Campos opcionales: `material`, `notas`, `exclusiva`, `disponibilidad`.

Estructuras auxiliares:
- `PresupuestoActual`: array de lineas con `producto_id`, `ojo` (OD, OI, Ambos), `packs`, `precio_subtotal`, `notas`.
- `TarifaMetadata`: `{ anio: number, fecha_carga: ISODate, fuente: string }`.
- `Config`: `{ pin_hash: string, pin_hint: string, tarifa_version: string }` almacenado en `datos/config.json`.
- `ColoresMarca`: diccionario marca → color (ver `datos/colores_marcas.json`).

## 4. Flujo de navegacion
1. **LoginScreen**: valida PIN (4-6 digitos) contra `config.pin_hash`. Tras tres intentos fallidos aplica retardo de seguridad. Si no existe tarifa cargada, redirige a CargarTarifa.
2. **CargarTarifaScreen**: seleccion de archivo Excel/CSV, validacion de formato, parseo y actualizacion de `tarifa.json` + metadata. Si se completa, navega a SeleccionCriterios.
3. **SeleccionCriteriosScreen**: el usuario marca presbicia, astigmatismo ≥0.75, modalidad (diaria/semanal/mensual) y pack. Determina geometria objetivo y habilita busqueda cuando hay resultados disponibles.
4. **ResultadosScreen**: lista filtrada agrupada por marca con colores corporativos. Permite marcar hasta tres productos para comparar y añadir al presupuesto.
5. **ComparacionScreen**: compara coste €/dia, €/mes y €/año de hasta tres referencias, destaca mejor valor y muestra diferencia porcentual. Permite añadir cualquiera al presupuesto.
6. **PresupuestoScreen**: resumen de productos seleccionados, cantidades y total. Puede eliminar, ajustar cantidades y finalizar presupuesto (reiniciando flujo).
7. **Actualizacion anual**: accesible desde ajustes o boton dedicado; reutiliza CargarTarifa para sustituir el Excel.

El flujo se optimiza para tablet en punto de venta, funcionando totalmente offline tras la primera carga.

## 5. Logica de filtrado y calculo
### 5.1. Determinacion de geometria
- Presbicia + astigmatismo → `multifocal_torica`.
- Presbicia sin astigmatismo → `multifocal`.
- Sin presbicia + astigmatismo → `torica`.
- Caso base → `esferica`.

### 5.2. Cobertura de dias
Se calcula en `logica/calculos.ts` (ver implementacion actual en `src/utils/pricing.ts`). Tabla de reemplazo:

| Modalidad | Dias por lente |
| --- | --- |
| diaria | 1 |
| semanal | 14 (quincenal) |
| mensual | 30 |
| trimestral | 90 |
| semestral | 180 |
| anual | 365 |

`dias_cubiertos = (pack / 2) * dias_por_lente` (pack por ojo izquierdo y derecho).

### 5.3. Costes proyectados
```
eur_dia = precio_pack / dias_cubiertos

eur_mes = eur_dia * 30

eur_anio = eur_dia * 365
```
Los resultados se formatean con `Intl.NumberFormat('es-ES', 'EUR')`.

### 5.4. Ordenacion y comparacion
- Resultados ordenados ascendentemente por `eur_dia`.
- Comparacion destaca el valor minimo y muestra diferencia porcentual: `((comparado - mejor) / mejor) * 100`.
- Sugerencias automaticas: primero mismas marca/modalidad, luego alternativas cruzadas por proximidad de coste.

## 6. Formato requerido del Excel de tarifa
- Una hoja por modalidad: "DIARIAS", "SEMANALES" o "QUINCENALES", "MENSUALES" (y adicionales si aplica).
- Primera fila con cabeceras: `Modalidad`, `Tipo`, `Marca`, `Descripcion`, `PVP`, `Codigo`.
- Sin celdas combinadas ni elementos decorativos.
- Valores repetidos deben rellenarse en cada fila; si quedan vacios la app extrapola el ultimo valor no vacio.
- Precios como numeros con punto decimal o coma consistente.
- Codigos unicos por producto-pack (ej. PREC30, TOT90).
- Si falta una hoja, la app la crea vacia para evitar fallos, pero se recomienda incluirla.

Proceso de parseo (`logica/parse_tarifa.ts`):
1. Leer cada hoja esperada.
2. Normalizar cabeceras a minusculas sin acentos.
3. Propagar valores heredados (marca, tipo) hacia abajo when cells empty.
4. Generar registros `ProductosLentes` y escribir `datos/tarifa.json`.
5. Actualizar `TarifaMetadata` en `config.json`.

## 7. Consideraciones para plataforma no-code/low-code
- **Offline**: habilitar modo PWA e instalar en el dispositivo. La primera carga requiere conexion; los datos posteriores se sirven desde cache local (Service Worker) y almacenamiento interno.
- **Importacion de Excel**: si la plataforma no permite XLSX, solicitar CSV exportado. Alternativa: integrar libreria SheetJS al exportar a codigo React.
- **Autenticacion por PIN**: implementar como pantalla personalizada; evitar sistemas multiusuario nativos si no aportan valor.
- **Rendimiento**: validar que la plataforma soporte el numero total de filas (centenas). Utilizar filtros previos al renderizado y/o slices.
- **Sincronizacion**: cuando el dispositivo detecte red, puede enviar backups opcionales de `tarifa.json` y presupuestos cerrados a un backend; no es obligatorio para la operativa offline.
- **Seguridad**: almacenar `pin_hash` (SHA-256) y evitar exponer el PIN en texto plano. Limpiar datos sensibles al cerrar sesion.

## 8. Relacion con la implementacion React (`src/`)
El codigo en `src/` replica la logica descrita:
- `src/App.tsx`: orquesta filtros, resultados y comparador.
- `src/components/*`: componentes equivalentes a las pantallas low-code.
- `src/utils/pricing.ts`: calculos de dias y precios.
- `src/data/products.ts`: ejemplo de `tarifa.json` embebida.

Este prototipo sirve como referencia visual y de logica antes de migrar/interconectar con la herramienta low-code. Las funciones podran reutilizarse tras exportar Lovable a React.

## 9. Pasos operativos para el usuario final
1. Instalar la app como PWA en el dispositivo principal (tablet o portatil de la optica).
2. Configurar el PIN inicial en `config.json` (o a traves de pantalla de ajustes).
3. Cargar el Excel anual desde `CargarTarifaScreen`.
4. Utilizar el flujo de filtros, comparacion y presupuesto con pacientes.
5. Al finalizar cada presupuesto, comunicar el total y, si se desea, registrar el resultado externamente.
6. Repetir la carga del Excel cada vez que se actualicen precios (al menos una vez al año).

## 10. Roadmap y proximos pasos
- Implementar Service Worker y almacenamiento persistente para `tarifa.json`, `PresupuestoActual` y configuracion.
- Integrar un parser real de Excel (SheetJS) o flujo CSV dentro de la plataforma elegida.
- Añadir generacion opcional de PDF o envio por email cuando haya conexion.
- Incorporar registros de auditoria (fecha, usuario) para cada presupuesto finalizado.
- Evaluar soporte para multiples opticas (multi PIN) si se requieren perfiles diferenciados.

Con esta documentacion la app queda alineada con el requisito de contar con una especificacion tecnica clara que facilite su desarrollo en herramientas low-code y su funcionamiento offline.

## 11. Despliegue en GitHub Pages
1. Crea un repositorio en GitHub y sube el contenido del proyecto (excluyendo `dist/` si usas Git).
2. La accion `Deploy to GitHub Pages` (`.github/workflows/deploy.yml`) construye la app y publica la carpeta `dist/` automaticamente en cada push a `main`/`master`.
3. No necesitas ajustes locales para la ruta base: el workflow define `VITE_BASE_PATH=/<nombre_del_repo>/` y Vite lo consume desde `vite.config.ts`.
4. Si publicas en una pagina de usuario/organizacion (`usuario.github.io`), edita el workflow y define `VITE_BASE_PATH=/`.
5. Tras el primer despliegue, activa GitHub Pages apuntando a "GitHub Actions" y usa la URL resultante en Safari/iPad. Añádela a la pantalla de inicio para disfrutar del modo offline.
