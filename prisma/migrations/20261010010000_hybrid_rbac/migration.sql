-- Schema-only diff, with preservation backfill before adding the role foreign key.
BEGIN;
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
CREATE TABLE "Role" (
 "key" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "isSystem" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE TABLE "RolePermission" (
 "roleKey" TEXT NOT NULL, "permission" TEXT NOT NULL,
 CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleKey", "permission"),
 CONSTRAINT "RolePermission_permission_check" CHECK ("permission" IN ('dashboard.view', 'resumes.view', 'resumes.edit', 'resumes.download', 'resumes.import', 'resumes.export', 'resumes.retry', 'resumes.retry_all', 'batches.view', 'batches.manage', 'settings.view', 'users.view', 'users.create', 'users.update', 'users.set_active', 'users.reset_password', 'roles.view', 'roles.manage', 'users.assign_role', 'users.manage_grants'))
);
CREATE TABLE "UserPermissionGrant" (
 "userId" TEXT NOT NULL, "permission" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "UserPermissionGrant_pkey" PRIMARY KEY ("userId", "permission"),
 CONSTRAINT "UserPermissionGrant_permission_check" CHECK ("permission" IN ('dashboard.view', 'resumes.view', 'resumes.edit', 'resumes.download', 'resumes.import', 'resumes.export', 'resumes.retry', 'resumes.retry_all', 'batches.view', 'batches.manage', 'settings.view', 'users.view', 'users.create', 'users.update', 'users.set_active', 'users.reset_password', 'roles.view', 'roles.manage', 'users.assign_role', 'users.manage_grants'))
);
-- Every legacy role value is retained verbatim. Only ADMIN receives permissions.
INSERT INTO "Role" ("key", "name", "isSystem", "updatedAt") VALUES ('ADMIN', 'ADMIN', true, CURRENT_TIMESTAMP);
INSERT INTO "Role" ("key", "name", "updatedAt") SELECT DISTINCT "role", "role", CURRENT_TIMESTAMP FROM "User" WHERE "role" <> 'ADMIN';
INSERT INTO "RolePermission" ("roleKey", "permission") SELECT 'ADMIN', permission FROM (VALUES
('dashboard.view'),
('resumes.view'),
('resumes.edit'),
('resumes.download'),
('resumes.import'),
('resumes.export'),
('resumes.retry'),
('resumes.retry_all'),
('batches.view'),
('batches.manage'),
('settings.view'),
('users.view'),
('users.create'),
('users.update'),
('users.set_active'),
('users.reset_password'),
('roles.view'),
('roles.manage'),
('users.assign_role'),
('users.manage_grants')
) AS catalog(permission);
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("key") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "Role"("key") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE "UserPermissionGrant" ADD CONSTRAINT "UserPermissionGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Fail safely on legacy normalization collisions; never merge or rewrite accounts.
CREATE UNIQUE INDEX "User_email_normalized_key" ON "User" (lower(btrim("email")));
COMMIT;
