# Active Sessions Setup Instructions

## Quick Setup

To enable the Active Sessions functionality in your Admin Dashboard, you need to run the SQL script to create the required database tables.

### Step 1: Run the SQL Script

Open your MySQL command line or any MySQL client (like phpMyAdmin, MySQL Workbench, etc.) and run:

```sql
-- Connect to your database
USE saas_base;

-- Run the setup script
SOURCE setup_sessions.sql;
```

Or copy and paste the contents of `setup_sessions.sql` directly into your MySQL client.

### Step 2: Verify Tables Created

Check if the tables were created successfully:

```sql
SHOW TABLES LIKE '%session%';
SHOW TABLES LIKE '%login_history%';
SHOW TABLES LIKE '%api_keys%';
```

You should see:
- `user_sessions`
- `login_history` 
- `api_keys`

### Step 3: Test the Feature

1. Go to Admin Dashboard
2. Click on the "Sessions" tab
3. You should see sample session data
4. The "Terminate" button should work to remove sessions

## What This Adds

✅ **Active Sessions Tracking** - See who's currently logged in
✅ **Login History** - Track all login attempts with IP and browser info  
✅ **Security Monitoring** - Flag suspicious login attempts
✅ **Session Management** - Terminate user sessions remotely
✅ **API Keys Management** - Control API access (future feature)

## Sample Data Included

The script includes sample data so you can immediately see the feature working:
- 2 active sessions for testing
- 3 login history entries (including 1 suspicious)

## Troubleshooting

If you see "No active sessions found":
1. Make sure you ran the SQL script
2. Check if the tables exist in your database
3. Restart your backend server
4. Check the browser console for any API errors

The Active Sessions feature will now work properly in your Admin Dashboard!