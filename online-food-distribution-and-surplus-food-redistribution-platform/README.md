# Online Food Distribution and Surplus Food Redistribution Platform

## 1. Project overview

FoodShare is a beginner-friendly full-stack web application that helps redistribute safe surplus food. Donors can publish available food, while recipients/NGOs and volunteers can browse listings and request food.

### Problem statement

Restaurants, households, events, bakeries and other food providers may have safe surplus food while nearby people or organizations need food. The project creates a simple digital connection between these two sides and keeps a record of listings and requests.

### Objectives

- Reduce avoidable food waste.
- Make surplus food easier to discover.
- Give donors a simple way to publish food availability.
- Let recipients/volunteers request available food.
- Store food and request information persistently.
- Demonstrate a practical first-year B.Tech full-stack project.

## 2. Target users

- **Donor:** publishes surplus food and sees their listings.
- **Recipient:** requests available food.
- **Volunteer:** can request food on behalf of redistribution activities.
- **Admin:** reserved in the database schema for future administration; the MVP does not expose an admin dashboard.

## 3. MVP features

- Registration and login.
- Role selection during registration.
- Donor food listing.
- Food search and status filtering.
- Recipient/volunteer food request.
- Request cancellation.
- Personal dashboard.
- Home-page statistics.
- Server-side validation.
- JWT authentication.
- Password hashing with bcrypt.
- Security headers and rate limiting.
- Supabase PostgreSQL persistence.

## 4. Technology stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express.js
- Supabase PostgreSQL
- Git/GitHub
- npm packages: `express`, `@supabase/supabase-js`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`

No React, Vue, Angular, MongoDB, Firebase, Python, PHP or paid API is required.

## 5. Folder structure

```text
online-food-distribution-and-surplus-food-redistribution-platform/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── food.js
│   │   └── claims.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── auth.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

## 6. Prerequisites

Install:

1. Visual Studio Code: https://code.visualstudio.com/
2. Node.js LTS: https://nodejs.org/
3. Git: https://git-scm.com/
4. A free Supabase account: https://supabase.com/

Verify in a terminal:

```bash
node --version
npm --version
git --version
```

## 7. Supabase setup

1. Create a new Supabase project.
2. Open **SQL Editor**.
3. Open `database/schema.sql`.
4. Copy the complete SQL into the SQL Editor.
5. Run it.
6. Open **Table Editor** and confirm these tables exist:
   - `profiles`
   - `food_listings`
   - `claims`

The application uses the server-side Supabase service-role key, so it must never be placed in frontend files.

## 8. Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```text
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
```

Get the Supabase URL and server key from your Supabase project's API settings.

For a random JWT secret, run:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the printed value into `JWT_SECRET`.

Never commit `.env`.

## 9. Installation

Open a terminal in the project root:

```bash
cd backend
npm install
```

## 10. Run the application

From `backend/`:

```bash
npm start
```

You should see:

```text
FoodShare running at http://localhost:3000
```

Open:

```text
http://localhost:3000
```

The Express server serves the `frontend/` directory.

## 11. Main workflow

### Donor

1. Register as Donor.
2. Open Dashboard.
3. Choose List Food.
4. Enter food name, category, quantity, expiry, pickup location and description.
5. Publish the listing.
6. The listing appears in Browse Food.

### Recipient / NGO

1. Register as Recipient.
2. Open Browse Food.
3. Search or filter available food.
4. Select Request Food.
5. The request appears in Dashboard.
6. Cancel a pending request when necessary.

### Volunteer

The volunteer role follows the same request workflow as a recipient in the MVP.

## 12. API endpoints

| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/api/health` | Health check | Public |
| POST | `/api/auth/register` | Create account | Public |
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/stats` | Home statistics | Public |
| GET | `/api/food` | Search/list food | Public |
| POST | `/api/food` | Create food listing | Donor |
| POST | `/api/food/:id/claim` | Request food | Recipient/Volunteer |
| GET | `/api/dashboard` | Current user's data | Logged in |
| PATCH | `/api/claims/:id/cancel` | Cancel own request | Request owner |

### Request examples

Register:

```json
{
  "name": "Demo Donor",
  "email": "donor@example.com",
  "password": "password123",
  "role": "donor"
}
```

Create food:

```json
{
  "title": "Vegetable Rice",
  "category": "Cooked Meal",
  "quantity": 20,
  "expiry_at": "2030-01-01T18:00:00.000Z",
  "pickup_location": "College Canteen",
  "description": "Freshly packed surplus meals."
}
```

## 13. Architecture

```text
Browser
  |
  | fetch()
  v
