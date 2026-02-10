USE [Notification];
GO

-- =============================================
-- Table: AuthorizedUsers - เก็บรายชื่อผู้มีสิทธิ์ใช้งานระบบ
-- =============================================

-- Drop existing table if exists (WARNING: จะลบข้อมูลเดิม)
IF OBJECT_ID(N'dbo.AuthorizedUsers', N'U') IS NOT NULL
BEGIN
  DROP TABLE dbo.AuthorizedUsers;
END
GO

-- Create new table with EmployeeId and IsAdmin
CREATE TABLE dbo.AuthorizedUsers (
  Id              INT IDENTITY(1,1) PRIMARY KEY,
  EmployeeId      NVARCHAR(50) NOT NULL UNIQUE,
  IsAdmin         BIT NOT NULL DEFAULT(0),
  IsActive        BIT NOT NULL DEFAULT(1),
  CreatedAt       DATETIME2 NOT NULL DEFAULT(SYSDATETIME()),
  UpdatedAt       DATETIME2 NULL
);
GO

-- Index for faster lookup
CREATE INDEX IX_AuthorizedUsers_EmployeeId ON dbo.AuthorizedUsers(EmployeeId);
GO

-- =============================================
-- Stored Procedure: sp_CheckAuthorizedUser
-- ตรวจสอบว่า EmployeeId มีสิทธิ์ใช้งานหรือไม่
-- =============================================
IF OBJECT_ID(N'dbo.sp_CheckAuthorizedUser', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_CheckAuthorizedUser;
GO

CREATE PROCEDURE dbo.sp_CheckAuthorizedUser
  @EmployeeId NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  SELECT 
    Id,
    EmployeeId,
    IsAdmin,
    IsActive,
    CASE WHEN IsActive = 1 THEN 1 ELSE 0 END AS IsAuthorized
  FROM dbo.AuthorizedUsers
  WHERE EmployeeId = @EmployeeId AND IsActive = 1;
END
GO

-- =============================================
-- Stored Procedure: sp_AddAuthorizedUser
-- เพิ่มผู้ใช้งานที่มีสิทธิ์
-- =============================================
IF OBJECT_ID(N'dbo.sp_AddAuthorizedUser', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_AddAuthorizedUser;
GO

CREATE PROCEDURE dbo.sp_AddAuthorizedUser
  @EmployeeId NVARCHAR(50),
  @IsAdmin BIT = 0
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS (SELECT 1 FROM dbo.AuthorizedUsers WHERE EmployeeId = @EmployeeId)
  BEGIN
    -- Update existing user
    UPDATE dbo.AuthorizedUsers
    SET IsActive = 1,
        IsAdmin = @IsAdmin,
        UpdatedAt = SYSDATETIME()
    WHERE EmployeeId = @EmployeeId;
  END
  ELSE
  BEGIN
    -- Insert new user
    INSERT INTO dbo.AuthorizedUsers (EmployeeId, IsAdmin)
    VALUES (@EmployeeId, @IsAdmin);
  END

  SELECT 'Success' AS Result, @EmployeeId AS EmployeeId;
END
GO

-- =============================================
-- Stored Procedure: sp_RemoveAuthorizedUser
-- ลบสิทธิ์ผู้ใช้งาน (soft delete)
-- =============================================
IF OBJECT_ID(N'dbo.sp_RemoveAuthorizedUser', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_RemoveAuthorizedUser;
GO

CREATE PROCEDURE dbo.sp_RemoveAuthorizedUser
  @EmployeeId NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE dbo.AuthorizedUsers
  SET IsActive = 0,
      UpdatedAt = SYSDATETIME()
  WHERE EmployeeId = @EmployeeId;

  SELECT 'Success' AS Result, @EmployeeId AS EmployeeId;
END
GO

-- =============================================
-- Stored Procedure: sp_GetAllAuthorizedUsers
-- ดึงรายชื่อผู้ใช้งานทั้งหมด
-- =============================================
IF OBJECT_ID(N'dbo.sp_GetAllAuthorizedUsers', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_GetAllAuthorizedUsers;
GO

CREATE PROCEDURE dbo.sp_GetAllAuthorizedUsers
AS
BEGIN
  SET NOCOUNT ON;

  SELECT 
    Id,
    EmployeeId,
    IsAdmin,
    IsActive,
    CreatedAt,
    UpdatedAt
  FROM dbo.AuthorizedUsers
  ORDER BY CreatedAt DESC;
END
GO

-- =============================================
-- Stored Procedure: sp_UpdateUserAdmin
-- อัปเดตสถานะ Admin
-- =============================================
IF OBJECT_ID(N'dbo.sp_UpdateUserAdmin', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_UpdateUserAdmin;
GO

CREATE PROCEDURE dbo.sp_UpdateUserAdmin
  @EmployeeId NVARCHAR(50),
  @IsAdmin BIT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE dbo.AuthorizedUsers
  SET IsAdmin = @IsAdmin,
      UpdatedAt = SYSDATETIME()
  WHERE EmployeeId = @EmployeeId;

  SELECT 'Success' AS Result, @EmployeeId AS EmployeeId;
END
GO

-- =============================================
-- Sample Data (ตัวอย่างข้อมูล)
-- =============================================
INSERT INTO dbo.AuthorizedUsers (EmployeeId, IsAdmin)
VALUES ('484074', 1);
GO

-- ตรวจสอบข้อมูล
SELECT * FROM dbo.AuthorizedUsers;
GO
