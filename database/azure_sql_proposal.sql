-- PROPOSED starting schema only. Not applied to the current app.
-- Entra workforce/External ID users with validated tid/oid claims.
-- Review identity shape and deployment policy with the owner before applying.
CREATE TABLE dbo.AppUsers (
    id uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
    tenant_id uniqueidentifier NOT NULL,
    entra_object_id uniqueidentifier NOT NULL,
    display_name nvarchar(200) NULL,
    display_email nvarchar(320) NULL,
    CONSTRAINT UQ_AppUsers_Entra UNIQUE (tenant_id, entra_object_id)
);
CREATE TABLE dbo.Projects (
    id uniqueidentifier NOT NULL PRIMARY KEY,
    owner_id uniqueidentifier NOT NULL REFERENCES dbo.AppUsers(id),
    name nvarchar(100) NOT NULL,
    state_json nvarchar(max) NOT NULL,
    revision int NOT NULL DEFAULT 1,
    created_at bigint NOT NULL, -- preserve Unix milliseconds
    updated_at bigint NOT NULL,
    CONSTRAINT CK_Projects_StateJson CHECK (ISJSON(state_json) = 1),
    CONSTRAINT CK_Projects_Revision CHECK (revision > 0)
);
CREATE INDEX IX_Projects_OwnerUpdated ON dbo.Projects(owner_id, updated_at DESC);
CREATE TABLE dbo.LegacyOwnerMappings (
    legacy_owner_id nvarchar(256) NOT NULL PRIMARY KEY,
    new_owner_id uniqueidentifier NOT NULL REFERENCES dbo.AppUsers(id),
    verified_at datetimeoffset NOT NULL,
    verified_by nvarchar(256) NOT NULL
);
-- All project queries must restrict owner_id to the authenticated application user.
-- Updates must also require matching revision, increment it, and check affected rows.
-- Validate ProjectState with the application schema; ISJSON alone is insufficient.
-- Source fields/queue/selection/pricing stay in state_json for a lossless first migration.
