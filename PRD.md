# Habita - Household Task Manager V2

## Overview

**Habita** es una aplicación de gestión de tareas del hogar diseñada para familias. Permite distribuir tareas de forma equitativa entre los miembros del hogar, con un sistema de gamificación que motiva la participación de todos, incluyendo niños y adolescentes.

## Core Value Proposition

- **Distribución justa de tareas** basada en capacidad, preferencias y disponibilidad
- **Gamificación completa** con niveles, XP, rachas, logros y recompensas
- **Colaboración familiar** con transferencias, ausencias y competencias
- **Inteligencia artificial** para recomendaciones y asistencia
- **Modo niños** con interfaz simplificada y motivadora

---

# Key Features

## 1. Gestión de Hogares y Miembros

### Creación de Hogar
- Registro del usuario creador
- Nombre del hogar personalizable
- Generación automática de código de invitación único (8 caracteres)
- Selección de tareas iniciales desde catálogo predefinido

### Tipos de Miembros
| Tipo | Capacidad | Descripción |
|------|-----------|-------------|
| adult | 100% | Adultos con capacidad completa |
| teen | 60% | Adolescentes (13-17 años) |
| child | 30% | Niños (menores de 13) |

### Unirse a un Hogar
- Ingreso de código de invitación
- Selección de nombre y tipo de miembro
- Validación de código existente

---

## 2. Sistema de Tareas

### Catálogo de Tareas Predefinidas

**7 categorías con tareas en español:**

| Categoría | Icono | Tareas |
|-----------|-------|--------|
| Limpieza | 🧹 | Barrer, Trapear, Aspirar, Limpiar baños, Limpiar ventanas, Sacar basura, Limpiar cocina |
| Cocina | 🍳 | Preparar desayuno/almuerzo/cena, Lavar platos, Ordenar despensa |
| Lavandería | 👕 | Lavar ropa, Tender ropa, Planchar, Doblar y guardar |
| Habitaciones | 🛏️ | Tender camas, Cambiar sábanas, Ordenar habitación, Ordenar closets |
| Exterior | 🌿 | Regar plantas, Cortar césped, Limpiar patio |
| Mascotas | 🐕 | Alimentar mascota, Pasear perro, Limpiar arenero |
| Otros | 📋 | Tareas personalizadas |

### Propiedades de Tarea
- **Nombre**: Identificador de la tarea
- **Categoría**: Una de las 7 categorías
- **Frecuencia**: daily | weekly | biweekly | monthly
- **Peso (Dificultad)**: 1-5 (determina puntos base)
- **Tiempo estimado**: En minutos
- **Edad mínima**: Restricción opcional por edad
- **Icono**: Emoji representativo

### Frecuencias y Multiplicadores
| Frecuencia | Multiplicador | Descripción |
|------------|---------------|-------------|
| daily | 1.5x | Tareas diarias |
| weekly | 1.0x | Tareas semanales |
| biweekly | 0.9x | Cada 2 semanas |
| monthly | 0.8x | Mensuales |

---

## 3. Sistema de Asignaciones

### Algoritmo de Asignación Inteligente

**Factores considerados:**
1. **Preferencias del miembro** (+20 preferidas, -20 no deseadas)
2. **Carga actual** (-5 por cada tarea pendiente)
3. **Recencia** (+1 por día desde última asignación de esa tarea)
4. **Capacidad por tipo** (adult: 1.0, teen: 0.6, child: 0.3)
5. **Edad mínima** (respeta restricciones de tarea)

### Estados de Asignación
- pending: Pendiente de completar
- completed: Completada

### Fechas de Vencimiento
- Calculadas automáticamente según frecuencia
- Marcador wasOverdue si se completa tarde

---

## 4. Sistema de Gamificación

### Niveles y XP
- **100 XP por nivel**
- XP ganado = peso × 10 × multiplicador_frecuencia
- Bonus por racha activa
- Bonus por completar a tiempo

### Sistema de Puntos
- Puntos base = peso × frecuencia_multiplicador × 10
- Bonus +20% si no está atrasada
- Bonus +10% por racha >= 3 días
- Se pueden canjear por recompensas

### Rachas (Streaks)
- **Racha actual**: Días consecutivos completando al menos 1 tarea
- **Mejor racha**: Récord personal
- Se reinicia si pasa un día sin completar tareas

