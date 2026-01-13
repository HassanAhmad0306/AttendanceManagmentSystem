const API_URL = 'http://localhost:5000/api';

// Get authentication data (Authentication is now fully server-side via Cookies)
let token = null;
let currentStudentId = null;
let allAttendance = [];
let enrolledCourses = [];
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

        if (user.role !== 'Student') {
            window.location.href = 'index.html';
            return;
        }

        // Set global variables
        currentUserId = user.userId;
        currentStudentId = user.userId;
        currentUserRole = user.role;
        document.getElementById('userName').textContent = user.fullName || user.username;

        // Load all student data
        await Promise.all([
            loadEnrolledCourses(),
            loadAttendanceData(),
            loadSessions(),
            loadStudentTimetable()
        ]);
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

// Load student info - Now handled in validateSession
async function loadStudentInfo() {
    await validateSession();
}

// Load enrolled courses
async function loadEnrolledCourses() {
    try {
        const response = await fetch(`${API_URL}/student/my-courses`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load courses');

        enrolledCourses = await response.json();

        // Debug: Log the first course to see the structure
        if (enrolledCourses.length > 0) {
            console.log('First course data:', enrolledCourses[0]);
        }

        // Display courses
        const coursesGrid = document.getElementById('myCoursesGrid');
        if (!coursesGrid) return; // Grid not available yet

        coursesGrid.innerHTML = '';

        if (enrolledCourses.length === 0) {
            coursesGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No courses enrolled yet.</p>';
            return;
        }

        enrolledCourses.forEach(course => {
            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <div class="course-card-header">
                    <span class="course-icon">📚</span>
                    <h3>${course.courseName}</h3>
                </div>
                <div class="course-card-body">
                    <div class="course-detail">
                        <span class="detail-label">Code</span>
                        <span class="detail-value">${course.courseCode}</span>
                    </div>
                    <div class="course-detail">
                        <span class="detail-label">Credits</span>
                        <span class="detail-value">${course.creditHours || course.credits || 'N/A'}</span>
                    </div>
                    <div class="course-detail">
                        <span class="detail-label">Section</span>
                        <span class="detail-value">${course.sectionName || 'N/A'}</span>
                    </div>
                    <div class="course-detail">
                        <span class="detail-label">Session</span>
                        <span class="detail-value session-badge">${course.sessionName || 'N/A'}</span>
                    </div>
                </div>
            `;
            coursesGrid.appendChild(card);
        });

        // Populate filter dropdown
        const filterSelect = document.getElementById('filterCourse');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">All Courses</option>';
            enrolledCourses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.courseId;
                option.textContent = `${course.courseCode} - ${course.courseName}`;
                filterSelect.appendChild(option);
            });
        }

    } catch (error) {
        console.error('Error loading courses:', error);
        const coursesGrid = document.getElementById('myCoursesGrid');
        if (coursesGrid) {
            coursesGrid.innerHTML = '<p style="text-align: center; color: red;">Error loading courses</p>';
        }
    }
}

// Load attendance data
async function loadAttendanceData() {
    try {
        const response = await fetch(`${API_URL}/student/my-attendance`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load attendance');

        allAttendance = await response.json();

        // Calculate overall stats
        calculateOverallStats();

        // Calculate course-wise stats
        calculateCourseWiseStats();

        // Load attendance records table
        loadAttendanceRecords();

    } catch (error) {
        console.error('Error loading attendance:', error);
        alert('Failed to load attendance data');
    }
}

// Calculate overall statistics
function calculateOverallStats() {
    // Get list of enrolled course IDs
    const enrolledCourseIds = enrolledCourses.map(c => c.courseId);

    // Only count attendance for currently enrolled courses
    const relevantAttendance = allAttendance.filter(a => enrolledCourseIds.includes(a.courseId));

    const total = relevantAttendance.length;
    const present = relevantAttendance.filter(a => a.status === 'Present').length;
    const absent = relevantAttendance.filter(a => a.status === 'Absent').length;
    const late = relevantAttendance.filter(a => a.status === 'Late').length;

    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    document.getElementById('overallPercentage').textContent = percentage + '%';
    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('lateCount').textContent = late;

    // Color code percentage
    const percentageElement = document.getElementById('overallPercentage');
    if (percentage >= 75) {
        percentageElement.style.color = '#28a745';
    } else if (percentage >= 65) {
        percentageElement.style.color = '#ffc107';
    } else {
        percentageElement.style.color = '#dc3545';
    }
}

// Calculate course-wise statistics
function calculateCourseWiseStats() {
    const courseStats = {};

    // Get list of enrolled course IDs
    const enrolledCourseIds = enrolledCourses.map(c => c.courseId);

    // Group attendance by course (only for enrolled courses)
    allAttendance.forEach(record => {
        // Skip if not enrolled in this course
        if (!enrolledCourseIds.includes(record.courseId)) {
            return;
        }

        if (!courseStats[record.courseId]) {
            courseStats[record.courseId] = {
                courseName: record.course?.courseName || 'Unknown',
                courseCode: record.course?.courseCode || 'N/A',
                total: 0,
                present: 0,
                absent: 0,
                late: 0
            };
        }

        courseStats[record.courseId].total++;
        if (record.status === 'Present') courseStats[record.courseId].present++;
        if (record.status === 'Absent') courseStats[record.courseId].absent++;
        if (record.status === 'Late') courseStats[record.courseId].late++;
    });

    // Display course-wise stats
    const grid = document.getElementById('courseAttendanceGrid');
    grid.innerHTML = '';

    Object.values(courseStats).forEach(stat => {
        const percentage = stat.total > 0 ? ((stat.present / stat.total) * 100).toFixed(1) : 0;
        const statusClass = percentage >= 75 ? 'status-present' :
            percentage >= 65 ? 'status-late' : 'status-absent';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${stat.courseName}</h3>
            <p><strong>Code:</strong> ${stat.courseCode}</p>
            <div class="attendance-summary">
                <h2 class="${statusClass.replace('status-', '')}">${percentage}%</h2>
                <p><i class="fas fa-check" style="color: green;"></i> Present: ${stat.present}</p>
                <p><i class="fas fa-times" style="color: red;"></i> Absent: ${stat.absent}</p>
                <p><i class="fas fa-clock" style="color: orange;"></i> Late: ${stat.late}</p>
                <p><strong>Total:</strong> ${stat.total} classes</p>
            </div>
        `;
        grid.appendChild(card);
    });

    if (Object.keys(courseStats).length === 0) {
        grid.innerHTML = '<p>No attendance records yet.</p>';
    }
}

// Load attendance records with filters
function loadAttendanceRecords() {
    const filterCourse = document.getElementById('filterCourse').value;
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;

    // Get list of enrolled course IDs
    const enrolledCourseIds = enrolledCourses.map(c => c.courseId);

    // Start with only attendance from enrolled courses
    let filteredAttendance = allAttendance.filter(a => enrolledCourseIds.includes(a.courseId));

    // Apply course filter
    if (filterCourse) {
        filteredAttendance = filteredAttendance.filter(a => a.courseId == filterCourse);
    }

    // Apply date filters
    if (fromDate) {
        filteredAttendance = filteredAttendance.filter(a => new Date(a.date) >= new Date(fromDate));
    }
    if (toDate) {
        filteredAttendance = filteredAttendance.filter(a => new Date(a.date) <= new Date(toDate));
    }

    // Sort by date descending
    filteredAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display in table
    const table = document.getElementById('attendanceRecordsTable');
    table.innerHTML = '';

    if (filteredAttendance.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No attendance records found</td></tr>';
        return;
    }

    filteredAttendance.forEach(record => {
        const statusClass = record.status === 'Present' ? 'status-present' :
            record.status === 'Absent' ? 'status-absent' :
                record.status === 'Late' ? 'status-late' : 'status-leave';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>${record.course?.courseName || 'Unknown'} (${record.course?.courseCode || 'N/A'})</td>
            <td><span class="badge ${statusClass}">${record.status}</span></td>
            <td>${new Date(record.markedAt).toLocaleString()}</td>
            <td>${record.remarks || '-'}</td>
        `;
        table.appendChild(row);
    });
}

// Load sessions for timetable
async function loadSessions() {
    try {
        const response = await fetch(`${API_URL}/admin/sessions`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load sessions');

        const sessions = await response.json();
        const select = document.getElementById('sessionSelect');
        select.innerHTML = '<option value="">-- Select Session --</option>';

        sessions.forEach(session => {
            const option = document.createElement('option');
            option.value = session.sessionId;
            option.textContent = `${session.sessionName}`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

// Load timetable
async function loadTimetable() {
    const sessionId = document.getElementById('sessionSelect').value;
    const container = document.getElementById('timetableContainer');

    if (!sessionId) {
        container.innerHTML = '<p>Please select a session to view timetable</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/student/my-timetable/${sessionId}`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to load timetable');

        const timetable = await response.json();

        if (timetable.length === 0) {
            container.innerHTML = '<p>No timetable entries found for this session</p>';
            return;
        }

        // Group by day and time
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const groupedByDay = {};

        timetable.forEach(entry => {
            if (!groupedByDay[entry.dayOfWeek]) {
                groupedByDay[entry.dayOfWeek] = [];
            }
            groupedByDay[entry.dayOfWeek].push(entry);
        });

        // Create timetable HTML
        let html = '<div class="timetable-grid">';

        daysOfWeek.forEach(day => {
            if (groupedByDay[day]) {
                html += `<div class="timetable-day">
                    <h3>${day}</h3>`;

                groupedByDay[day]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .forEach(entry => {
                        html += `
                            <div class="timetable-entry">
                                <div class="time">${entry.startTime} - ${entry.endTime}</div>
                                <div class="course">${entry.course?.courseName || 'Unknown'}</div>
                                <div class="room">${entry.room || 'TBA'}</div>
                                <div class="teacher">${entry.teacher?.fullName || 'TBA'}</div>
                            </div>
                        `;
                    });

                html += '</div>';
            }
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading timetable:', error);
        container.innerHTML = '<p>Failed to load timetable</p>';
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

    // Reload data when sections are shown
    if (sectionId === 'timetable') {
        loadStudentTimetable();
    } else if (sectionId === 'my-courses') {
        loadEnrolledCourses();
    }
}

// Load student's timetable
async function loadStudentTimetable() {
    const tbody = document.getElementById('timetableBody');

    try {
        const response = await fetch(`${API_URL}/student/my-timetable`, {
            headers: {},
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('Timetable error:', errorData);

            if (response.status === 404) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">You are not assigned to any section yet. Please contact the administrator.</td></tr>';
                return;
            }
            throw new Error('Failed to load timetable');
        }

        const timetable = await response.json();

        if (!timetable || timetable.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">No timetable entries found for your section. Please contact your administrator.</td></tr>';
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
                <td>${entry.teacherName || '-'}</td>
                <td>${entry.startTime.substring(0, 5)}</td>
                <td>${entry.endTime.substring(0, 5)}</td>
                <td>${entry.roomNumber || '-'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading timetable:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Unable to load timetable. Please try refreshing the page.</td></tr>';
    }
}

// Logout
async function logout() {
    await clearAuthData(); // Clear both localStorage and cookies (and call backend)
    window.location.href = 'index.html';
}

// Load available courses for enrollment
async function loadAvailableCourses() {
    try {
        // Fetch all courses and enrolled courses
        const [availableResponse, enrolledResponse] = await Promise.all([
            fetch(`${API_URL}/student/available-courses`, {
                headers: {},
                credentials: 'include'
            }),
            fetch(`${API_URL}/student/my-courses`, {
                headers: {},
                credentials: 'include'
            })
        ]);

        if (!availableResponse.ok || !enrolledResponse.ok) throw new Error('Failed to load courses');

        const availableData = await availableResponse.json();
        const enrolledData = await enrolledResponse.json();

        const container = document.getElementById('availableCoursesContainer');

        // Combine all courses - available + enrolled
        const allCourses = [
            ...availableData.courses.map(c => ({ ...c, isEnrolled: false, enrollmentId: null })),
            ...enrolledData.map(c => ({
                courseId: c.courseId,
                courseCode: c.courseCode,
                courseName: c.courseName,
                creditHours: c.creditHours,
                isEnrolled: true,
                enrollmentId: c.enrollmentId,
                sessionName: c.sessionName
            }))
        ];

        if (allCourses.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No courses available at this time.</p>';
            return;
        }

        container.innerHTML = `
            <div class="form-group" style="margin-bottom: 20px;">
                <label>Select Session (for new enrollments):</label>
                <select id="enrollSessionSelect" class="form-control">
                    <option value="">-- Select Session --</option>
                    ${availableData.sessions.map(s => `<option value="${s.sessionId}">${s.sessionName}</option>`).join('')}
                </select>
            </div>
            <div class="table-container">
                <div class="search-container">
                    <input type="text" id="searchCourses" class="search-input" placeholder="🔍 Search courses..." onkeyup="filterCoursesTable()" />
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Credit Hours</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="availableCoursesTable">
                        ${allCourses.map(course => `
                            <tr>
                                <td>${course.courseCode}</td>
                                <td>${course.courseName}</td>
                                <td>${course.creditHours}</td>
                                <td>
                                    ${course.isEnrolled
                ? `<span class="status-badge status-enrolled">✓ Enrolled${course.sessionName ? ` (${course.sessionName})` : ''}</span>`
                : '<span class="status-badge status-not-enrolled">Not Enrolled</span>'}
                                </td>
                                <td>
                                    ${course.isEnrolled
                ? `<button class="btn-unenroll" onclick="unenrollFromCourse(${course.enrollmentId}, '${course.courseName}')">
                                            ➖ Unenroll
                                           </button>`
                : `<button class="btn-enroll" onclick="enrollInCourse(${course.courseId})">
                                            ➕ Enroll
                                           </button>`}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading available courses:', error);
        document.getElementById('availableCoursesContainer').innerHTML =
            '<p style="text-align: center; color: red;">Error loading available courses</p>';
    }
}

// Filter courses table
function filterCoursesTable() {
    const searchTerm = document.getElementById('searchCourses').value.toLowerCase();
    const table = document.getElementById('availableCoursesTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const code = rows[i].cells[0]?.textContent.toLowerCase() || '';
        const name = rows[i].cells[1]?.textContent.toLowerCase() || '';
        const status = rows[i].cells[3]?.textContent.toLowerCase() || '';

        if (code.includes(searchTerm) || name.includes(searchTerm) || status.includes(searchTerm)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

// Unenroll from a course
async function unenrollFromCourse(enrollmentId, courseName) {
    if (!confirm(`Are you sure you want to unenroll from "${courseName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/student/unenroll/${enrollmentId}`, {
            method: 'DELETE',
            headers: {},
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || 'Successfully unenrolled from course');
            // Reload courses
            await Promise.all([
                loadAvailableCourses(),
                loadEnrolledCourses()
            ]);
        } else {
            alert(result.message || 'Failed to unenroll from course');
        }
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        alert('Error unenrolling from course. Please try again.');
    }
}

// Enroll in a course
async function enrollInCourse(courseId) {
    const sessionSelect = document.getElementById('enrollSessionSelect');
    const sessionId = parseInt(sessionSelect.value);

    if (!sessionId) {
        alert('Please select a session first');
        return;
    }

    if (!confirm('Are you sure you want to enroll in this course?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/student/enroll`, {
            method: 'POST',
            headers: {
                // 'Authorization': `Bearer ${token}`, // Removed
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ courseId, sessionId })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            // Reload available courses and enrolled courses
            await Promise.all([
                loadAvailableCourses(),
                loadEnrolledCourses()
            ]);
        } else {
            alert(result.message || 'Failed to enroll in course');
        }
    } catch (error) {
        console.error('Error enrolling in course:', error);
        alert('Error enrolling in course. Please try again.');
    }
}

// Search filter for My Attendance table
function filterMyAttendanceTable() {
    const searchTerm = document.getElementById('searchMyAttendance').value.toLowerCase();
    const table = document.getElementById('attendanceRecordsTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const date = rows[i].cells[0]?.textContent.toLowerCase() || '';
        const course = rows[i].cells[1]?.textContent.toLowerCase() || '';
        const status = rows[i].cells[2]?.textContent.toLowerCase() || '';
        const remarks = rows[i].cells[4]?.textContent.toLowerCase() || '';

        if (date.includes(searchTerm) || course.includes(searchTerm) ||
            status.includes(searchTerm) || remarks.includes(searchTerm)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
}

// Show section handler
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.menu li').forEach(li => {
        li.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');

    // Load data when section is shown
    if (sectionId === 'enroll-courses') {
        loadAvailableCourses();
    }
}

// Initialize date filters to last 30 days
const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

document.getElementById('fromDate').valueAsDate = thirtyDaysAgo;
document.getElementById('toDate').valueAsDate = today;

// Initialize
loadStudentInfo();
