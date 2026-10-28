# VetCare Frontend — Integración

## Requisitos
Node 20+; React/Vite + Axios + Tailwind v4. Backend local en `http://localhost:8080` con la base `vetcare_mejoras` y su `JWT_SECRET` configurado.

## Arranque
```bash
npm install
npm run dev
```
Visitar `http://localhost:5173/login`.

## Integración
Axios utiliza `/api` mediante `VITE_API_URL` (`src/lib/api.js`), con token JWT de sesión. La configuración CORS del backend admite `http://localhost:5173` por defecto.

## Flujos incluidos
- Acceso por JWT y menú según rol.
- Listados de citas, mascotas, profesionales, atenciones y consulta de historia clínica.
- Crear y reprogramar citas; confirmar y cancelar según rol y estado.
- Registrar atención clínica (requiere cita `CONFIRMADA`, ID de historia clínica correspondiente y veterinario permitido). El backend cambia el estado a `ATENDIDA`.
- Listados administrativos de usuarios y propietarios (solo ADMIN).

## Limitaciones honestas
- Formularios avanzados de alta/edición de mascotas, usuarios y veterinarios **no incluidos** en esta entrega.
- La selección de historia clínica aún solicita ID; se puede mejorar con un selector tras verificar permisos.
- No se incluye PDF, inventario, reportes ni calendario completo porque no están respaldados por los controladores verificados.
- No se ha comprobado la conexión real con tu base local; ejecutar pruebas de extremo a extremo.
- No colocar contraseñas ni JWT en código o repositorios.
