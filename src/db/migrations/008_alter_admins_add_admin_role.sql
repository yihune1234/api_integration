-- Add 'admin' role to the admins table role check constraint.
-- Existing roles: super_admin | support | read_only
-- New roles:      super_admin | admin | support | read_only
--
-- MySQL does not support ALTER CONSTRAINT directly; we must drop and re-add
-- the CHECK constraint. MariaDB (used in dev) supports DROP CONSTRAINT.

ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE admins ADD CONSTRAINT admins_role_check
  CHECK (role IN ('super_admin', 'admin', 'support', 'read_only'));
