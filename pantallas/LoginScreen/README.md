# LoginScreen

## Objetivo
Restringir el acceso a la app offline mediante un PIN numérico de 4 a 6 dígitos.

## Componentes clave
- Campo de entrada de PIN con enmascarado.
- Teclado numérico en pantalla optimizado para tablet.
- Estado de autenticación persistido en almacenamiento local seguro.

## Reglas
- Comparar el PIN introducido con `datos/config.json` (hash SHA-256).
- Tras 3 intentos fallidos mostrar aviso y bloquear 30 segundos.
- Si no existe tarifa cargada (`datos/tarifa.json` vacío) redirigir a `CargarTarifaScreen`.

## Eventos
- `onSubmit`: valida PIN → navega a `SeleccionCriteriosScreen`.
- `onForgotPin`: muestra instrucción para contacto con administrador.
