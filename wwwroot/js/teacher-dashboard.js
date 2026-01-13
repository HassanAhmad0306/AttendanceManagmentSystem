const API_URL = 'http://localhost:5000/api';

// Get authentication data (Authentication is now fully server-side via Cookies)
let token = null; // Token is HttpOnly
let currentTeacherId = null;
let currentTeacherCourses = [];
let currentUserId = null;
let currentUserRole = null;


// Set theme on load (persist dark/light mode) and provide toggle logic
// Verify session with backend and load initial data


// Verify session with backend and load initial data
async function validateSession() {
    try {
        showLoading();
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {},
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Session invalid');
        }

        const user = await response.json();

        if (user.role !== 'Teacher') {
            window.location.href = 'index.html';
            return;
        }

        // Set global variables
        currentUserId = user.userId;
        currentTeacherId = user.userId;
        currentUserRole = user.role;
        document.getElementById('userName').textContent = user.fullName || user.username;

        // Now safe to load teacher specific data
        await loadTeacherCourses();
        hideLoading();

    } catch (e) {
        console.error('Session validation failed:', e);
        await clearAuthData();
        window.location.href = 'index.html';
    }
}
validateSession();

// Change Password Modal Functions
function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'flex';
    document.getElementById('changePasswordForm').reset();
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

async function handleChangePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
        alert('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                userId: parseInt(currentUserId),
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('✅ ' + result.message);
            closeChangePasswordModal();
        } else {
            alert('❌ ' + (result.message || 'Failed to change password'));
        }
    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error changing password. Please try again.');
    }
}

// Close modal when clicking outside
window.addEventListener('click', function (event) {
    const modal = document.getElementById('changePasswordModal');
    if (event.target === modal) {
        closeChangePasswordModal();
    }
});

// Update status dropdown color based on selected value
function updateStatusColor(select) {
    // Remove all status classes
    select.classList.remove('status-present', 'status-absent', 'status-late', 'status-leave');

    // Add class based on selected value
    const value = select.value;
    if (value === 'Present') select.classList.add('status-present');
    else if (value === 'Absent') select.classList.add('status-absent');
    else if (value === 'Late') select.classList.add('status-late');
    else if (value === 'Leave') select.classList.add('status-leave');
}

// ==========================================
// HCI ENHANCEMENT: TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'success', title = null) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('role', 'alert');
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }

    const config = {
        success: { icon: '✅', defaultTitle: 'Success!' },
        error: { icon: '❌', defaultTitle: 'Error!' },
        warning: { icon: '⚠️', defaultTitle: 'Warning!' },
        info: { icon: 'ℹ️', defaultTitle: 'Info' }
    };

    const { icon, defaultTitle } = config[type] || config.info;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${title || defaultTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// HCI: Confirmation Modal
function showConfirmModal(options) {
    return new Promise((resolve) => {
        const { title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' } = options;
        const icons = { warning: '⚠️', danger: '🗑️', success: '✅', info: 'ℹ️' };

        const existingModal = document.querySelector('.confirm-modal-overlay');
        if (existingModal) existingModal.remove();

        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay active';
        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true">
                <div class="confirm-modal-icon ${type}">${icons[type]}</div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-modal-actions">
                    <button class="btn-confirm-cancel" id="confirmCancel">${cancelText}</button>
                    <button class="btn-confirm-${type === 'danger' ? 'danger' : 'success'}" id="confirmOk">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Focus trap for accessibility - Tab stays within modal
        const cancelBtn = overlay.querySelector('#confirmCancel');
        const confirmBtn = overlay.querySelector('#confirmOk');
        const focusableElements = [cancelBtn, confirmBtn];
        let currentFocusIndex = 1;
        confirmBtn.focus();

        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    currentFocusIndex = currentFocusIndex === 0 ? focusableElements.length - 1 : currentFocusIndex - 1;
                } else {
                    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
                }
                focusableElements[currentFocusIndex].focus();
            }
            if (e.key === 'Escape') { overlay.remove(); resolve(false); }
        });

        cancelBtn.onclick = () => { overlay.remove(); resolve(false); };
        confirmBtn.onclick = () => { overlay.remove(); resolve(true); };
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
    });
}

