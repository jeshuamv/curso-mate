# curso-mate

Curso autogestionable de matemáticas remedial — Universidad de Montemorelos.

## Cómo desplegarlo en Netlify (proyecto `curso-mate` ya creado)

1. Sube esta carpeta a un repositorio en GitHub (o similar).
2. En el dashboard de Netlify, entra al proyecto **curso-mate** → *Project configuration* → conecta el repositorio (*Link repository*).
3. Netlify detectará `netlify.toml` automáticamente.
4. La primera vez que se haga un deploy (o corras `netlify dev` / `netlify build` localmente con la CLI), como el paquete `@netlify/neon` está en `package.json`, Netlify aprovisiona la base de datos sola y crea la variable de entorno `NETLIFY_DATABASE_URL`.
5. Corre el esquema (`db/schema.sql`) contra esa base de datos una vez esté creada — puedes hacerlo desde el panel de Neon/Netlify DB (Data & Storage → abrir consola SQL) o con `netlify db` desde la CLI.

## Desarrollo local

```bash
npm install
netlify link   # conecta esta carpeta al proyecto curso-mate
netlify dev
```

## Estructura

- `public/` — frontend estático (camino de aprendizaje)
- `netlify/functions/progress.js` — API que lee/escribe el progreso del estudiante
- `db/schema.sql` — esquema completo + datos semilla del Tema 1 y el nodo puente a Álgebra
