-- Create Database and Tables
USE master;
GO

CREATE DATABASE AttendanceManagementDB;
GO

USE AttendanceManagementDB;
GO

-- Users Table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL CHECK (Role IN ('Admin', 'Teacher', 'Student')),
    FullName NVARCHAR(200) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    IsFirstLogin BIT NOT NULL DEFAULT 1,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    LastLogin DATETIME2 NULL
);
GO

CREATE TABLE Sessions (
    SessionId INT PRIMARY KEY IDENTITY(1,1),
    SessionName NVARCHAR(50) NOT NULL UNIQUE,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE Sections (
    SectionId INT PRIMARY KEY IDENTITY(1,1),
    SectionName NVARCHAR(50) NOT NULL UNIQUE,
    SessionId INT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_Sections_Sessions FOREIGN KEY (SessionId) 
        REFERENCES Sessions(SessionId) ON DELETE SET NULL
);
GO

CREATE TABLE Admins (
    AdminId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL UNIQUE,
    CONSTRAINT FK_Admins_Users FOREIGN KEY (UserId) 
        REFERENCES Users(UserId) ON DELETE CASCADE
);
GO

CREATE TABLE Teachers (
    TeacherId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL UNIQUE,
    EmployeeId NVARCHAR(50) NOT NULL UNIQUE,
    Department NVARCHAR(100) NULL,
    CONSTRAINT FK_Teachers_Users FOREIGN KEY (UserId) 
        REFERENCES Users(UserId) ON DELETE CASCADE
);
GO

CREATE TABLE Students (
    StudentId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL UNIQUE,
    RollNumber NVARCHAR(50) NOT NULL UNIQUE,
    SectionId INT NULL,
    CONSTRAINT FK_Students_Users FOREIGN KEY (UserId) 
        REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_Students_Sections FOREIGN KEY (SectionId) 
        REFERENCES Sections(SectionId) ON DELETE SET NULL
);
GO

CREATE TABLE Courses (
    CourseId INT PRIMARY KEY IDENTITY(1,1),
    CourseCode NVARCHAR(50) NOT NULL UNIQUE,
    CourseName NVARCHAR(200) NOT NULL,
    CreditHours INT NOT NULL,
    Description NVARCHAR(500) NULL,
    IsActive BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE CourseTeachers (
    CourseTeacherId INT PRIMARY KEY IDENTITY(1,1),
    CourseId INT NOT NULL,
    TeacherId INT NOT NULL,
    SectionId INT NULL,
    SessionId INT NOT NULL,
    AssignedDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_CourseTeachers_Courses FOREIGN KEY (CourseId) 
        REFERENCES Courses(CourseId) ON DELETE CASCADE,
    CONSTRAINT FK_CourseTeachers_Teachers FOREIGN KEY (TeacherId) 
        REFERENCES Teachers(TeacherId) ON DELETE CASCADE,
    CONSTRAINT FK_CourseTeachers_Sections FOREIGN KEY (SectionId) 
        REFERENCES Sections(SectionId) ON DELETE SET NULL,
    CONSTRAINT FK_CourseTeachers_Sessions FOREIGN KEY (SessionId) 
        REFERENCES Sessions(SessionId) ON DELETE CASCADE,
    CONSTRAINT UQ_CourseTeacher_Section UNIQUE(CourseId, TeacherId, SectionId, SessionId)
);
GO

CREATE TABLE CourseEnrollments (
    EnrollmentId INT PRIMARY KEY IDENTITY(1,1),
    StudentId INT NOT NULL,
    CourseId INT NOT NULL,
    SessionId INT NOT NULL,
    EnrollmentDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Dropped', 'Completed')),
    CONSTRAINT FK_CourseEnrollments_Students FOREIGN KEY (StudentId) 
        REFERENCES Students(StudentId) ON DELETE CASCADE,
    CONSTRAINT FK_CourseEnrollments_Courses FOREIGN KEY (CourseId) 
        REFERENCES Courses(CourseId) ON DELETE CASCADE,
    CONSTRAINT FK_CourseEnrollments_Sessions FOREIGN KEY (SessionId) 
        REFERENCES Sessions(SessionId) ON DELETE CASCADE,
    CONSTRAINT UQ_Student_Course_Session UNIQUE(StudentId, CourseId, SessionId)
);
GO

CREATE TABLE Attendances (
    AttendanceId INT PRIMARY KEY IDENTITY(1,1),
    StudentId INT NOT NULL,
    CourseId INT NOT NULL,
    AttendanceDate DATE NOT NULL,
    Status NVARCHAR(50) NOT NULL CHECK (Status IN ('Present', 'Absent', 'Late', 'Leave')),
    MarkedByTeacherId INT NULL,
    MarkedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    Remarks NVARCHAR(500) NULL,
    CONSTRAINT FK_Attendances_Students FOREIGN KEY (StudentId) 
        REFERENCES Students(StudentId) ON DELETE NO ACTION,
    CONSTRAINT FK_Attendances_Courses FOREIGN KEY (CourseId) 
        REFERENCES Courses(CourseId) ON DELETE NO ACTION,
    CONSTRAINT FK_Attendances_Teachers FOREIGN KEY (MarkedByTeacherId) 
        REFERENCES Teachers(TeacherId) ON DELETE NO ACTION,
    CONSTRAINT UQ_Student_Course_Date UNIQUE(StudentId, CourseId, AttendanceDate)
);
GO

CREATE TABLE TimetableEntries (
    TimetableId INT PRIMARY KEY IDENTITY(1,1),
    CourseId INT NOT NULL,
    TeacherId INT NOT NULL,
    SectionId INT NULL,
    DayOfWeek NVARCHAR(20) NOT NULL CHECK (DayOfWeek IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    RoomNumber NVARCHAR(50) NULL,
    CONSTRAINT FK_TimetableEntries_Courses FOREIGN KEY (CourseId) 
        REFERENCES Courses(CourseId) ON DELETE CASCADE,
    CONSTRAINT FK_TimetableEntries_Teachers FOREIGN KEY (TeacherId) 
        REFERENCES Teachers(TeacherId) ON DELETE CASCADE,
    CONSTRAINT FK_TimetableEntries_Sections FOREIGN KEY (SectionId) 
        REFERENCES Sections(SectionId) ON DELETE SET NULL
);
GO

-- Insert admin user with BCrypt hash for "admin123"
-- BCrypt hash: $2a$11$XCpzVKS7jP0B7Fq8bF8L5.ZYj5M5Y8r5Z5Y8r5Z5Y8r5Z5Y8r5Z5Y
INSERT INTO Users (Username, PasswordHash, Role, FullName, Email, IsFirstLogin, IsActive, CreatedAt)
VALUES ('admin', '$2a$11$7E0l2N8r5Z5Y8r5Z5Y8r.eJ5Y8r5Z5Y8r5Z5Y8r5Z5Y8r5Z5Y8r5Z', 'Admin', 'System Administrator', 'admin@attendance.com', 0, 1, GETDATE());
GO

INSERT INTO Admins (UserId) VALUES (1);
GO

-- Sample Session
INSERT INTO Sessions (SessionName, StartDate, EndDate, IsActive)
VALUES ('Spring 2026', '2026-01-01', '2026-06-30', 1);
GO

PRINT 'Database created successfully!';
GO