// HCI: Success Screen
function showSuccessScreen(options) {
    const { title, message, details = [], buttonText = 'Continue', onClose } = options;

    const existingScreen = document.querySelector('.success-screen');
    if (existingScreen) existingScreen.remove();

    let detailsHtml = '';
    if (details.length > 0) {
        detailsHtml = `<div class="success-details">
            ${details.map(d => `<div class="success-details-item"><span class="success-details-label">${d.label}</span><span class="success-details-value">${d.value}</span></div>`).join('')}
        </div>`;
    }

    const screen = document.createElement('div');
    screen.className = 'success-screen active';
    screen.innerHTML = `
        <div class="success-content">
            <div class="success-checkmark"><i>✓</i></div>
            <h2>${title}</h2>
            <p>${message}</p>
            ${detailsHtml}
            <button class="btn-primary" onclick="this.closest('.success-screen').remove(); ${onClose ? onClose + '()' : ''}">${buttonText}</button>
        </div>
    `;
    document.body.appendChild(screen);
}

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Show loading spinner
function showLoading() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) spinner.classList.add('active');
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) spinner.classList.remove('active');
}

// Show empty state
function showEmptyState(container, message, icon = '📭') {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">${icon}</div>
            <h3>No Data Found</h3>
            <p>${message}</p>
        </div>
    `;
}

// Load teacher info - Now handled in validateSession, keeping this as alias/refresh if needed
async function loadTeacherInfo() {
    await validateSession();
}

// Load teacher's assigned courses
async function loadTeacherCourses() {
    try {
        const response = await fetch(`${API_URL}/teacher/my-courses`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load courses');

        const courses = await response.json();
        currentTeacherCourses = courses;

        // Display courses in grid
        const coursesGrid = document.getElementById('coursesGrid');
        coursesGrid.innerHTML = '';

        if (!courses || courses.length === 0) {
            showEmptyState(coursesGrid, 'No courses assigned yet. Contact admin to get courses assigned.', '📚');
            return;
        }

        courses.forEach(course => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3><i class="fas fa-book"></i> ${course.courseName}</h3>
                <p><strong>Code:</strong> ${course.courseCode}</p>
                <p><strong>Credit Hours:</strong> ${course.creditHours || 'N/A'}</p>
                <p><strong>Enrolled Students:</strong> ${course.enrolledStudents || 0}</p>
            `;
            coursesGrid.appendChild(card);
        });

        // Populate select dropdowns
        populateCourseSelects(courses);

    } catch (error) {
        console.error('Error loading courses:', error);
        alert('Failed to load courses');
    }
}

// Populate course dropdowns
function populateCourseSelects(courses) {
    const selects = ['courseSelect', 'viewCourseSelect', 'studentsViewCourseSelect'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">-- Select Course --</option>';

        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.courseId;
            option.textContent = `${course.courseCode} - ${course.courseName}`;
            select.appendChild(option);
        });
    });
}

// Load students for selected course
async function loadCourseStudents() {
    const courseId = document.getElementById('courseSelect').value;
    const date = document.getElementById('attendanceDate').value;

    if (!courseId || !date) {
        document.getElementById('studentsAttendance').style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/teacher/course-students/${courseId}`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load students');

        const students = await response.json();
        const studentsTable = document.getElementById('studentsTable');
        studentsTable.innerHTML = '';

        if (students.length === 0) {
            studentsTable.innerHTML = '<tr><td colspan="6">No students enrolled in this course</td></tr>';
            document.getElementById('studentsAttendance').style.display = 'block';
            return;
        }

        attendanceData = [];

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.rollNumber}</td>
                <td>${student.fullName}</td>
                <td>${student.email}</td>
                <td>
                    <select class="status-select" data-student-id="${student.studentId}">
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="Leave">On Leave</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="remarks-input" data-student-id="${student.studentId}" placeholder="Optional remarks">
                </td>
                <td>
                    <button class="btn-action" onclick="markSingleAttendance(${student.studentId})">
                        <i class="fas fa-check"></i> Mark
                    </button>
                </td>
            `;
            studentsTable.appendChild(row);

            // Initialize attendance data with default "Present"
            attendanceData.push({
                studentId: student.studentId,
                status: 'Present',
                remarks: ''
            });
        });

        document.getElementById('studentsAttendance').style.display = 'block';

    } catch (error) {
        console.error('Error loading students:', error);
        alert('Failed to load students');
    }
}

