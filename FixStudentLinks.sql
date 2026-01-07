-- Fix student records that might be missing or improperly linked
USE AttendanceManagementDB;
GO

-- Check for users with Student role but no Student record
SELECT 
    u.UserId,
    u.Username,
    u.FullName,
    u.Email,
    u.Role,
    s.StudentId,
    s.RollNumber
FROM Users u
LEFT JOIN Students s ON u.UserId = s.UserId
WHERE u.Role = 'Student'
ORDER BY u.Username;

-- Create Student records for any users with Student role that don't have a Student record
DECLARE @UserId INT;
DECLARE @Year INT = YEAR(GETDATE());
DECLARE @NextNumber INT;
DECLARE @RollNumber VARCHAR(50);

DECLARE student_cursor CURSOR FOR
SELECT u.UserId
FROM Users u
LEFT JOIN Students s ON u.UserId = s.UserId
WHERE u.Role = 'Student' AND s.StudentId IS NULL;

OPEN student_cursor;
FETCH NEXT FROM student_cursor INTO @UserId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Get the next student number
    SELECT @NextNumber = ISNULL(MAX(StudentId), 0) + 1 FROM Students;
    
    -- Generate roll number in format YYYY-CS-XXX
    SET @RollNumber = CAST(@Year AS VARCHAR) + '-CS-' + RIGHT('000' + CAST(@NextNumber AS VARCHAR), 3);
    
    -- Insert student record
    INSERT INTO Students (UserId, RollNumber, SectionId)
    VALUES (@UserId, @RollNumber, NULL);
    
    PRINT 'Created Student record for UserId ' + CAST(@UserId AS VARCHAR) + ' with RollNumber ' + @RollNumber;
    
    FETCH NEXT FROM student_cursor INTO @UserId;
END

CLOSE student_cursor;
DEALLOCATE student_cursor;

-- Verify all students now have records
SELECT 
    u.UserId,
    u.Username,
    u.FullName,
    u.Email,
    s.StudentId,
    s.RollNumber,
    s.SectionId
FROM Users u
LEFT JOIN Students s ON u.UserId = s.UserId
WHERE u.Role = 'Student'
ORDER BY u.Username;

PRINT 'Student record verification complete!';
