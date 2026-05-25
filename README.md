# GamersRig Back Office

Internal admin panel for GamersRig — orders, products, customers, vendors, and partner finance.

It's a lightweight **monorepo** with two apps that talk over HTTP:

| Folder      | Stack                                   | Dev port |
| ----------- | --------------------------------------- | -------- |
| `backend/`  | Laravel 12 API (PHP 8.2), Sanctum auth  | `8000`   |
| `frontend/` | React 19 + Vite 8 + MUI v9 (SPA)        | `5173`   |

---

## Prerequisites

Install these first:

- **PHP 8.2+** with extensions: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd` (XAMPP on Windows bundles these)
- **Composer** 2.x
- **Node.js 20.19+** (or 22.12+) and **npm** — required by Vite 8
- **MySQL 8** / MariaDB (e.g. via XAMPP)
- **Git**

---

## 1. Clone

```bash
git clone https://github.com/gnkafridi/gamersrig-backoffice.git
cd gamersrig-backoffice
```

## 2. Create the database

Start MySQL, then create an empty database (default name expected by `.env`):

```sql
CREATE DATABASE gamersrig_backoffice CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. Backend (Laravel API)

```bash
cd backend

composer install

# Create your env file
cp .env.example .env        # Windows PowerShell: copy .env.example .env

php artisan key:generate
```

Open `backend/.env` and set the database connection:

```env
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gamersrig_backoffice
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations + seed initial data (creates the admin user, vendors, etc.):

```bash
php artisan migrate --seed
```

Link the public storage folder so uploaded proofs/receipts are served:

```bash
php artisan storage:link
```

Start the API:

```bash
php artisan serve        # http://localhost:8000
```

> Tip: `composer run dev` starts the API, queue worker, log tailer, and the
> Vite dev server together (requires the frontend deps to be installed).

## 4. Frontend (React SPA)

In a second terminal:

```bash
cd frontend

npm install
```

Create `frontend/.env` pointing at the API:

```env
VITE_API_URL=http://localhost:8000/api
```

Start the dev server:

```bash
npm run dev              # http://localhost:5173
```

Vite also proxies `/api` to `http://localhost:8000`, so the SPA works as long as
the backend is running.

## 5. Log in

Open **http://localhost:5173** and sign in with the seeded admin account:

| Email                  | Password   |
| ---------------------- | ---------- |
| `admin@gamersrig.com`  | `admin123` |

Change this password after first login.

---

## Common commands

**Backend** (`cd backend`)

```bash
php artisan serve                  # run the API
php artisan migrate                # apply new migrations
php artisan migrate:fresh --seed   # rebuild DB from scratch + seed
php artisan test                   # run the test suite
```

**Frontend** (`cd frontend`)

```bash
npm run dev                    # dev server with HMR
npm run build                  # production build -> frontend/dist
npm run preview                # preview the production build
npm run lint                   # eslint
```

---

## Project layout

```
backoffice/
├── backend/        Laravel API (controllers, models, migrations, seeders)
│   ├── app/Http/Controllers/Api
│   ├── database/migrations
│   └── database/seeders
├── frontend/       React SPA
│   └── src/
│       ├── api/        axios clients per domain
│       ├── components/ Layout, shared UI
│       └── pages/      route pages (Finance, Stock Spent, Orders, …)
└── README.md
```

## Troubleshooting

- **`SQLSTATE[HY000] [1049] Unknown database`** — the database wasn't created (step 2) or the name in `.env` doesn't match.
- **`419` / CSRF or `401` on API calls** — confirm `VITE_API_URL` matches where the backend runs and that you've logged in.
- **Uploaded proof images 404** — run `php artisan storage:link`.
- **Vite refuses to start / engine warning** — your Node is older than 20.19; upgrade Node.
- **`Class not found` after pulling** — run `composer install` (and `npm install`) again.
</content>
