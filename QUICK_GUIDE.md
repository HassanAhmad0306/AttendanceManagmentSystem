# 🎯 Quick Guide - Where to Find Everything

## 📍 ADMIN: How to Assign Teacher & Enroll Student

### Step-by-Step:

1. **Login as Admin**
   - Username: `admin`
   - Password: `admin123`
   - Click "Sign In"

2. **Click "🔗 Assignments" in the Left Menu**
   - Look at the left sidebar
   - You'll see 6 menu items
   - Click the 5th one: "🔗 Assignments"

3. **Assign Teacher to Course**
   - You'll see a form: "Assign Teacher to Course"
   - Fill in:
     - **Teacher**: Select "Wahla Bhai (EMP001)"
     - **Course**: Select "CS101 - Introduction to Programming"
     - **Section**: Select "Section A"
     - **Session**: Select "Fall 2025"
   - Click **"Assign Teacher"** button
   - You'll see success message!

4. **Enroll Student in Course**
   - Scroll down to see: "Enroll Student in Course"
   - Fill in:
     - **Student**: Select "Ali Ahmad (ROLL001)"
     - **Course**: Select "CS101 - Introduction to Programming"
     - **Session**: Select "Fall 2025"
   - Click **"Enroll Student"** button
   - You'll see success message!

---

## 👨‍🏫 TEACHER: How to Mark Attendance

### Step-by-Step:

1. **Login as Teacher**
   - Username: `Wahla`
   - Password: `Wahla123`
   - Click "Sign In"

2. **Click "✅ Mark Attendance" in the Left Menu**
   - Look at the left sidebar
   - You'll see 4 menu items:
     1. 📚 My Courses
     2. ✅ Mark Attendance ← **Click This!**
     3. 📋 View Attendance
     4. 👥 Students

3. **Mark Attendance**
   - **Step 1**: Select Course from dropdown
     - Choose: "CS101 - Introduction to Programming"
   
   - **Step 2**: Select Date
     - Choose today's date or any date
   
   - **Step 3**: Student table will appear showing:
     - Roll Number
     - Student Name
     - Email
     - Status dropdown (Present/Absent/Late/Leave)
     - Remarks textbox
     - Mark button
   
   - **Step 4**: For each student:
     - Select status: **Present** or **Absent** or **Late** or **Leave**
     - Add remarks (optional)
   
   - **Step 5**: Click **"💾 Save All Attendance"** button at bottom
   
   - **Done!** ✅ You'll see "Attendance saved successfully!"

4. **View Attendance Records**
   - Click "📋 View Attendance" in menu
   - Select course
   - Filter by date (optional)
   - See all attendance records with dates and statuses

---

## 🔍 Troubleshooting

### If Teacher dropdown is empty:
1. Go to Users section
2. Create a new teacher user
3. Go back to Assignments
4. Refresh the page (F5)

### If Student dropdown is empty:
1. Go to Users section
2. Create a new student user
3. Go back to Assignments
4. Refresh the page (F5)

### If Course dropdown is empty:
1. Go to Courses section
2. Create a new course
3. Go back to Assignments
4. Refresh the page (F5)

### If Section dropdown is empty:
1. Go to Sessions section first
2. Create a session (e.g., "Fall 2025")
3. Go to Sections section
4. Create a section linked to the session
5. Go back to Assignments

### If attendance table doesn't show:
1. Make sure course is selected
2. Make sure date is selected
3. Make sure teacher is assigned to the course
4. Make sure students are enrolled in the course

---

## 📊 Menu Structure

### Admin Dashboard (Left Sidebar):
```
🎓 AMS - Admin
├── 👥 Users          ← Create/manage users
├── 📚 Courses        ← Create courses
├── 🏫 Sections       ← Create sections
├── 📅 Sessions       ← Create sessions/semesters
├── 🔗 Assignments    ← **ASSIGN TEACHERS & ENROLL STUDENTS HERE!**
└── 📊 Reports        ← View statistics
```

### Teacher Dashboard (Left Sidebar):
```
🎓 AMS - Teacher
├── 📚 My Courses          ← View assigned courses
├── ✅ Mark Attendance     ← **MARK ATTENDANCE HERE!**
├── 📋 View Attendance     ← View attendance records
└── 👥 Students            ← View students by course
```

### Student Dashboard (Left Sidebar):
```
🎓 AMS - Student
├── 📊 Overview            ← Attendance statistics
├── ✅ My Attendance       ← View your attendance
├── 📚 My Courses          ← View enrolled courses
└── 🕐 Timetable           ← View class schedule
```

---

## ✅ Verification

### After Assigning Teacher:
1. Login as teacher (Wahla)
2. Go to "My Courses"
3. You should see the assigned course

### After Enrolling Student:
1. Login as student (Ali)
2. Go to "My Courses"
3. You should see the enrolled course

### After Marking Attendance:
1. As teacher: Go to "View Attendance"
2. Select course
3. You should see the marked attendance
4. OR login as student and see it in their dashboard

---

## 🎯 Current Test Data

### Available for Testing:
- ✅ **1 Teacher**: Wahla (assigned to CS101 and CS201)
- ✅ **2 Students**: Ali and Abubaker (enrolled in CS101 and CS201)
- ✅ **5 Courses**: CS101, CS201, CS301, ENG101, etc.
- ✅ **3 Sessions**: Fall 2025, Spring 2026, etc.
- ✅ **3 Sections**: Section A, Section B, etc.
- ✅ **28 Attendance Records**: Sample data already marked

### You Can:
- ✅ Assign more teachers to courses
- ✅ Enroll more students in courses
- ✅ Mark today's attendance
- ✅ View all attendance records
- ✅ Create new users/courses/sections
- ✅ Reset user passwords

---

## 🚀 Quick Test

### Test Assignment (5 minutes):
1. Login as admin
2. Click "🔗 Assignments"
3. Assign Wahla to CS301 course
4. Enroll Ali in ENG101 course
5. Done!

### Test Attendance (5 minutes):
1. Login as Wahla
2. Click "✅ Mark Attendance"
3. Select CS101
4. Select today's date
5. Mark all students
6. Click "Save All Attendance"
7. Go to "View Attendance" to verify

---

**Everything is working! The buttons and forms are all there!** 🎉
