---
name: git-workflow
description: Guía y ejecuta el flujo de trabajo oficial de Git (GitFlow) para el backend del Comedor Comunitario Pan para Todos (SIG-CCPT). Úsalo cuando el usuario necesite crear una rama para una tarea, sincronizar ramas, validar antes de subir, abrir un Pull Request hacia develop, o realizar el pase final de develop a main para despliegue.
---

# Flujo de Trabajo Oficial de Git — SIG-CCPT Backend

Esta skill define y estandariza el flujo de trabajo en Git para los desarrolladores del proyecto **SIG-CCPT (Comedor Comunitario Pan para Todos)**, garantizando el cumplimiento de las políticas del repositorio y las pautas de evaluación.

## Reglas de Oro del Repositorio
1. **Ramas protegidas:** Tanto `main` como `develop` tienen reglas de protección en GitHub. **NUNCA se puede hacer push directo a `develop` ni a `main`**; todos los cambios deben integrarse obligatoriamente mediante **Pull Requests**.
2. **Origen de las tareas:** Toda nueva funcionalidad o corrección se inicia a partir de la rama **`develop`** (nunca directamente de `main`).
3. **Formato de Commits:** Los mensajes de commit deben ser **descriptivos en español** y en modo imperativo o declarativo simple (ej: *"Implementar asignación de turnos"* o *"Se agregó la validación de inventario"*). **NO usar prefijos de Conventional Commits como `feat(...)`, `fix(...)` ni `chore(...)`**, ya que están penalizados por la rúbrica del profesor.
4. **Quality Gate:** Antes de hacer push de cualquier rama, **es obligatorio** verificar localmente que el proyecto compile sin errores (`npm run build`) y que todas las pruebas unitarias pasen (`npm run test`).

---

## 1. Crear una Rama para una Nueva Tarea

Cuando comiences una nueva historia de usuario o requerimiento (ej: RF-02, RF-03):

```bash
# 1. Posicionarse en develop y actualizarla
git checkout develop
git pull origin develop

# 2. Crear la rama de la tarea con nomenclatura descriptiva
git checkout -b feature/RF-XX-descripcion-corta
# Ejemplos:
# git checkout -b feature/RF-02-gestion-turnos
# git checkout -b feature/RF-03-control-donaciones
```

---

## 2. Desarrollo y Commits Limpios

A medida que se programa la tarea:
- Mantener la **Arquitectura Hexagonal** del proyecto:
  - Dominio (`domain/models`, `domain/ports`)
  - Aplicación (`application/use-cases`)
  - Infraestructura (`infrastructure/adapters`)
- Realizar commits atómicos y descriptivos en español:
```bash
git add <archivos-modificados>
git commit -m "Descripción clara de lo que se implementó en español"
```

---

## 3. Verificación de Calidad Obligatoria (Pre-Push)

Antes de publicar la rama o abrir el Pull Request, ejecutar en consola:

```bash
npm run build && npm run test
```
- Si `npm run build` falla: corregir errores de TypeScript antes de continuar.
- Si `npm run test` falla: corregir las pruebas unitarias hasta que el 100% pasen.

---

## 4. Publicar la Rama y Abrir Pull Request hacia `develop`

Una vez verificado:

```bash
# 1. Subir la rama al repositorio remoto
git push -u origin feature/RF-XX-descripcion-corta
```

2. Ir a GitHub y abrir el **Pull Request**:
   - **Rama Base (Target):** `develop`  *(¡MUY IMPORTANTE: apuntar a develop, NO a main!)*
   - **Rama Comparada (Source):** `feature/RF-XX-descripcion-corta`
   - **Título:** `RF-XX: Descripción de la funcionalidad`
   - **Cuerpo del PR:**
     - Resumen de lo implementado.
     - Criterios de aceptación cumplidos.
     - Referencia al Issue: `Closes #XX`.

---

## 5. Integración y Pruebas en `develop`

1. En GitHub, los compañeros revisan el código (Code Review).
2. Se aprueba y se realiza el **Merge** en `develop`.
3. En la máquina local, se actualiza `develop`:
```bash
git checkout develop
git pull origin develop
```

---

## 6. Pase a Producción (`develop` ──► `main`)

Cuando un conjunto de requerimientos (sprint o fase) esté completo y probado en `develop`:

1. Se abre un **Pull Request** en GitHub:
   - **Rama Base:** `main`
   - **Rama Comparada:** `develop`
   - **Título:** `Release: Fase X / Versión X.X.X`
2. Una vez aprobado, se fusiona a `main` para el despliegue final a producción.

