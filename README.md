# API Eventos – CRUD de empresas

API del **sistema de eventos** hecha con **Node.js + Express** y conectada a **PostgreSQL**.
La base es **multitenant** (varias empresas usan el mismo sistema), por eso la primera tabla es **empresas**.

Permite **crear, listar, ver, editar y eliminar** empresas. Los datos se guardan en la base de datos,
así que si se reinicia el servidor, siguen estando.

---

## 🚀 Qué hay que hacer para que ande

### Requisitos
- [Node.js](https://nodejs.org) (versión 20 o más nueva)
- [PostgreSQL](https://www.postgresql.org/download/) instalado (con pgAdmin)
- Thunder Client (extensión de VS Code) o Postman para probar

### Paso 1 – Clonar el proyecto
```bash
git clone https://github.com/tomasallasia07-cyber/api-eventos.git
cd api-eventos
```

### Paso 2 – Instalar las dependencias
```bash
npm install
```
Esto crea la carpeta `node_modules` (no se sube a GitHub, cada uno la genera con este comando).

### Paso 3 – Crear la base de datos
1. Abrir **pgAdmin**.
2. Click derecho en **Databases → Create → Database...** y ponerle de nombre **`eventos`**.
3. Click derecho sobre la base `eventos` → **Query Tool**.
4. Abrir el archivo [`database/empresas.sql`](database/empresas.sql), copiar el `CREATE TABLE` y los `INSERT`, pegarlos y ejecutarlos (▶ o F5).
5. Comprobar con: `SELECT * FROM empresas;` → tienen que aparecer 3 empresas.

### Paso 4 – Crear el archivo `.env`
El `.env` **no está en GitHub** (tiene contraseñas). Cada uno lo crea copiando el ejemplo:

```bash
cp .env.example .env
```
(En Windows también pueden copiar y pegar el archivo y renombrarlo a `.env`.)

Después abrirlo y poner **su** contraseña de PostgreSQL:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=la_contraseña_de_tu_postgres
DB_NAME=eventos
```

### Paso 5 – Levantar el servidor
```bash
npm run dev
```
Si sale `Servidor corriendo en http://localhost:3000`, ya está funcionando. 🎉

---

## 📌 Endpoints

Todas las rutas van bajo **`/api/empresas`**:

| Método | Ruta | Acción | Respuesta |
| --- | --- | --- | --- |
| GET | `/api/empresas` | Listar todas las empresas | 200 |
| GET | `/api/empresas/:id` | Obtener una empresa | 200 / 404 |
| POST | `/api/empresas` | Crear una empresa | 201 / 400 |
| PUT | `/api/empresas/:id` | Editar una empresa | 200 / 404 |
| DELETE | `/api/empresas/:id` | Eliminar una empresa | 204 / 404 |

### Pruebas para hacer en Thunder Client / Postman

| Prueba | Body (JSON) | Resultado esperado |
|---|---|---|
| `GET http://localhost:3000/api/empresas` | – | 200 con las 3 empresas |
| `GET http://localhost:3000/api/empresas/1` | – | 200 con "Eventos del Centro" |
| `GET http://localhost:3000/api/empresas/99` | – | 404 "Empresa no encontrada" |
| `POST http://localhost:3000/api/empresas` | `{"nombre":"Mi Empresa","cuit":"30-11111111-1"}` | 201 con la empresa creada y su id |
| `POST http://localhost:3000/api/empresas` | `{}` | 400 "El nombre y el cuit son obligatorios" |
| `PUT http://localhost:3000/api/empresas/1` | `{"telefono":"351-0000000"}` | 200, cambia solo el teléfono |
| `DELETE http://localhost:3000/api/empresas/3` | – | 204 (sin contenido) |
| `GET http://localhost:3000/ruta-loca` | – | 404 "Ruta no encontrada" |

---

## 📁 Estructura del proyecto

```
api-eventos/
├── database/
│   └── empresas.sql                  → script de la tabla
├── src/
│   ├── index.js                      → crea el servidor y conecta todo
│   ├── routes/
│   │   └── empresas.routes.js        → QUÉ rutas existen
│   ├── controllers/
│   │   └── empresas.controller.js    → QUÉ hace cada ruta
│   └── data/
│       └── db.js                     → conexión a la base de datos
├── .env                              → datos de conexión (NO se sube)
├── .env.example                      → modelo del .env (sí se sube)
├── .gitignore
└── package.json
```

**Cómo viaja un pedido:**
```
Cliente (Thunder Client) → index.js → empresas.routes.js → empresas.controller.js → db.js → PostgreSQL
```

---

## 📖 Explicación línea por línea

### `package.json` (lo importante)
```json
"type": "module",
```
Permite usar `import` / `export` (ES Modules) en vez de `require`.

```json
"dev": "node --watch src/index.js",
```
Con `npm run dev` arranca el servidor y **se reinicia solo** cada vez que guardás un archivo.

Dependencias que usamos:
- **express** → para crear el servidor y las rutas.
- **cors** → permite que un frontend (en otro puerto) pueda llamar a la API.
- **dotenv** → lee el archivo `.env`.
- **pg** → conecta Node.js con PostgreSQL.

### `.gitignore`
```
node_modules/
.env
```
Esto **no se sube a GitHub**: `node_modules` porque es enorme y se regenera con `npm install`;
`.env` porque tiene la contraseña. Para que los demás sepan qué variables poner existe `.env.example`.

---

### `src/data/db.js` – la conexión a la base

```js
import pg from "pg";
```
Trae la librería que conecta Node con PostgreSQL.

```js
const pool = new pg.Pool({
```
Crea un **pool**: un grupo de conexiones abiertas y listas para usar, así no hay que reconectarse en cada consulta.

```js
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
```
Cada dato se lee del `.env`. `process.env.X` = "leé la variable X". Así la contraseña **nunca** queda escrita en el código.

```js
export default pool;
```
Exporta el pool para que los controladores lo puedan usar.

---

### `src/index.js` – el servidor

```js
import "dotenv/config";
```
**Tiene que ser la primera línea.** Lee el `.env` y carga las variables en `process.env`.
Si estuviera más abajo, la conexión a la base se podría crear antes de tener los datos.

```js
import express from "express";
import cors from "cors";
import empresasRoutes from "./routes/empresas.routes.js";
```
Trae Express, CORS y nuestras rutas de empresas.

```js
const app = express();
const PORT = process.env.PORT || 3000;
```
Crea la aplicación. El puerto sale del `.env`; si no está, usa 3000.

```js
app.use(cors());
app.use(express.json());
```
**Middlewares** (se ejecutan antes de cada ruta).
`express.json()` convierte el JSON que manda el cliente en `req.body`. Sin esto, `req.body` sería `undefined`.

```js
app.use("/api/empresas", empresasRoutes);
```
Todas las rutas de empresas cuelgan de `/api/empresas`. Ej: `"/:id"` pasa a ser `/api/empresas/:id`.

```js
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});
```
**Ruta 404**: va al final. Si ninguna ruta de arriba coincidió, el pedido cae acá.

```js
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
```
Arranca el servidor y avisa por consola cuando está listo.

---

### `src/routes/empresas.routes.js` – QUÉ rutas existen

```js
import { Router } from "express";
import { obtenerEmpresas, obtenerEmpresa, crearEmpresa, editarEmpresa, eliminarEmpresa }
  from "../controllers/empresas.controller.js";
```
Trae el `Router` de Express y las 5 funciones del controlador.

```js
const router = Router();
```
Un `Router` es un "mini grupo" de rutas.

```js
router.get("/", obtenerEmpresas);        // GET    /api/empresas
router.get("/:id", obtenerEmpresa);      // GET    /api/empresas/5
router.post("/", crearEmpresa);          // POST   /api/empresas
router.put("/:id", editarEmpresa);       // PUT    /api/empresas/5
router.delete("/:id", eliminarEmpresa);  // DELETE /api/empresas/5
```
Cada línea dice: "cuando llegue este **método** a esta **ruta**, ejecutá esta **función**".
`:id` es un **parámetro**: cualquier valor que pongan en esa parte de la URL.

```js
export default router;
```
Exporta las rutas para usarlas en `index.js`.

---

### `src/controllers/empresas.controller.js` – QUÉ hace cada ruta

**Cosas que se repiten en todas las funciones:**
- `import pool from "../data/db.js";` → trae la conexión a la base.
- `async (req, res) =>` → función **asíncrona** porque la base tarda en responder.
  `req` = lo que llega (el pedido), `res` = lo que devolvemos (la respuesta).
- `await pool.query(...)` → **espera** a que la base conteste.
- `try { ... } catch (error) { res.status(500)... }` → si algo falla (ej: la base está apagada), en vez de romperse responde **500**.
- `$1, $2...` + `[valores]` → **parámetros**. Los valores se mandan separados del SQL; así se evita la
  **inyección SQL**. ❌ Nunca hacer `"... WHERE id = " + id`.

#### `obtenerEmpresas` – listar
```js
const resultado = await pool.query("SELECT * FROM empresas ORDER BY id_empresa");
res.json(resultado.rows);
```
`resultado.rows` es un array con todas las filas. Se devuelve como JSON (código 200 por defecto).

#### `obtenerEmpresa` – una sola
```js
const { id } = req.params;
```
Saca el `id` de la URL. Ej: `/api/empresas/2` → `id = "2"`.

```js
const resultado = await pool.query("SELECT * FROM empresas WHERE id_empresa = $1", [id]);
```
Busca la empresa con ese id (usando parámetro `$1`).

```js
if (resultado.rows.length === 0) {
  return res.status(404).json({ mensaje: "Empresa no encontrada" });
}
```
Si no vino ninguna fila → no existe → **404**. El `return` corta la función para que no siga.

```js
res.json(resultado.rows[0]);
```
Devuelve la primera (y única) fila.

#### `crearEmpresa` – crear
```js
const { nombre, cuit, email, telefono, direccion } = req.body;
```
Toma los datos que mandó el cliente. **No** se toma el `id`: lo genera la base (SERIAL).

```js
if (!nombre || !cuit) {
  return res.status(400).json({ mensaje: "El nombre y el cuit son obligatorios" });
}
```
Si falta el nombre o el cuit → **400** (error del cliente).

```js
const resultado = await pool.query(
  `INSERT INTO empresas (nombre, cuit, email, telefono, direccion)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *`,
  [nombre, cuit, email, telefono, direccion]
);
```
Inserta la empresa. `RETURNING *` hace que la base devuelva la fila **tal como quedó guardada**
(con su `id_empresa`, `activo` y `fecha_creacion`).

```js
res.status(201).json(resultado.rows[0]);
```
**201** = "creado".

```js
if (error.code === "23505") {
  return res.status(400).json({ mensaje: "Ya existe una empresa con ese cuit" });
}
```
Extra: `23505` es el código de PostgreSQL para "valor repetido en un campo UNIQUE".
Si cargan un cuit que ya existe, devolvemos 400 con un mensaje claro en vez de 500.

#### `editarEmpresa` – editar
```js
const { id } = req.params;
const { nombre, cuit, email, telefono, direccion, activo } = req.body;
```
El id sale de la URL y los datos nuevos del body.

```js
UPDATE empresas SET
  nombre = COALESCE($1, nombre),
  ...
WHERE id_empresa = $7
RETURNING *
```
`COALESCE(a, b)` devuelve `a` si no es nulo; si es nulo, devuelve `b`.
O sea: si el cliente **no manda** `nombre`, se queda el que ya tenía. Así se puede editar un solo campo
sin borrar los demás. `RETURNING *` devuelve la empresa como quedó.

```js
if (resultado.rows.length === 0) {
  return res.status(404).json({ mensaje: "Empresa no encontrada" });
}
res.json(resultado.rows[0]);
```
Si no se actualizó ninguna fila, el id no existe → **404**. Si salió bien → **200** con la empresa.

#### `eliminarEmpresa` – eliminar
```js
const resultado = await pool.query("DELETE FROM empresas WHERE id_empresa = $1", [id]);
```
Borra la empresa con ese id.

```js
if (resultado.rowCount === 0) {
  return res.status(404).json({ mensaje: "Empresa no encontrada" });
}
```
`rowCount` = cuántas filas se borraron. Si es 0, no existía → **404**.

```js
res.status(204).send();
```
**204** = "todo bien, pero no hay nada para devolver" (respuesta sin cuerpo).

---

## ✅ Requisitos de la actividad cumplidos

1. Los datos se guardan en **PostgreSQL** (si se reinicia el servidor, siguen estando).
2. El **id lo genera la base de datos** (`SERIAL`), nunca el cliente.
3. Al crear, **nombre** y **cuit** son obligatorios → si faltan, **400**.
4. Si la empresa no existe (obtener, editar, eliminar) → **404**.
5. Al crear y editar se devuelve la empresa guardada (`RETURNING *`).
6. Todas las consultas usan **parámetros** (`$1, $2...`), nada de concatenar texto.
7. Ruta **404** para rutas inexistentes al final de `index.js`.

---

## 🛠️ Problemas comunes

| Error | Solución |
|---|---|
| `password authentication failed for user "postgres"` | La contraseña del `.env` está mal. |
| `database "eventos" does not exist` | Falta crear la base `eventos` en pgAdmin (Paso 3). |
| `relation "empresas" does not exist` | Falta ejecutar `database/empresas.sql` dentro de la base `eventos`. |
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL no está prendido. Iniciar el servicio de PostgreSQL. |
| `EADDRINUSE: address already in use :::3000` | Ya hay otro servidor en el puerto 3000. Cerrarlo o cambiar `PORT` en el `.env`. |
| `Cannot use import statement outside a module` | Falta `"type": "module"` en `package.json`. |
| `req.body` es `undefined` | Falta `app.use(express.json())` o en Thunder Client no se eligió Body → JSON. |
