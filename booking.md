Descripción

ESPECIFICACIÓN DE APLICACIÓN: Koru Booking
1. Resumen Funcional (Contexto)
Koru Booking es un sistema completo de gestión de citas diseñado para integrarse en la tienda online. Permite a los clientes reservar servicios (clases, consultas, alquileres) en tiempo real, basándose en la disponibilidad configurada por el comercio.
Diferenciador Clave (vs Widgets simples):
Gestión de Agenda: El dueño de la tienda tiene un panel para ver quién reservó.
Lógica de Slots: Calcula huecos disponibles basándose en la duración del servicio + tiempos de preparación (buffer).
Notificaciones: Envía correos de confirmación tanto al cliente como al administrador.
2. Ficha Técnica
ID del Proyecto: `koru-app-booking`
Tipo: App Híbrida (Panel Admin React + Frontend Widget).
Dependencias: * Admin: `@redclover/koru-react-sdk` (Para configurar servicios y horarios). * Storefront: `@redclover/koru-sdk` (El widget que ve el cliente).
Base de Datos: MongoDB / PostgreSQL (Provista por la App, no por Koru).
Integraciones V1: Email (SMTP/SendGrid). Google Calendar Sync (Fase 2).
3. Esquema de Configuración (Admin Panel)
Al ser una App Externa, la configuración no es una simple lista de campos laterales. Es un Dashboard embebido en Koru.

3.1. Gestión de Servicios (`services`)
El usuario debe poder crear N servicios.
Nombre: (Ej. "Corte de Pelo", "Consultoría SEO").
Duración: Minutos (Ej. 30, 60, 90).
Precio: (Opcional, solo display en V1).
Buffer: Tiempo de descanso post-servicio (Ej. 10 min para limpiar).
Imagen: URL del icono o foto.
3.2. Horarios de Atención (`weekly_schedule`)
Matriz de disponibilidad semanal.
Días: Lunes a Domingo (Toggle ON/OFF).
Franjas: Hora Inicio - Hora Fin.
Breaks: Opción de agregar "Hora de Almuerzo" (pausa bloqueada).
3.3. Configuración del Widget (`widget_settings`)
ID Campo	Etiqueta	Tipo	Default	Descripción
:---	:---	:---	:---	:---
`layout`	Diseño	Select	`List` (Lista Vertical), `Grid` (Tarjetas), `Button` (Modal)	`List`
`step_interval`	Intervalo Visual	Number	15, 30, 60 (min)	30	Cada cuánto mostrar slots en el calendario.
`accent_color`	Color Principal	Color	`#00C896`	Botones y fechas seleccionadas.
`notify_email`	Email Avisos	Email	(Admin Email)	Donde llegan las alertas de nueva reserva.
4. Lógica de Negocio (Backend API)
La app debe exponer una API REST que el Widget consumirá.

4.1. Algoritmo de Disponibilidad (`GET /slots`)
Este es el corazón de la app.
Input: `ServiceId`, `Date` (YYYY-MM-DD).
Lógica:
1. Recuperar el horario comercial de ese día (Ej. 09:00 a 18:00).
2. Recuperar todas las `reservas` ya existentes para esa fecha en la DB.
3. Generar "Time Slots" basados en la `duration` del servicio.
4. Filtrado: * Si `Slot_Start` coincide con una reserva existente -> Descartar. * Si `Slot_End` supera la hora de cierre -> Descartar. * Si `Now` > `Slot_Start` (es pasado) -> Descartar.
Output: Array JSON `['09:00', '09:30', '14:00']`.
4.2. Creación de Reserva (`POST /bookings`)
Validación Atómica: Antes de guardar, verificar de nuevo si el slot sigue libre (para evitar conflictos si dos personas clickean a la vez).
Persistencia: Guardar `{ customer_name, email, service_id, date, time, status: 'confirmed' }`.
Trigger: Disparar emails de confirmación.
5. Especificación de Interfaz (Frontend Widget)
El widget en la tienda (`koru-sdk`) funciona como una SPA (Single Page Application) pequeña dentro de un `div`.

5.1. Flujo de Pasos (Wizard UX)
Paso 1: Selección de Servicio
Lista de servicios disponibles con duración y precio.
Al hacer click -> Guarda `selectedService` -> Pasa al Paso 2.
Paso 2: Calendario y Hora
Izquierda: Mini calendario (Datepicker). Días sin disponibilidad (feriados/findes) deshabilitados visualmente.
Derecha: Lista de "burbujas" con las horas disponibles (`GET /slots`).
Al seleccionar hora -> Pasa al Paso 3.
Paso 3: Datos del Cliente
Formulario simple validado.
Campos: Nombre (Req), Email (Req), Teléfono (Opc), Notas.
Botón: "Confirmar Reserva".
Paso 4: Éxito
Pantalla de confirmación con resumen.
Botón "Añadir a mi Calendario" (Link .ics o Google Calendar).
5.2. Estados de Carga
Como el widget consulta al backend en tiempo real (para no vender un horario ocupado), debe mostrar Spinners claros al cambiar de día en el calendario.
5.3. Modo Móvil
En desktop puede ser un layout de 2 columnas (Calendario | Horas).
En móvil debe colapsar a una sola columna vertical para facilidad de uso táctil.
6. Checklist de Entrega (QA)
El equipo de desarrollo debe validar:

1. [ ] Test de Conflicto: Abrir dos navegadores en el mismo horario/servicio. Reservar en A. Intentar reservar en B inmediatamente. B debe recibir error: "Lo sentimos, este horario acaba de ser ocupado".
2. [ ] Test de Buffer: Si el servicio dura 60 min y tiene 15 min de buffer. Si reservo a las 10:00 (termina 11:00), el slot de las 11:00 NO debe estar disponible (por el buffer). El siguiente libre debe ser 11:15.
3. [ ] Timezone: Verificar que si el cliente está en España y la tienda en México, las horas se muestren en la zona horaria del cliente (o aclarar explícitamente la zona horaria de la tienda). Para v1: Se recomienda mostrar todo en horario de la tienda con un aviso claro.
4. [ ] Email Trigger: Verificar que llegue el correo de confirmación en menos de 1 minuto.

