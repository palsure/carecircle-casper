# Railway Persistent Volume Setup Guide

## ⚠️ Critical: Database Persistence

**Without a persistent volume, your SQLite database will be LOST on every deployment!**

Railway containers are ephemeral - each new build creates a fresh container. To persist data, you MUST add a volume.

## Step-by-Step Volume Setup

### 1. Go to Railway Dashboard

1. Visit [railway.app](https://railway.app)
2. Select your project
3. Click on your **API service** (not the frontend)

### 2. Add Volume

1. Click on **Settings** tab
2. Scroll down to **Volumes** section
3. Click **"Add Volume"** button
4. Configure:
   - **Volume Name**: `carecircle-db` (or any name you prefer)
   - **Mount Path**: `/app/data` ⚠️ **Must be exactly `/app/data`**
   - Click **"Add"**

### 3. Verify Volume

After adding, you should see:
- Volume listed in the Volumes section
- Mount path: `/app/data`
- Status: Active/Attached

### 4. Set Environment Variable (Optional but Recommended)

In **Settings** → **Variables**, ensure:
```
DB_FILE=/app/data/carecircle-application.db
```

This ensures the database uses the mounted volume path.

### 5. Redeploy

After adding the volume:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger a rebuild

## Verification

After redeploying with the volume:

1. **Create a circle** via the API
2. **Check the database** persists:
   - Query the circle: `GET /circles/:id`
   - Should return the circle you created
3. **Redeploy again** (to test persistence)
4. **Query the circle again** - it should still exist!

## Troubleshooting

### Database Still Getting Cleared?

1. **Check Volume Mount Path**
   - Must be exactly `/app/data`
   - Check in Railway dashboard → Settings → Volumes

2. **Check DB_FILE Environment Variable**
   - Should be `/app/data/carecircle-application.db`
   - Or let it default (code will use `/app/data` in Railway)

3. **Check Volume is Attached**
   - In Railway dashboard, verify volume shows as "Attached"
   - If not attached, remove and re-add it

4. **Check Database Path in Logs**
   - Look for: `[DB] Opening database at: /app/data/carecircle-application.db`
   - If it shows a different path, the volume isn't being used

### Volume Not Showing?

1. Make sure you're in the **API service** settings (not frontend)
2. Refresh the page
3. Try removing and re-adding the volume

### Data Lost After Adding Volume?

- The volume starts empty when first added
- You'll need to recreate data after adding the volume
- Future deployments will preserve data

## Alternative: Use Railway Postgres

If volumes continue to cause issues, consider migrating to Railway Postgres:

1. In Railway dashboard, click **"New"** → **"Database"** → **"Add Postgres"**
2. This creates a managed PostgreSQL database
3. Update your code to use Postgres instead of SQLite
4. Data will persist automatically (managed by Railway)

## Current Configuration

The code is configured to:
- Detect Railway environment automatically
- Use `/app/data` directory for database
- Create directory if it doesn't exist
- Work with or without volumes (but data only persists WITH volumes)

## Important Notes

- **Volumes are per-service**: Each service has its own volumes
- **Volumes persist across deployments**: Data survives rebuilds
- **Volumes are NOT shared**: Each deployment gets the same volume
- **Volume size**: Railway free tier includes 5GB storage

