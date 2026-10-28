# QA visual aislada de Atenciones

Estas páginas montan los componentes reales con una fixture sintética exclusiva de pruebas. No llaman a la API, no acceden a sesiones personales ni escriben en PostgreSQL. No se incluyen en la entrada de producción de Vite.

Con el servidor de desarrollo iniciado, abrir:

- `/tests/visual/attentions.html`: tarjetas y detalle con diagnóstico/observaciones extensos y saltos de línea.
- `/tests/visual/attentions-mobile.html`: los mismos componentes dentro de un viewport de 390 × 780.

Comprobaciones realizadas en navegador:

- Apertura mediante «Ver detalle» y visualización íntegra del diagnóstico.
- Scroll interno para el contenido largo.
- Foco inicial en el cierre, Tab dentro del modal, cierre con Escape y retorno del foco al botón original.
- Distribución vertical de tarjetas y franja informativa en móvil.

Las fixtures no prueban el login ni las escrituras reales del formulario. Los filtros, relaciones, orden, roles, errores y edad histórica se verifican con `node --test tests/*.test.mjs`. La integración con datos de cada cuenta queda a cargo de los endpoints autorizados existentes.
