# Carpeta `datos`

Contiene los ficheros que la óptica gestiona manualmente para mantener la tarifa actualizada y la configuración básica de la app offline.

- `tarifa.xlsx`: último Excel oficial cargado por el usuario.
- `tarifa.json`: representación en JSON que se utiliza internamente en modo offline.
- `config.json`: ajustes como el PIN (almacenado como hash) y metadatos de la tarifa vigente.
- `colores_marcas.json`: mapeo marca → color hexadecimal usado en la interfaz.

En producción estos ficheros residen en almacenamiento local del dispositivo (IndexedDB/LocalStorage) y se regeneran cada vez que se importa una tarifa nueva.