// Mark single attendance
async function markSingleAttendance(studentId) {
    const courseId = document.getElementById('courseSelect').value;
    const date = document.getElementById('attendanceDate').value;
    const statusSelect = document.querySelector(`.status-select[data-student-id="${studentId}"]`);
    const remarksInput = document.querySelector(`.remarks-input[data-student-id="${studentId}"]`);

    const attendanceRecord = {
        studentId: studentId,
        courseId: parseInt(courseId),
        date: date,
        status: statusSelect.value,
        remarks: remarksInput.value
    };

    try {
        const response = await fetch(`${API_URL}/teacher/mark-attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(attendanceRecord)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        showToast('Attendance marked successfully!', 'success', 'Saved');
        statusSelect.style.background = '#d4edda';
        setTimeout(() => statusSelect.style.background = '', 2000);

    } catch (error) {
        console.error('Error marking attendance:', error);
        showToast('Failed to mark attendance: ' + error.message, 'error');
    }
}

// Save all attendance records
async function saveAllAttendance() {
    const courseId = document.getElementById('courseSelect').value;
    const date = document.getElementById('attendanceDate').value;

    if (!courseId || !date) {
        showToast('Please select course and date', 'warning');
        return;
    }

    // Collect all attendance data
    const attendanceRecords = [];
    const statusSelects = document.querySelectorAll('.status-select');

    statusSelects.forEach(select => {
        const studentId = select.getAttribute('data-student-id');
        const remarksInput = document.querySelector(`.remarks-input[data-student-id="${studentId}"]`);

        attendanceRecords.push({
            studentId: parseInt(studentId),
            courseId: parseInt(courseId),
            date: date,
            status: select.value,
            remarks: remarksInput.value
        });
    });

    // Count present/absent
    const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
    const lateCount = attendanceRecords.filter(r => r.status === 'Late').length;

    try {
        // Mark attendance for all students
        const promises = attendanceRecords.map(record =>
            fetch(`${API_URL}/teacher/mark-attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(record)
            })
        );

        await Promise.all(promises);

        // Refresh attendance records in View Attendance section
        if (document.getElementById('viewCourseSelect').value) {
            loadAttendanceRecords();
        }

        // Show HCI Success Screen
        showSuccessScreen({
            title: 'Attendance Saved!',
            message: 'All attendance records have been successfully saved.',
            details: [
                { label: 'Date', value: new Date(date).toLocaleDateString() },
                { label: 'Total Students', value: attendanceRecords.length },
                { label: 'Present', value: presentCount },
                { label: 'Absent', value: absentCount },
                { label: 'Late', value: lateCount }
            ],
            buttonText: '✓ Continue',
            onClose: null
        });

    } catch (error) {
        console.error('Error saving attendance:', error);
        showToast('Failed to save attendance', 'error');
    }
}

