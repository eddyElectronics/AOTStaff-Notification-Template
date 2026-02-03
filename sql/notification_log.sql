USE [Notification];
GO

-- =============================================
-- Table: NotificationJobs - เก็บข้อมูล Job การส่ง
-- =============================================
IF OBJECT_ID(N'dbo.NotificationJobs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.NotificationJobs (
    JobId           BIGINT IDENTITY(1,1) PRIMARY KEY,
    TemplateContent NVARCHAR(MAX) NULL,
    TotalRecords    INT NOT NULL DEFAULT(0),
    SuccessCount    INT NOT NULL DEFAULT(0),
    FailCount       INT NOT NULL DEFAULT(0),
    Status          NVARCHAR(20) NOT NULL DEFAULT('Pending'), -- Pending/Running/Completed/Failed
    CreatedBy       NVARCHAR(200) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT(SYSDATETIME()),
    CompletedAt     DATETIME2 NULL
  );
END
GO

-- =============================================
-- Table: NotificationLogs - เก็บ log การส่งแต่ละรายการ
-- =============================================
IF OBJECT_ID(N'dbo.NotificationLogs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.NotificationLogs (
    LogId           BIGINT IDENTITY(1,1) PRIMARY KEY,
    JobId           BIGINT NOT NULL,
    RowNumber       INT NOT NULL,
    Username        NVARCHAR(200) NOT NULL,
    Message         NVARCHAR(MAX) NULL,
    Status          NVARCHAR(20) NOT NULL, -- Success/Failed
    ErrorMessage    NVARCHAR(1000) NULL,
    SentAt          DATETIME2 NOT NULL DEFAULT(SYSDATETIME()),
    CONSTRAINT FK_NotificationLogs_Jobs
      FOREIGN KEY (JobId) REFERENCES dbo.NotificationJobs(JobId)
  );
END
GO

-- Index for faster queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NotificationLogs_JobId' AND object_id = OBJECT_ID('dbo.NotificationLogs'))
  CREATE INDEX IX_NotificationLogs_JobId ON dbo.NotificationLogs(JobId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NotificationLogs_Username' AND object_id = OBJECT_ID('dbo.NotificationLogs'))
  CREATE INDEX IX_NotificationLogs_Username ON dbo.NotificationLogs(Username);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_NotificationJobs_CreatedAt' AND object_id = OBJECT_ID('dbo.NotificationJobs'))
  CREATE INDEX IX_NotificationJobs_CreatedAt ON dbo.NotificationJobs(CreatedAt DESC);
GO

-- =============================================
-- Stored Procedure: sp_CreateNotificationJob
-- สร้าง Job ใหม่และคืน JobId
-- =============================================
IF OBJECT_ID(N'dbo.sp_CreateNotificationJob', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_CreateNotificationJob;
GO

CREATE PROCEDURE dbo.sp_CreateNotificationJob
  @TemplateContent NVARCHAR(MAX),
  @TotalRecords INT,
  @CreatedBy NVARCHAR(200) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.NotificationJobs (TemplateContent, TotalRecords, Status, CreatedBy)
  VALUES (@TemplateContent, @TotalRecords, 'Running', @CreatedBy);

  SELECT SCOPE_IDENTITY() AS JobId;
END
GO

-- =============================================
-- Stored Procedure: sp_SaveNotificationLog
-- บันทึก log การส่งแต่ละรายการ
-- =============================================
IF OBJECT_ID(N'dbo.sp_SaveNotificationLog', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_SaveNotificationLog;
GO

CREATE PROCEDURE dbo.sp_SaveNotificationLog
  @JobId BIGINT,
  @RowNumber INT,
  @Username NVARCHAR(200),
  @Message NVARCHAR(MAX) = NULL,
  @Status NVARCHAR(20),
  @ErrorMessage NVARCHAR(1000) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.NotificationLogs (JobId, RowNumber, Username, Message, Status, ErrorMessage)
  VALUES (@JobId, @RowNumber, @Username, @Message, @Status, @ErrorMessage);

  -- Update job counts
  IF @Status = 'Success'
    UPDATE dbo.NotificationJobs SET SuccessCount = SuccessCount + 1 WHERE JobId = @JobId;
  ELSE
    UPDATE dbo.NotificationJobs SET FailCount = FailCount + 1 WHERE JobId = @JobId;
END
GO

-- =============================================
-- Stored Procedure: sp_CompleteNotificationJob
-- อัปเดตสถานะ Job เมื่อส่งเสร็จ
-- =============================================
IF OBJECT_ID(N'dbo.sp_CompleteNotificationJob', N'P') IS NOT NULL
  DROP PROCEDURE dbo.sp_CompleteNotificationJob;
GO

CREATE PROCEDURE dbo.sp_CompleteNotificationJob
  @JobId BIGINT
AS
BEGIN
  SET NOCOUNT ON;

  UPDATE dbo.NotificationJobs 
  SET Status = 'Completed',
      CompletedAt = SYSDATETIME()
  WHERE JobId = @JobId;
END
GO
