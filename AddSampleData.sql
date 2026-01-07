-- Add Sample Data for Testing

USE AttendanceManagementDB;
GO

-- Add Sessions
IF NOT EXISTS (SELECT 1 FROM Sessions WHERE SessionName = 'Fall 2025')
BEGIN
    INSERT INTO Sessions (SessionName, StartDate, EndDate, IsActive)
    VALUES ('Fall 2025', '2025-08-01', '2025-12-31', 1);
END

IF NOT EXISTS (SELECT 1 FROM Sessions WHERE SessionName = 'Spring 2026')
BEGIN
    INSERT INTO Sessions (SessionName, StartDate, EndDate, IsActive)
    VALUES ('Spring 2026', '2026-01-01', '2026-05-31', 1);
END

-- Add Sections
IF NOT EXISTS (SELECT 1 FROM Sections WHERE SectionName = 'Section A')
BEGIN
    INSERT INTO Sections (SectionName, SessionId, IsActive)
    VALUES ('Section A', 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM Sections WHERE SectionName = 'Section B')
BEGIN
    INSERT INTO Sections (SectionName, SessionId, IsActive)
    VALUES ('Section B', 1, 1);
END

-- Add Courses
IF NOT EXISTS (SELECT 1 FROM Courses WHERE CourseCode = 'CS101')
BEGIN
    INSERT INTO Courses (CourseCode, CourseName, CreditHours, IsActive)
    VALUES ('CS101', 'Introduction to Programming', 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM Courses WHERE CourseCode = 'CS201')
BEGIN
    INSERT INTO Courses (CourseCode, CourseName, CreditHours, IsActive)
    VALUES ('CS201', 'Data Structures', 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM Courses WHERE CourseCode = 'CS301')
BEGIN
    INSERT INTO Courses (CourseCode, CourseName, CreditHours, IsActive)
    VALUES ('CS301', 'Database Systems', 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM Courses WHERE CourseCode = 'ENG101')
BEGIN
    INSERT INTO Courses (CourseCode, CourseName, CreditHours, IsActive)
    VALUES ('ENG101', 'English Composition', 3, 1);
END

-- Update Student Sections
UPDATE Students SET SectionId = 1 WHERE UserId IN (SELECT UserId FROM Users WHERE Role = 'Student');

-- Get IDs
DECLARE @TeacherId INT = (SELECT TeacherId FROM Teachers WHERE UserId = (SELECT UserId FROM Users WHERE Username = 'Wahla'));
DECLARE @Student1Id INT = (SELECT StudentId FROM Students WHERE UserId = (SELECT UserId FROM Users WHERE Username = 'Ali'));
DECLARE @Student2Id INT = (SELECT StudentId FROM Students WHERE UserId = (SELECT UserId FROM Users WHERE Username = 'Abubaker'));
DECLARE @Course1Id INT = (SELECT CourseId FROM Courses WHERE CourseCode = 'CS101');
DECLARE @Course2Id INT = (SELECT CourseId FROM Courses WHERE CourseCode = 'CS201');
DECLARE @Session1Id INT = (SELECT SessionId FROM Sessions WHERE SessionName = 'Fall 2025');
DECLARE @Section1Id INT = (SELECT SectionId FROM Sections WHERE SectionName = 'Section A');

-- Assign Teacher to Courses
IF NOT EXISTS (SELECT 1 FROM CourseTeachers WHERE TeacherId = @TeacherId AND CourseId = @Course1Id)
BEGIN
    INSERT INTO CourseTeachers (CourseId, TeacherId, SectionId, SessionId, AssignedDate)
    VALUES (@Course1Id, @TeacherId, @Section1Id, @Session1Id, GETDATE());
END

IF NOT EXISTS (SELECT 1 FROM CourseTeachers WHERE TeacherId = @TeacherId AND CourseId = @Course2Id)
BEGIN
    INSERT INTO CourseTeachers (CourseId, TeacherId, SectionId, SessionId, AssignedDate)
    VALUES (@Course2Id, @TeacherId, @Section1Id, @Session1Id, GETDATE());
END

-- Enroll Students in Courses
IF NOT EXISTS (SELECT 1 FROM CourseEnrollments WHERE StudentId = @Student1Id AND CourseId = @Course1Id)
BEGIN
    INSERT INTO CourseEnrollments (StudentId, CourseId, SessionId, EnrollmentDate, Status)
    VALUES (@Student1Id, @Course1Id, @Session1Id, GETDATE(), 'Active');
END

IF NOT EXISTS (SELECT 1 FROM CourseEnrollments WHERE StudentId = @Student1Id AND CourseId = @Course2Id)
BEGIN
    INSERT INTO CourseEnrollments (StudentId, CourseId, SessionId, EnrollmentDate, Status)
    VALUES (@Student1Id, @Course2Id, @Session1Id, GETDATE(), 'Active');
END

IF NOT EXISTS (SELECT 1 FROM CourseEnrollments WHERE StudentId = @Student2Id AND CourseId = @Course1Id)
BEGIN
    INSERT INTO CourseEnrollments (StudentId, CourseId, SessionId, EnrollmentDate, Status)
    VALUES (@Student2Id, @Course1Id, @Session1Id, GETDATE(), 'Active');
END

IF NOT EXISTS (SELECT 1 FROM CourseEnrollments WHERE StudentId = @Student2Id AND CourseId = @Course2Id)
BEGIN
    INSERT INTO CourseEnrollments (StudentId, CourseId, SessionId, EnrollmentDate, Status)
    VALUES (@Student2Id, @Course2Id, @Session1Id, GETDATE(), 'Active');
