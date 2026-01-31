-- PostgreSQL Migration Script
-- Converts CHAR columns to VARCHAR to prevent space padding issues

-- Start transaction
BEGIN;

-- Update users table
ALTER TABLE users
  ALTER COLUMN uuid TYPE varchar(20),
  ALTER COLUMN birthday TYPE varchar(10);

-- Update groups table
ALTER TABLE groups
  ALTER COLUMN uuid TYPE varchar(20),
  ALTER COLUMN owner_id TYPE varchar(20),
  ALTER COLUMN members TYPE jsonb USING members::jsonb;

-- Update contacts table
ALTER TABLE contacts
  ALTER COLUMN user_id TYPE varchar(20),
  ALTER COLUMN contact_id TYPE varchar(20);

-- Update contact_applies table
ALTER TABLE contact_applies
  ALTER COLUMN uuid TYPE varchar(20),
  ALTER COLUMN user_id TYPE varchar(20),
  ALTER COLUMN contact_id TYPE varchar(20);

-- Update sessions table
ALTER TABLE sessions
  ALTER COLUMN uuid TYPE varchar(20),
  ALTER COLUMN send_id TYPE varchar(20),
  ALTER COLUMN receive_id TYPE varchar(20);

-- Update messages table
ALTER TABLE messages
  ALTER COLUMN uuid TYPE varchar(20),
  ALTER COLUMN session_id TYPE varchar(20),
  ALTER COLUMN send_id TYPE varchar(20),
  ALTER COLUMN receive_id TYPE varchar(20);

-- Commit transaction
COMMIT;

-- Clean up any trailing spaces in existing data
BEGIN;

UPDATE users SET uuid = TRIM(uuid), birthday = TRIM(birthday);
UPDATE groups SET uuid = TRIM(uuid), owner_id = TRIM(owner_id);
UPDATE contacts SET user_id = TRIM(user_id), contact_id = TRIM(contact_id);
UPDATE contact_applies SET uuid = TRIM(uuid), user_id = TRIM(user_id), contact_id = TRIM(contact_id);
UPDATE sessions SET uuid = TRIM(uuid), send_id = TRIM(send_id), receive_id = TRIM(receive_id);
UPDATE messages SET uuid = TRIM(uuid), session_id = TRIM(session_id), send_id = TRIM(send_id), receive_id = TRIM(receive_id);

COMMIT;