Express.js REST API
  |
  | server-side validation + JWT authorization
  v
Supabase PostgreSQL
  |
  +-- profiles
  +-- food_listings
  +-- claims
```

The browser never receives the Supabase service-role key.

## 14. Authentication and security

The MVP uses:

- bcrypt password hashing.
- JWT sessions with a two-hour expiration.
- Authorization middleware.
- Role checks on protected endpoints.
- Helmet security headers.
- Rate limiting.
- Backend validation.
- `.env` exclusion from Git.

The current MVP uses a server-only Supabase key and backend authorization. If the project is later moved to Supabase Auth, PostgreSQL Row Level Security policies should be enabled and authentication should be integrated with Supabase user IDs.

## 15. Testing checklist

### Registration

- Register with valid details → account is created.
- Register with an existing email → error.
- Register with password shorter than six characters → error.
- Register with invalid role → error.

### Login

- Correct credentials → dashboard opens.
- Wrong password → login fails.
- Missing credentials → validation error.

### Food listing

- Donor creates a valid listing → listing appears.
- Non-donor attempts to create listing → 403 response.
- Quantity is zero/negative → validation error.
- Expiry is in the past → validation error.

### Search

- Search by food name → matching records appear.
- Search by pickup location → matching records appear.
- Available filter → only available records appear.
- No matches → friendly empty state.

### Requests

- Recipient requests available food → request is created.
- Same recipient requests the same listing twice → duplicate request is blocked.
- Non-recipient/volunteer attempts to request → denied.
- Request owner cancels requested claim → status changes to cancelled.
- Another user attempts cancellation → denied.

### Security

- Open dashboard without a token → 401.
- Invalid/expired token → 401.
- Service-role key is absent from frontend files.
- `.env` is ignored by Git.

### Responsive UI

Check desktop, tablet and mobile widths.

## 16. Troubleshooting

### `npm` is not recognized

Install Node.js LTS and restart Visual Studio Code.

### Supabase connection error

Check:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- The Supabase project is active.
- `database/schema.sql` was executed.

### `relation "profiles" does not exist`

Run `database/schema.sql` in Supabase SQL Editor.

### Port already in use

Change:

```text
PORT=3001
```

Then open `http://localhost:3001`.

### Invalid or expired session

Log out and log in again. JWT sessions expire after two hours.

### Secret was committed to GitHub

Rotate the exposed Supabase key immediately. Removing the file in a later commit is not enough because the old secret may remain in Git history.

## 17. GitHub upload

Create an empty GitHub repository, then run these commands from the project root:

```bash
git init
git status
git add .
git status
git commit -m "Build project"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Before `git add .`, verify:

- `backend/.env` is ignored.
- `node_modules/` is ignored.
- No real passwords or secrets are in frontend code.
- No private user data is committed.

Replace `YOUR_GITHUB_REPOSITORY_URL` with the actual repository URL.

## 18. Limitations

The MVP intentionally keeps the scope manageable for first-year students. It does not include live maps, payments, SMS/email notifications, image uploads, advanced admin approval, route optimization, or real-time chat.

## 19. Future improvements

- Admin dashboard.
- Donor approval and recipient verification.
- Food images.
- Pickup scheduling.
- Email/SMS notifications.
- Location/map support.
- Food safety checklist.
- Volunteer assignment.
- Analytics and monthly waste-reduction reports.
- Supabase Auth + Row Level Security.
