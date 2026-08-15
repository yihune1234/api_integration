-- Add 'admin' role to the admins table role check constraint.
-- Existing roles: super_admin | support | read_only
-- New roles:      super_admin | admin | support | read_only
--
-- MySQL 8.0.16+ supports CHECK constraints. To modify, drop and re-add.
-- Use DROP CHECK for CHECK constraints.

ALTER TABLE admins DROP CHECK admins_role_check;
ALTER TABLE admins ADD CONSTRAINT admins_role_check
  CHECK (role IN ('super_admin', 'admin', 'support', 'read_only'));