### Logros (Achievements)

| Key | Nombre | Descripción | XP |
|-----|--------|-------------|----|
| first_task | Primera Tarea | Completa tu primera tarea | 10 |
| streak_7 | Semana Perfecta | Racha de 7 días | 50 |
| streak_30 | Mes Imparable | Racha de 30 días | 200 |
| early_bird | Madrugador | Completa antes de las 9am | 15 |
| night_owl | Búho Nocturno | Completa después de las 9pm | 15 |
| speed_demon | Rayo | Completa en menos de 5 min | 20 |
| helper | Ayudante | Acepta 5 transferencias | 30 |
| sacrifice | Sacrificio | Cede tarea preferida | 25 |
| perfectionist | Perfeccionista | 10 tareas sin atraso | 40 |
| balanced | Equilibrado | Todas las categorías | 35 |
| ten_tasks | Diez Tareas | 10 tareas completadas | 20 |
| fifty_tasks | Cincuenta | 50 tareas completadas | 100 |

### Recompensas
- Configurables por hogar
- Costo en puntos
- Estados: pending | fulfilled | cancelled
- Ejemplos: "Elegir película", "Postre especial", "Día libre"

---

## 5. Transferencias de Tareas

### Solicitud de Transferencia
- Máximo 3 transferencias por semana
- Tipos: points (por puntos) | exchange (intercambio)
- Mensaje opcional

### Estados
- pending: Esperando respuesta
- accepted: Aceptada (tarea reasignada)
- rejected: Rechazada

### Restricciones
- No se pueden transferir tareas ya atrasadas
- El receptor debe tener capacidad

---

## 6. Sistema de Ausencias

### Registro de Ausencia
- Fecha inicio y fin
- Razón: travel | illness | work | other
- Política de redistribución

### Políticas de Redistribución
| Política | Descripción |
|----------|-------------|
| auto | Distribución automática entre disponibles |
| specific | Asignar a miembro específico |
| postpone | Posponer tareas para el retorno |

### Compensación al Retorno
- Opción de recibir tareas extra al volver
- Balance de equidad

---

## 7. Competencias Familiares

### Crear Competencia
- Nombre de la competencia
- Duración: week | month | custom
- Premio opcional

### Leaderboard
- Puntos acumulados durante el período
- Actualización en tiempo real
- Medallas: 🥇🥈🥉

### Historial
- Competencias pasadas
- Ganadores y puntuaciones

---

## 8. Rotación de Tareas

### Configuración
- Seleccionar tarea
- Definir orden de miembros (JSON array)
- Frecuencia de rotación: weekly | monthly

### Funcionamiento
- Índice actual en la rotación
- Rotación automática en fecha configurada
- Siguiente miembro visible

---

## 9. Sistema de Penalidades

### Tipos de Penalidad
| Razón | Puntos Deducidos |
|-------|-----------------|
| overdue_24h | -5 puntos |
| overdue_48h | -10 puntos |
| overdue_72h | -20 puntos |
| transfer_failed | -5 puntos |

### Aplicación
- Automática via background function
- Historial visible en perfil

---

## 10. Estadísticas y Reportes

### Dashboard de Equidad
- **Puntuación de equidad** (0-100%)
- Barras de contribución por miembro
- Filtros: semana | mes | todo
- Tareas atrasadas por miembro

### Estadísticas del Hogar
- Total completadas/pendientes/atrasadas
- Tasa de puntualidad
- Ranking de miembros
- Desglose por categoría
- Destacados (más puntual, más puntos)

### Reporte Semanal
- Resumen de la semana
- MVP (más puntos)
- Desempeño individual
- Tendencias

---

## 11. Modo Niños

### Interfaz Simplificada
- Colores vibrantes (gradiente púrpura-azul)
- Iconos grandes
- Lenguaje simple ("Misiones" en lugar de "Tareas")
- Estrellas en lugar de puntos

### Elementos
- **Misiones del día**: Tareas pendientes para hoy
- **Estrellas**: Puntos disponibles
- **Logros**: Medallas desbloqueadas
- **Próximo premio**: Barra de progreso

### Acceso
- Toggle en header para usuarios child o teen
- Vista completa alternativa

---

## 12. Asistente IA