END

-- Add Sample Attendance Records (last 7 days)
DECLARE @i INT = 0;
WHILE @i < 7
BEGIN
    DECLARE @AttendanceDate DATE = DATEADD(DAY, -@i, GETDATE());
    
    -- Ali's attendance for CS101
    IF NOT EXISTS (SELECT 1 FROM Attendances WHERE StudentId = @Student1Id AND CourseId = @Course1Id AND AttendanceDate = @AttendanceDate)
    BEGIN
        INSERT INTO Attendances (StudentId, CourseId, AttendanceDate, Status, MarkedByTeacherId, MarkedAt)
        VALUES (@Student1Id, @Course1Id, @AttendanceDate, 
                CASE WHEN @i % 3 = 0 THEN 'Present' WHEN @i % 3 = 1 THEN 'Present' ELSE 'Absent' END,
                @TeacherId, GETDATE());
    END
    
    -- Ali's attendance for CS201
    IF NOT EXISTS (SELECT 1 FROM Attendances WHERE StudentId = @Student1Id AND CourseId = @Course2Id AND AttendanceDate = @AttendanceDate)
    BEGIN
        INSERT INTO Attendances (StudentId, CourseId, AttendanceDate, Status, MarkedByTeacherId, MarkedAt)
        VALUES (@Student1Id, @Course2Id, @AttendanceDate, 'Present', @TeacherId, GETDATE());
    END
    
    -- Abubaker's attendance for CS101
    IF NOT EXISTS (SELECT 1 FROM Attendances WHERE StudentId = @Student2Id AND CourseId = @Course1Id AND AttendanceDate = @AttendanceDate)
    BEGIN
        INSERT INTO Attendances (StudentId, CourseId, AttendanceDate, Status, MarkedByTeacherId, MarkedAt)
        VALUES (@Student2Id, @Course1Id, @AttendanceDate, 
                CASE WHEN @i % 4 = 0 THEN 'Absent' WHEN @i % 4 = 1 THEN 'Late' ELSE 'Present' END,
                @TeacherId, GETDATE());
    END
    
    -- Abubaker's attendance for CS201
    IF NOT EXISTS (SELECT 1 FROM Attendances WHERE StudentId = @Student2Id AND CourseId = @Course2Id AND AttendanceDate = @AttendanceDate)
    BEGIN
        INSERT INTO Attendances (StudentId, CourseId, AttendanceDate, Status, MarkedByTeacherId, MarkedAt)
        VALUES (@Student2Id, @Course2Id, @AttendanceDate, 'Present', @TeacherId, GETDATE());
    END
    
    SET @i = @i + 1;
END

-- Add Timetable Entries
IF NOT EXISTS (SELECT 1 FROM TimetableEntries WHERE CourseId = @Course1Id AND SectionId = @Section1Id AND DayOfWeek = 'Monday')
BEGIN
    INSERT INTO TimetableEntries (CourseId, TeacherId, SectionId, DayOfWeek, StartTime, EndTime, RoomNumber)
    VALUES (@Course1Id, @TeacherId, @Section1Id, 'Monday', '09:00:00', '11:00:00', 'Room 101');
END

IF NOT EXISTS (SELECT 1 FROM TimetableEntries WHERE CourseId = @Course1Id AND SectionId = @Section1Id AND DayOfWeek = 'Wednesday')
BEGIN
    INSERT INTO TimetableEntries (CourseId, TeacherId, SectionId, DayOfWeek, StartTime, EndTime, RoomNumber)
    VALUES (@Course1Id, @TeacherId, @Section1Id, 'Wednesday', '09:00:00', '11:00:00', 'Room 101');
END

IF NOT EXISTS (SELECT 1 FROM TimetableEntries WHERE CourseId = @Course2Id AND SectionId = @Section1Id AND DayOfWeek = 'Tuesday')
BEGIN
    INSERT INTO TimetableEntries (CourseId, TeacherId, SectionId, DayOfWeek, StartTime, EndTime, RoomNumber)
    VALUES (@Course2Id, @TeacherId, @Section1Id, 'Tuesday', '11:00:00', '13:00:00', 'Room 102');
END

IF NOT EXISTS (SELECT 1 FROM TimetableEntries WHERE CourseId = @Course2Id AND SectionId = @Section1Id AND DayOfWeek = 'Thursday')
BEGIN
    INSERT INTO TimetableEntries (CourseId, TeacherId, SectionId, DayOfWeek, StartTime, EndTime, RoomNumber)
    VALUES (@Course2Id, @TeacherId, @Section1Id, 'Thursday', '11:00:00', '13:00:00', 'Room 102');
END

PRINT 'Sample data added successfully!';
GO

-- Verify data
SELECT 'Sessions' as TableName, COUNT(*) as Count FROM Sessions
UNION ALL
SELECT 'Sections', COUNT(*) FROM Sections
UNION ALL
SELECT 'Courses', COUNT(*) FROM Courses
UNION ALL
SELECT 'Teachers', COUNT(*) FROM Teachers
UNION ALL
SELECT 'Students', COUNT(*) FROM Students
UNION ALL
SELECT 'CourseTeachers', COUNT(*) FROM CourseTeachers
UNION ALL
SELECT 'CourseEnrollments', COUNT(*) FROM CourseEnrollments
UNION ALL
SELECT 'Attendances', COUNT(*) FROM Attendances
UNION ALL
SELECT 'TimetableEntries', COUNT(*) FROM TimetableEntries;