// Load attendance records
async function loadAttendanceRecords() {
    const courseId = document.getElementById('viewCourseSelect').value;
    const filterDate = document.getElementById('filterDate').value;

    if (!courseId) {
        document.getElementById('attendanceRecordsTable').innerHTML = '<tr><td colspan="6">Please select a course</td></tr>';
        return;
    }

    try {
        let url = `${API_URL}/teacher/attendance-records/${courseId}`;
        if (filterDate) {
            url += `?date=${filterDate}`;
        }

        const response = await fetch(url, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load attendance records');

        const records = await response.json();

        // Sort by attendanceId descending (newest first)
        records.sort((a, b) => b.attendanceId - a.attendanceId);

        // Store records globally for editing
        window.attendanceRecords = records;

        const table = document.getElementById('attendanceRecordsTable');
        table.innerHTML = '';

        if (records.length === 0) {
            table.innerHTML = '<tr><td colspan="7">No attendance records found</td></tr>';
            return;
        }

        records.forEach((record, index) => {
            const row = document.createElement('tr');
            const statusClass = record.status === 'Present' ? 'status-present' :
                record.status === 'Absent' ? 'status-absent' :
                    record.status === 'Late' ? 'status-late' : 'status-leave';

            row.innerHTML = `
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.student?.rollNumber || 'N/A'}</td>
                <td>${record.student?.fullName || 'N/A'}</td>
                <td>
                    <select id="editStatus_${index}" class="edit-status-select ${statusClass}" onchange="updateStatusColor(this)">
                        <option value="Present" ${record.status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Absent" ${record.status === 'Absent' ? 'selected' : ''}>Absent</option>
                        <option value="Late" ${record.status === 'Late' ? 'selected' : ''}>Late</option>
                        <option value="Leave" ${record.status === 'Leave' ? 'selected' : ''}>Leave</option>
                    </select>
                </td>
                <td>${new Date(record.markedAt).toLocaleString()}</td>
                <td>
                    <input type="text" id="editRemarks_${index}" class="edit-remarks-input" value="${record.remarks || ''}" placeholder="Remarks" />
                </td>
                <td>
                    <button class="btn-save" onclick="saveAttendanceEdit(${index})" title="Save changes">💾</button>
                </td>
            `;
            table.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading attendance records:', error);
        alert('Failed to load attendance records');
    }
}

// Save edited attendance record
async function saveAttendanceEdit(index) {
    const record = window.attendanceRecords[index];
    if (!record) {
        alert('Record not found');
        return;
    }

    const newStatus = document.getElementById(`editStatus_${index}`).value;
    const newRemarks = document.getElementById(`editRemarks_${index}`).value;

    try {
        const response = await fetch(`${API_URL}/teacher/mark-attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: JSON.stringify({
                studentId: record.studentId,
                courseId: record.courseId,
                date: record.date.split('T')[0],
                status: newStatus,
                remarks: newRemarks
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update attendance');
        }

        alert('Attendance updated successfully!');
        loadAttendanceRecords(); // Reload to show updated data

    } catch (error) {
        console.error('Error updating attendance:', error);
        alert('Failed to update attendance');
    }
}

// Load students list for a course
async function loadStudentsList() {
    const courseId = document.getElementById('studentsViewCourseSelect').value;

    if (!courseId) {
        document.getElementById('studentsListTable').innerHTML = '<tr><td colspan="4">Please select a course</td></tr>';
        return;
    }

    try {
        const [studentsResponse, attendanceResponse] = await Promise.all([
            fetch(`${API_URL}/teacher/course-students/${courseId}`, {
                headers: {},
                credentials: 'include'
            }),
            fetch(`${API_URL}/teacher/attendance-records/${courseId}`, {
                headers: {},
                credentials: 'include'
            })
        ]);

        if (!studentsResponse.ok || !attendanceResponse.ok) {
            throw new Error('Failed to load data');
        }

        const students = await studentsResponse.json();
        const attendance = await attendanceResponse.json();

        const table = document.getElementById('studentsListTable');
        table.innerHTML = '';

        if (students.length === 0) {
            table.innerHTML = '<tr><td colspan="4">No students enrolled</td></tr>';
            return;
        }

        students.forEach(student => {
            // Calculate attendance summary
            const studentAttendance = attendance.filter(a => a.studentId === student.studentId);
            const total = studentAttendance.length;
            const present = studentAttendance.filter(a => a.status === 'Present').length;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.rollNumber}</td>
                <td>${student.fullName}</td>
                <td>${student.email}</td>
                <td>
                    <strong>${percentage}%</strong> (${present}/${total})
                    ${percentage < 75 ? '<span class="badge status-absent">Low</span>' : ''}
                </td>
            `;
            table.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading students list:', error);
        alert('Failed to load students');
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.menu li').forEach(item => {
        item.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');

    // Load timetable when timetable section is shown
    if (sectionId === 'timetable') {
        loadTeacherTimetable();
    }
}

// Load teacher's timetable
async function loadTeacherTimetable() {
    try {
        const response = await fetch(`${API_URL}/teacher/my-timetable`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load timetable');

        const timetable = await response.json();
        const tbody = document.getElementById('timetableBody');

        if (timetable.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No timetable entries found</td></tr>';
            return;
        }

        // Sort by day of week
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        timetable.sort((a, b) => {
            const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
            if (dayDiff !== 0) return dayDiff;
            return a.startTime.localeCompare(b.startTime);
        });

        tbody.innerHTML = timetable.map(entry => `
            <tr>
                <td>${entry.dayOfWeek}</td>
                <td>${entry.courseName} (${entry.courseCode})</td>
                <td>${entry.sectionName || 'All'}</td>
                <td>${entry.startTime.substring(0, 5)}</td>
                <td>${entry.endTime.substring(0, 5)}</td>
                <td>${entry.roomNumber || '-'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading timetable:', error);
        document.getElementById('timetableBody').innerHTML =
            '<tr><td colspan="6" style="text-align: center; color: red;">Error loading timetable</td></tr>';
    }
}

// Search filter for Mark Attendance table
function filterMarkAttendanceTable() {
    const searchTerm = document.getElementById('searchMarkAttendance').value.toLowerCase();
    const table = document.getElementById('studentsTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const rollNumber = rows[i].cells[0]?.textContent.toLowerCase() || '';
        const name = rows[i].cells[1]?.textContent.toLowerCase() || '';
        const email = rows[i].cells[2]?.textContent.toLowerCase() || '';

        if (rollNumber.includes(searchTerm) || name.includes(searchTerm) || email.includes(searchTerm)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

// Search filter for View Attendance table
function filterViewAttendanceTable() {
    const searchTerm = document.getElementById('searchViewAttendance').value.toLowerCase();
    const table = document.getElementById('attendanceRecordsTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const date = rows[i].cells[0]?.textContent.toLowerCase() || '';
        const rollNumber = rows[i].cells[1]?.textContent.toLowerCase() || '';
        const name = rows[i].cells[2]?.textContent.toLowerCase() || '';
        const status = rows[i].querySelector('select')?.value.toLowerCase() || '';
        const remarks = rows[i].cells[5]?.querySelector('input')?.value.toLowerCase() || '';

        if (rollNumber.includes(searchTerm) || name.includes(searchTerm) ||
            status.includes(searchTerm) || date.includes(searchTerm) || remarks.includes(searchTerm)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

// Search filter for Students List table
function filterStudentsListTable() {
    const searchTerm = document.getElementById('searchStudentsList').value.toLowerCase();
    const table = document.getElementById('studentsListTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const rollNumber = rows[i].cells[0]?.textContent.toLowerCase() || '';
        const name = rows[i].cells[1]?.textContent.toLowerCase() || '';
        const email = rows[i].cells[2]?.textContent.toLowerCase() || '';

        if (rollNumber.includes(searchTerm) || name.includes(searchTerm) || email.includes(searchTerm)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

// Logout function
async function logout() {
    await clearAuthData(); // Clear both localStorage and cookies (and call backend)
    window.location.href = 'index.html';
}

// Set default date to today
document.getElementById('attendanceDate').valueAsDate = new Date();

// Initialize
loadTeacherInfo();