### Funcionalidad
- Preguntas sobre tareas del hogar
- Respuestas contextualizadas
- Preguntas sugeridas

### Ejemplos de Preguntas
- "¿Quién hizo más tareas esta semana?"
- "¿Cómo está la equidad del hogar?"
- "¿Qué tareas tengo pendientes?"

---

# Technical Architecture

## Database Schema (20+ Tables)

### Core Tables
- households - Hogares
- members - Miembros
- tasks - Tareas
- assignments - Asignaciones

### Preferences & Feedback
- memberPreferences - Preferencias de tarea
- assignmentFeedback - Feedback de completado

### Gamification
- memberLevels - Niveles y XP
- achievementDefinitions - Definiciones de logros
- memberAchievements - Logros desbloqueados
- householdRewards - Recompensas del hogar
- rewardRedemptions - Canjes de recompensas

### Collaboration
- taskTransfers - Transferencias
- memberAbsences - Ausencias

### Scheduling
- taskReminders - Recordatorios
- taskRotations - Rotaciones

### Competitions
- competitions - Competencias
- competitionScores - Puntuaciones

### History
- penalties - Penalidades
- aiRecommendations - Recomendaciones IA

### Catalog
- taskCatalog - Catálogo predefinido

---

## Server Functions (40+)

### Member Management
- getCurrentMember - Obtener miembro actual
- getHouseholdMembers - Listar miembros

### Household Management
- createHousehold - Crear hogar
- joinHousehold - Unirse con código
- createHouseholdWithTasks - Crear con tareas iniciales

### Task Management
- createTask - Crear tarea
- getTasks - Listar tareas
- getTaskCatalog - Catálogo predefinido

### Assignments
- getMyAssignments - Mis asignaciones
- completeAssignment - Completar simple
- completeAssignmentWithFeedback - Completar con feedback

### Gamification
- getMyProgress - Mi progreso
- getHouseholdRewards - Recompensas
- createReward - Crear recompensa
- redeemReward - Canjear

### Preferences
- setTaskPreference - Establecer preferencia
- getMyPreferences - Mis preferencias

### Statistics
- getHouseholdStats - Estadísticas básicas
- getFairnessDashboard - Dashboard de equidad
- getHouseholdStatistics - Estadísticas avanzadas
- getWeeklyReport - Reporte semanal
- getKidsView - Vista niños

### AI
- askHouseholdAssistant - Asistente IA

### Transfers
- requestTaskTransfer - Solicitar transferencia
- getPendingTransfers - Transferencias pendientes
- respondToTransfer - Responder
- cancelTransfer - Cancelar

### Absences
- createAbsence - Crear ausencia
- getMyAbsences - Mis ausencias
- deleteAbsence - Eliminar ausencia

### Penalties
- getMyPenalties - Mis penalidades

### Competitions
- createCompetition - Crear competencia
- getActiveCompetition - Competencia activa
- endCompetition - Finalizar
- getCompetitionHistory - Historial

### Rotations
- setupTaskRotation - Configurar rotación
- getTaskRotations - Listar rotaciones
- removeTaskRotation - Eliminar rotación

### Background
- main - Trabajo periódico (penalidades, rotaciones)

---

## UI Components

### Flows
- **OnboardingView** - Registro multi-paso
- **MainAppView** - App principal con navegación

### Views
- **MyTasksView** - Lista de tareas (Atrasadas | Hoy | Próximas)
- **ProgressView** - Progreso personal
- **DashboardWrapper** - Dashboard con tabs
- **FairnessDashboard** - Equidad
- **HouseholdStatsView** - Estadísticas
- **WeeklyReportView** - Reporte semanal
- **KidsView** - Modo niños
- **CompetitionView** - Competencias
- **SettingsView** - Configuración

### Modals
- **CompletionFeedbackModal** - Feedback al completar
- **TransferRequestModal** - Solicitar transferencia
- **AddTaskModal** - Agregar tarea

### Sections
- **PendingTransfersSection** - Transferencias pendientes
- **AbsenceManagementSection** - Gestión de ausencias
- **PenaltiesSection** - Penalidades
- **TaskRotationsSection** - Rotaciones

### Navigation
- Bottom tabs: Tareas | Progreso | Compite | Dashboard | Config
- Header: Nivel, racha, toggle modo niños

---

# User Flows

