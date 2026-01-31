# PostgreSQL Migration Guide

## Problem Summary

When migrating from MySQL to PostgreSQL, we encountered a critical issue with the `CHAR(n)` data type:

### The Issue
- **PostgreSQL's `CHAR(n)` type** is fixed-length and **pads values with trailing spaces**
- All UUIDs were defined as `CHAR(20)` but generated as 12 characters (e.g., "A0f84212a-03")
- PostgreSQL padded these to 20 characters: "A0f84212a-03        " (12 + 8 spaces)
- When UUIDs with trailing spaces were used in URLs, routes failed to match → **404 errors**

### Example
```
Generated UUID: "A0f84212a-03" (12 chars)
Stored in DB:   "A0f84212a-03        " (20 chars with padding)
API URL:        /api/v1/requests/A0f84212a-03%20%20%20%20%20%20%20%20/accept
Result:         404 Not Found ❌
```

## Changes Made

### 1. Model Updates (✅ Completed)
Changed all CHAR types to VARCHAR in the following models:
- `backend/internal/model/user.go`
- `backend/internal/model/group.go`
- `backend/internal/model/contact.go`
- `backend/internal/model/contact_apply.go`
- `backend/internal/model/session.go`
- `backend/internal/model/message.go`

**Changes:**
- `type:char(20)` → `type:varchar(20)` (all UUID and ID fields)
- `type:char(10)` → `type:varchar(10)` (birthday field)
- `type:json` → `type:jsonb` (Group.Members field for better PostgreSQL performance)

### 2. Database Schema Migration

You need to update your PostgreSQL database schema to match the new model definitions.

## How to Apply the Migration

### Option 1: Run SQL Migration Script (Recommended)

1. **Connect to your PostgreSQL database:**
   ```bash
   psql -h <your-host> -U <your-user> -d <your-database>
   ```

2. **Run the migration script:**
   ```bash
   psql -h <your-host> -U <your-user> -d <your-database> -f backend/scripts/migrate_postgres.sql
   ```

   Or if you're already connected to psql:
   ```sql
   \i backend/scripts/migrate_postgres.sql
   ```

### Option 2: Manual SQL Commands

If you prefer to run commands manually:

```sql
-- Convert CHAR to VARCHAR
BEGIN;

ALTER TABLE users ALTER COLUMN uuid TYPE varchar(20);
ALTER TABLE users ALTER COLUMN birthday TYPE varchar(10);
ALTER TABLE groups ALTER COLUMN uuid TYPE varchar(20);
ALTER TABLE groups ALTER COLUMN owner_id TYPE varchar(20);
ALTER TABLE groups ALTER COLUMN members TYPE jsonb USING members::jsonb;
ALTER TABLE contacts ALTER COLUMN user_id TYPE varchar(20);
ALTER TABLE contacts ALTER COLUMN contact_id TYPE varchar(20);
ALTER TABLE contact_applies ALTER COLUMN uuid TYPE varchar(20);
ALTER TABLE contact_applies ALTER COLUMN user_id TYPE varchar(20);
ALTER TABLE contact_applies ALTER COLUMN contact_id TYPE varchar(20);
ALTER TABLE sessions ALTER COLUMN uuid TYPE varchar(20);
ALTER TABLE sessions ALTER COLUMN send_id TYPE varchar(20);
ALTER TABLE sessions ALTER COLUMN receive_id TYPE varchar(20);
ALTER TABLE messages ALTER COLUMN uuid TYPE varchar(20);
ALTER TABLE messages ALTER COLUMN session_id TYPE varchar(20);
ALTER TABLE messages ALTER COLUMN send_id TYPE varchar(20);
ALTER TABLE messages ALTER COLUMN receive_id TYPE varchar(20);

COMMIT;

-- Clean up trailing spaces
BEGIN;

UPDATE users SET uuid = TRIM(uuid), birthday = TRIM(birthday);
UPDATE groups SET uuid = TRIM(uuid), owner_id = TRIM(owner_id);
UPDATE contacts SET user_id = TRIM(user_id), contact_id = TRIM(contact_id);
UPDATE contact_applies SET uuid = TRIM(uuid), user_id = TRIM(user_id), contact_id = TRIM(contact_id);
UPDATE sessions SET uuid = TRIM(uuid), send_id = TRIM(send_id), receive_id = TRIM(receive_id);
UPDATE messages SET uuid = TRIM(uuid), session_id = TRIM(session_id), send_id = TRIM(send_id), receive_id = TRIM(receive_id);

COMMIT;
```

### Option 3: Drop and Recreate Tables (Development Only)

⚠️ **WARNING: This will DELETE ALL DATA!** Only use this in development.

```bash
# Connect to PostgreSQL
psql -h <your-host> -U <your-user> -d <your-database>

# Drop all tables
DROP TABLE IF EXISTS messages, sessions, contact_applies, contacts, groups, users CASCADE;

# Exit psql
\q

# Restart your backend - it will auto-migrate with the new schema
cd backend
go run cmd/server/main.go
```

## Verification

After applying the migration, verify the changes:

```sql
-- Check column types
SELECT
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'groups', 'contacts', 'contact_applies', 'sessions', 'messages')
  AND column_name LIKE '%id' OR column_name = 'uuid'
ORDER BY table_name, column_name;

-- Should show VARCHAR instead of CHAR
```

## Testing

1. **Start the backend:**
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

2. **Test friend request flow:**
   - Send a friend request from one user to another
   - Accept the friend request from the receiving user
   - Verify no 404 errors occur

3. **Check the API response:**
   ```bash
   # Get pending requests
   curl -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/requests/pending

   # Accept a request (replace UUID with actual value)
   curl -X POST -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/requests/A0f84212a-03/accept
   ```

## Additional PostgreSQL Optimizations

Since you're now using PostgreSQL, consider these additional optimizations:

### 1. Use JSONB instead of JSON
✅ Already done for `groups.members`

### 2. Add Indexes for Better Performance
```sql
-- Add GIN index for JSONB columns
CREATE INDEX idx_groups_members ON groups USING GIN (members);

-- Add partial indexes for active records
CREATE INDEX idx_users_active ON users (uuid) WHERE status = 0 AND deleted_at IS NULL;
CREATE INDEX idx_messages_recent ON messages (session_id, created_at DESC) WHERE deleted_at IS NULL;
```

### 3. Enable UUID Extension (Optional)
If you want to use PostgreSQL's native UUID type in the future:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Rollback Plan

If you need to rollback:

```sql
BEGIN;

ALTER TABLE users ALTER COLUMN uuid TYPE char(20);
-- ... repeat for all columns ...

COMMIT;
```

## Summary

✅ **Fixed Issues:**
1. CHAR padding causing 404 errors in API routes
2. Improved PostgreSQL compatibility
3. Better JSON handling with JSONB

✅ **Files Modified:**
- All model files updated
- Migration script created
- Documentation added

🚀 **Next Steps:**
1. Run the migration script
2. Restart your backend
3. Test friend request functionality
4. Monitor for any other PostgreSQL-specific issues
