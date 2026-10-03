# Upgrading to Supabase PostgreSQL

Currently, the application is using a local **SQLite** database (`dev.db`) for rapid testing and development. 

When you are ready to deploy to production or want to switch to a more robust database, you can easily upgrade to **Supabase (PostgreSQL)**. Because we use Prisma ORM, your application code does not need to change!

## Step-by-Step Upgrade Guide

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com) and create a free account.
2. Click **New Project** and follow the prompts.
3. Once the database is provisioned, go to **Project Settings -> Database**.
4. Scroll down to **Connection string** and copy the `URI` format.

### 2. Update Environment Variables
Open your `.env` file in the root of the project.
Replace the `DATABASE_URL` with your Supabase connection string. Remember to replace `[YOUR-PASSWORD]` with your actual database password.

```env
# Change this:
# DATABASE_URL="file:./dev.db"

# To this:
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 3. Update Prisma Schema
Open `prisma/schema.prisma` and change the provider from `"sqlite"` to `"postgresql"`.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Push the Schema to Supabase
Open your terminal and run the following command to create the tables in your new Supabase database:

```bash
npx prisma db push
```

### 5. Re-run the Seed Script (Optional)
If you want to import your Excel data into the new Supabase database, just run the seed script again:

```bash
npm run db:seed
```

That's it! Your application is now running on Supabase PostgreSQL.