## 1. Onboarding (Nuevo Usuario)

1. Pantalla de bienvenida
2. Ingresar nombre
3. Seleccionar tipo de miembro
4. ¿Crear o unirse?
   - Crear: Nombre del hogar → Seleccionar tareas del catálogo → Código generado
   - Unirse: Ingresar código de invitación
5. Dashboard principal

## 2. Completar Tarea

1. Ver lista de tareas (agrupadas por urgencia)
2. Tap en tarea
3. Opción: Completar rápido o con feedback
4. Si feedback: duración, dificultad, nota
5. Confirmación con puntos/XP ganados
6. Verificación de logros desbloqueados

## 3. Transferir Tarea

1. Desde lista de tareas, tap "Transferir"
2. Seleccionar miembro destino
3. Agregar mensaje (opcional)
4. Enviar solicitud
5. Esperar respuesta (notificación)

## 4. Reportar Ausencia

1. Ir a Configuración
2. Sección "Mis Ausencias"
3. Agregar nueva ausencia
4. Seleccionar fechas y razón
5. Elegir política de redistribución
6. Confirmar

## 5. Crear Competencia

1. Ir a tab "Compite"
2. Tap "Nueva Competencia"
3. Nombre, duración, premio
4. Crear
5. Ver leaderboard en tiempo real

---

# Future Enhancements

## Notificaciones
- Push notifications para recordatorios
- Alertas de transferencias
- Resumen diario/semanal

## Integraciones
- Calendario (Google Calendar, Apple Calendar)
- Asistentes de voz (Alexa, Google Home)
- Widgets de pantalla de inicio

## Social
- Compartir logros
- Comparar con otros hogares (opcional)
- Retos entre familias

## IA Avanzada
- Predicción de tareas
- Optimización de horarios
- Detección de burnout

---

# Metrics & KPIs

## Engagement
- DAU/MAU ratio
- Tareas completadas por día
- Streak promedio

## Fairness
- Puntuación de equidad promedio
- Varianza de distribución
- Tasa de transferencias

## Gamification
- Logros desbloqueados
- Recompensas canjeadas
- Participación en competencias

---

# Glossary

| Término | Definición |
|---------|------------|
| Hogar | Grupo de personas que comparten tareas |
| Miembro | Persona dentro de un hogar |
| Tarea | Actividad recurrente a realizar |
| Asignación | Instancia de tarea asignada a un miembro |
| Peso | Dificultad/esfuerzo de una tarea (1-5) |
| XP | Puntos de experiencia para subir de nivel |
| Puntos | Moneda canjeable por recompensas |
| Racha | Días consecutivos completando tareas |
| Logro | Reconocimiento por cumplir objetivos |
| Equidad | Distribución justa de carga entre miembros |

---

# Technical Stack (Next.js + Vercel)

## Stack Seleccionado

| Componente | Tecnología |
|------------|------------|
| Framework | Next.js 14+ (App Router) |
| Hosting | Vercel |
| Base de Datos | PostgreSQL (Vercel Postgres / Neon) |
| ORM | Prisma |
| Autenticación | NextAuth.js + Google OAuth |
| Emails | Resend |
| Estilos | Tailwind CSS + shadcn/ui |
| Validación | Zod |
| Estado Cliente | React Query |

## Autenticación

### Flujo de Registro
1. Usuario hace clic en "Continuar con Google"
2. OAuth con Google
3. Creación de cuenta en base de datos
4. Envío de email de confirmación
5. Usuario confirma email haciendo clic en enlace
6. Acceso completo a la aplicación

### Código de Invitación
- Generación automática de 8 caracteres alfanuméricos
- Único por hogar
- Compartible via texto/WhatsApp/email
- Validación al unirse

## Arquitectura BFF

El Backend for Frontend está implementado en las API Routes de Next.js:

- `/api/auth/*` - Autenticación (NextAuth)
- `/api/households/*` - Gestión de hogares
- `/api/tasks/*` - Gestión de tareas
- `/api/assignments/*` - Asignaciones
- `/api/members/*` - Miembros y perfil
- `/api/competitions/*` - Competencias
- `/api/rewards/*` - Recompensas
- `/api/rotations/*` - Rotaciones

## Estructura de Archivos

Ver CLAUDE.md para la estructura completa del proyecto.
