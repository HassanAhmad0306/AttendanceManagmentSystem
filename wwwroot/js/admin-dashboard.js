const API_URL = 'http://localhost:5000/api';

let token = null;
let currentUserId = null;
let currentUserRole = null;

// Check if user is logged in and has admin access
async function validateSession() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {},
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Session invalid');
        }
        const user = await response.json();
        if (user.role !== 'Admin') {
            window.location.href = 'index.html';
            return;
        }
        currentUserId = user.userId;
        currentUserRole = user.role;
        document.getElementById('userName').textContent = user.fullName || user.username;


    } catch (e) {
        console.error('Session validation failed:', e);
        await clearAuthData();
        window.location.href = 'index.html?reason=session_expired';
    }
}
validateSession();

// Username set in validateSession

// Username set in validateSession


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

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
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

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

// Show loading spinner
function showLoading() {
    document.getElementById('spinnerOverlay').classList.add('active');
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('spinnerOverlay').classList.remove('active');
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

// Logout function
async function logout() {
    await clearAuthData(); // Clear both localStorage and cookies (and call backend)
    window.location.href = 'index.html';
}

// Section navigation
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.menu li').forEach(li => {
        li.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');

    if (sectionId === 'users') loadUsers();
    if (sectionId === 'courses') loadCourses();
    if (sectionId === 'sections') loadSections();
    if (sectionId === 'sessions') loadSessions();
    if (sectionId === 'assign') loadAssignmentData();
    if (sectionId === 'enrollments') loadEnrollmentData();
    if (sectionId === 'attendance') loadAttendances();
    if (sectionId === 'timetable') loadTimetable();
    if (sectionId === 'reports') loadReports();
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    showLoading();
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Send Cookie
        };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (response.status === 401) {
            logout();
            return null;
        }

        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            // Check if response is successful
            if (!response.ok) {
                // Throw error with message from API if available
                const errorMsg = data.message || `Request failed: ${response.status} ${response.statusText}`;
                throw new Error(errorMsg);
            }

            return data;
        } else {
            // If not JSON, read as text for debugging
            const text = await response.text();
            console.error(`Non-JSON response from ${endpoint}:`, text);
            throw new Error(`API returned non-JSON response: ${text.substring(0, 100)}`);
        }
    } finally {
        hideLoading();
    }
}

// ==========================================
// HCI ENHANCEMENT: TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'success', title = null) {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('role', 'alert');
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }

    // Define icons and titles for each type
    const config = {
        success: { icon: '✅', defaultTitle: 'Success!' },
        error: { icon: '❌', defaultTitle: 'Error!' },
        warning: { icon: '⚠️', defaultTitle: 'Warning!' },
        info: { icon: 'ℹ️', defaultTitle: 'Info' }
    };

    const { icon, defaultTitle } = config[type] || config.info;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${title || defaultTitle}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// HCI ENHANCEMENT: CONFIRMATION MODAL
// ==========================================
function showConfirmModal(options) {
    return new Promise((resolve) => {
        const { title, message, type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' } = options;

        // Define icons for each type
        const icons = {
            warning: '⚠️',
            danger: '🗑️',
            success: '✅',
            info: 'ℹ️'
        };

        // Remove existing modal if any
        const existingModal = document.querySelector('.confirm-modal-overlay');
        if (existingModal) existingModal.remove();

        // Create modal
        const overlay = document.createElement('div');
        overlay.className = 'confirm-modal-overlay active';
        overlay.innerHTML = `
            <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                <div class="confirm-modal-icon ${type}">${icons[type]}</div>
                <h3 id="confirm-title">${title}</h3>
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
        let currentFocusIndex = 1; // Start on confirm button
        confirmBtn.focus();

        // Trap Tab key within modal
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault(); // Prevent default tab behavior
                if (e.shiftKey) {
                    // Shift+Tab - go backwards
                    currentFocusIndex = currentFocusIndex === 0 ? focusableElements.length - 1 : currentFocusIndex - 1;
                } else {
                    // Tab - go forwards
                    currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
                }
                focusableElements[currentFocusIndex].focus();
            }
            if (e.key === 'Escape') {
                overlay.remove();
                resolve(false);
            }
        });

        // Event handlers
        cancelBtn.onclick = () => {
            overlay.remove();
            resolve(false);
        };

        confirmBtn.onclick = () => {
            overlay.remove();
            resolve(true);
        };

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

// ==========================================
// HCI ENHANCEMENT: SUCCESS SCREEN
// ==========================================
function showSuccessScreen(options) {
    const { title, message, details = [], buttonText = 'Continue', onClose } = options;

    // Remove existing screen if any
    const existingScreen = document.querySelector('.success-screen');
    if (existingScreen) existingScreen.remove();

    // Build details HTML
    let detailsHtml = '';
    if (details.length > 0) {
        detailsHtml = `<div class="success-details">
            ${details.map(d => `
                <div class="success-details-item">
                    <span class="success-details-label">${d.label}</span>
                    <span class="success-details-value">${d.value}</span>
                </div>
            `).join('')}
        </div>`;
    }

    const screen = document.createElement('div');
    screen.className = 'success-screen active';
    screen.innerHTML = `
        <div class="success-content">
            <div class="success-checkmark">
                <i>✓</i>
            </div>
            <h2>${title}</h2>
            <p>${message}</p>
            ${detailsHtml}
            <button class="btn-primary" onclick="this.closest('.success-screen').remove(); ${onClose ? onClose + '()' : ''}">${buttonText}</button>
        </div>
    `;

    document.body.appendChild(screen);
}

// Show alert (Legacy - now uses toast)
function showAlert(message, type = 'success') {
    showToast(message, type);
}

// ====================
// USERS SECTION
// ====================
function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'block';
    loadSectionsForDropdown();
}

function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
    document.getElementById('createUserForm').reset();
}

function toggleRoleFields() {
    const role = document.getElementById('userRole').value;
    document.getElementById('teacherFields').style.display = role === 'Teacher' ? 'block' : 'none';
    document.getElementById('studentFields').style.display = role === 'Student' ? 'block' : 'none';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('userPassword');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
    } else {
        passwordInput.type = 'password';
    }
}

async function loadUsers() {
    const users = await apiCall('/admin/users');
    // Handle null/undefined response
    if (!users || !Array.isArray(users)) {
        window.allUsers = [];
        displayUsers([]);
        return;
    }
    // Sort: Admin first, then by newest (ID DESC)
    users.sort((a, b) => {
        // Admin always at top
        if (a.role === 'Admin' && b.role !== 'Admin') return -1;
        if (b.role === 'Admin' && a.role !== 'Admin') return 1;
        // Then by ID descending (newest first)
        return b.userId - a.userId;
    });
    window.allUsers = users; // Store for filtering
    console.log('Users loaded:', window.allUsers.length, 'users');
    console.log('Sample user:', JSON.stringify(window.allUsers[0]));
    displayUsers(users);

    // Reset filters when loading users
    const searchInput = document.getElementById('searchUsers');
    const roleFilter = document.getElementById('filterRole');
    if (searchInput) searchInput.value = '';
    if (roleFilter) roleFilter.value = '';
}

function displayUsers(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';

    if (!users || users.length === 0) {
        // Show empty message in table body instead of replacing entire container
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 48px; margin-bottom: 10px;">👥</div>
            <h3 style="margin: 0 0 5px 0;">No Users Found</h3>
            <p style="margin: 0;">No users match your filter criteria.</p>
        </td>`;
        tbody.appendChild(tr);
        return;
    }

    // Sort: Admin first, then by newest (ID DESC)
    users.sort((a, b) => {
        if (a.role === 'Admin' && b.role !== 'Admin') return -1;
        if (b.role === 'Admin' && a.role !== 'Admin') return 1;
        return b.userId - a.userId;
    });

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.userId}</td>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td style="word-break: break-all;">${user.email}</td>
            <td><span class="status-badge">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 5px; align-items: center; flex-wrap: nowrap;">
                    <button class="btn-edit" onclick="editUser(${user.userId})" title="Edit User">✏️</button>
                    <button class="btn-action" onclick="resetPassword(${user.userId}, '${user.username}')">Reset</button>
                    ${user.role !== 'Admin' ? `<button class="btn-delete" onclick="deleteUser(${user.userId}, '${user.username}')">🗑️</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter users by role
function filterUsersByRole() {
    const roleFilter = document.getElementById('filterRole');
    const searchInput = document.getElementById('searchUsers');
    if (!roleFilter || typeof roleFilter.value === 'undefined') return;
    if (!searchInput || typeof searchInput.value === 'undefined') return;
    const roleValue = roleFilter.value.trim();
    const searchValue = searchInput.value.trim().toLowerCase();

    // Get all users
    const allUsers = window.allUsers || [];

    // Start with all users
    let filteredUsers = allUsers;

    // Filter by role if selected
    if (roleValue !== '') {
        filteredUsers = filteredUsers.filter(function (user) {
            return user.role && user.role.toLowerCase() === roleValue.toLowerCase();
        });
    }

    // Filter by search term if entered
    if (searchValue !== '') {
        filteredUsers = filteredUsers.filter(function (user) {
            const username = (user.username || '').toLowerCase();
            const fullName = (user.fullName || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            return username.includes(searchValue) ||
                fullName.includes(searchValue) ||
                email.includes(searchValue);
        });
    }

    // Display filtered results
    displayUsers(filteredUsers);
}

document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Client-side validation
    if (!data.email || !data.email.endsWith('@gmail.com')) {
        showAlert('Email must be a valid @gmail.com address.', 'error');
        return;
    }
    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!data.password || !strongPasswordRegex.test(data.password)) {
        showAlert('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.', 'error');
        return;
    }

    // Convert empty strings to null
    if (!data.sectionId) data.sectionId = null;

    try {
        const result = await apiCall('/admin/users', 'POST', data);
        if (result && result.message) {
            showAlert(result.message);
            hideAddUserForm();
            loadUsers();

            // Refresh enrollment/assignment dropdowns if those sections are visible
            const enrollmentSection = document.getElementById('enrollments');
            const assignmentSection = document.getElementById('assign');

            if (enrollmentSection && enrollmentSection.classList.contains('active')) {
                loadEnrollmentData();
            }
            if (assignmentSection && assignmentSection.classList.contains('active')) {
                loadAssignmentData();
            }
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// ====================
// COURSES SECTION
// ====================
function showAddCourseForm() {
    document.getElementById('addCourseForm').style.display = 'block';
}

function hideAddCourseForm() {
    document.getElementById('addCourseForm').style.display = 'none';
    document.getElementById('createCourseForm').reset();
}

async function loadCourses() {
    const courses = await apiCall('/admin/courses');
    // Sort alphabetically by course name
    courses.sort((a, b) => a.courseName.localeCompare(b.courseName));
    window.allCourses = courses; // Store globally for filtering
    displayCourses(courses);
}

function displayCourses(courses) {
    const tbody = document.querySelector('#coursesTable tbody');
    tbody.innerHTML = '';

    courses.forEach(course => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${course.courseCode}</td>
            <td>${course.courseName}</td>
            <td>${course.creditHours}</td>
            <td>
                <button class="btn-edit" onclick="editCourse(${course.courseId})" title="Edit">✏️</button>
                <button class="btn-delete" onclick="deleteCourse(${course.courseId})" title="Delete">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter courses by credit hours
function filterCourses() {
    const chFilter = document.getElementById('filterCourseCH').value;
    const searchTerm = document.getElementById('searchCourses').value.toLowerCase();

    let filtered = window.allCourses || [];

    if (chFilter) {
        const creditHours = parseInt(chFilter);
        filtered = filtered.filter(c => c.creditHours === creditHours);
    }

    if (searchTerm) {
        filtered = filtered.filter(c =>
            c.courseCode.toLowerCase().includes(searchTerm) ||
            c.courseName.toLowerCase().includes(searchTerm)
        );
    }

    displayCourses(filtered);
}

async function editCourse(id) {
    try {
        const courses = await apiCall('/admin/courses');
        const thisCourse = courses.find(c => c.courseId === id);
        if (!thisCourse) {
            showAlert('Course not found', 'error');
            return;
        }

        const newCode = prompt('Course Code:', thisCourse.courseCode);
        if (newCode === null) return; // User cancelled

        const newName = prompt('Course Name:', thisCourse.courseName);
        if (newName === null) return;

        const newCredits = prompt('Credit Hours:', thisCourse.creditHours);
        if (newCredits === null) return;

        if (newCode && newName && newCredits) {
            const result = await apiCall(`/admin/courses/${id}`, 'PUT', {
                courseId: id,
                courseCode: newCode,
                courseName: newName,
                creditHours: parseInt(newCredits),
                isActive: true
            });

            if (result) {
                showAlert('Course updated successfully', 'success');
                loadCourses();
            }
        } else {
            showAlert('Please fill in all required fields', 'error');
        }
    } catch (error) {
        console.error('Error editing course:', error);
        showAlert('Failed to edit course: ' + error.message, 'error');
    }
}

async function deleteCourse(id) {
    try {
        if (confirm('Are you sure you want to delete this course?\nThis action cannot be undone.')) {
            const result = await apiCall(`/admin/courses/${id}`, 'DELETE');
            if (result) {
                showAlert('Course deleted successfully', 'success');
                loadCourses();
            }
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        showAlert('Failed to delete course: ' + error.message, 'error');
    }
}

document.getElementById('createCourseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.creditHours = parseInt(data.creditHours);
    data.isActive = true; // Always active

    try {
        const result = await apiCall('/admin/courses', 'POST', data);
        if (result && result.message) {
            showAlert(result.message);
            hideAddCourseForm();
            loadCourses();
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// ====================
// SECTIONS SECTION
// ====================
function showAddSectionForm() {
    document.getElementById('addSectionForm').style.display = 'block';
    loadSessionsForDropdown();
}

function hideAddSectionForm() {
    document.getElementById('addSectionForm').style.display = 'none';
    document.getElementById('createSectionForm').reset();
}

async function loadSections() {
    try {
        const [sections, sessions] = await Promise.all([
            apiCall('/admin/sections'),
            apiCall('/admin/sessions')
        ]);
        // Sort by sectionId descending (newest first)
        sections.sort((a, b) => b.sectionId - a.sectionId);
        window.allSections = sections; // Store globally for filtering

        // Populate session filter dropdown with ALL sessions
        const sessionFilter = document.getElementById('filterSectionSession');
        sessionFilter.innerHTML = '<option value="">All Sessions</option>';
        sessions.forEach(session => {
            sessionFilter.innerHTML += `<option value="${session.sessionName}">${session.sessionName}</option>`;
        });

        displaySections(sections);
    } catch (error) {
        console.error('Error loading sections:', error);
        showAlert('Error loading sections', 'error');
    }
}

function displaySections(sections) {
    const tbody = document.querySelector('#sectionsTable tbody');
    tbody.innerHTML = '';

    sections.forEach(section => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${section.sectionId}</td>
            <td>${section.sectionName}</td>
            <td>${section.sessionName || '-'}</td>
            <td>
                <button class="btn-edit" onclick="editSection(${section.sectionId})" title="Edit">✏️</button>
                <button class="btn-delete" onclick="deleteSection(${section.sectionId})" title="Delete">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter sections by session
function filterSections() {
    const sessionFilter = document.getElementById('filterSectionSession').value;
    const searchTerm = document.getElementById('searchSections').value.toLowerCase();

    let filtered = window.allSections || [];

    if (sessionFilter) {
        filtered = filtered.filter(s => s.sessionName === sessionFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(s =>
            s.sectionName.toLowerCase().includes(searchTerm) ||
            (s.sessionName && s.sessionName.toLowerCase().includes(searchTerm))
        );
    }

    displaySections(filtered);
}

async function editSection(id) {
    try {
        const sections = await apiCall('/admin/sections');
        const section = sections.find(s => s.sectionId === id);
        if (!section) return;

        const newName = prompt('Section Name:', section.sectionName);
        if (newName === null) return; // User cancelled

        if (newName.trim() === '') {
            showAlert('Section name cannot be empty', 'error');
            return;
        }

        const result = await apiCall(`/admin/sections/${id}`, 'PUT', {
            sectionName: newName.trim(),
            sessionId: section.sessionId,
            isActive: true
        });

        if (result && result.message) {
            showAlert(result.message);
        } else {
            showAlert('Section updated successfully');
        }
        loadSections();
    } catch (error) {
        showAlert('Failed to update section: ' + error.message, 'error');
    }
}

async function deleteSection(id) {
    if (!confirm('Are you sure you want to delete this section?')) return;

    try {
        await apiCall(`/admin/sections/${id}`, 'DELETE');
        showAlert('Section deleted successfully');
        loadSections();
    } catch (error) {
        showAlert('Failed to delete section: ' + error.message, 'error');
    }
}

async function loadSectionsForDropdown() {
    const sections = await apiCall('/admin/sections');
    const select = document.getElementById('sectionSelect');
    select.innerHTML = '<option value="">Select Section</option>';
    sections.forEach(section => {
        const sessionInfo = section.sessionName ? ` (${section.sessionName})` : '';
        select.innerHTML += `<option value="${section.sectionId}">${section.sectionName}${sessionInfo}</option>`;
    });
}

document.getElementById('createSectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.isActive = true; // Always active
    data.sessionId = data.sessionId ? parseInt(data.sessionId) : null;

    try {
        const result = await apiCall('/admin/sections', 'POST', data);
        if (result && result.message) {
            showAlert(result.message);
            hideAddSectionForm();
            loadSections();
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// ====================
// SESSIONS SECTION
// ====================
function showAddSessionForm() {
    document.getElementById('addSessionForm').style.display = 'block';
}

function hideAddSessionForm() {
    document.getElementById('addSessionForm').style.display = 'none';
    document.getElementById('createSessionForm').reset();
}

async function loadSessions() {
    const sessions = await apiCall('/admin/sessions');
    // Sort by sessionId descending (newest first)
    sessions.sort((a, b) => b.sessionId - a.sessionId);
    window.allSessions = sessions; // Store globally for filtering
    displaySessions(sessions);
}

function displaySessions(sessions) {
    const tbody = document.querySelector('#sessionsTable tbody');
    tbody.innerHTML = '';

    sessions.forEach(session => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${session.sessionId}</td>
            <td>${session.sessionName}</td>
            <td>${new Date(session.startDate).toLocaleDateString()}</td>
            <td>${new Date(session.endDate).toLocaleDateString()}</td>
            <td>
                <button class="btn-edit" onclick="editSession(${session.sessionId})" title="Edit">✏️</button>
                <button class="btn-delete" onclick="deleteSession(${session.sessionId})" title="Delete">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter sessions by name
function filterSessions() {
    const searchTerm = document.getElementById('searchSessions').value.toLowerCase();

    let filtered = window.allSessions || [];

    if (searchTerm) {
        filtered = filtered.filter(s =>
            s.sessionName.toLowerCase().includes(searchTerm)
        );
    }

    displaySessions(filtered);
}

async function editSession(id) {
    const sessions = await apiCall('/admin/sessions');
    const session = sessions.find(s => s.sessionId === id);
    if (!session) return;

    const newName = prompt('Session Name:', session.sessionName);
    const newStart = prompt('Start Date (YYYY-MM-DD):', session.startDate.split('T')[0]);
    const newEnd = prompt('End Date (YYYY-MM-DD):', session.endDate.split('T')[0]);

    if (newName && newStart && newEnd) {
        await apiCall(`/admin/sessions/${id}`, 'PUT', {
            sessionName: newName,
            startDate: newStart,
            endDate: newEnd,
            isActive: true
        });
        showAlert('Session updated successfully');
        loadSessions();
    }
}

async function deleteSession(id) {
    if (confirm('Are you sure you want to delete this session?')) {
        await apiCall(`/admin/sessions/${id}`, 'DELETE');
        showAlert('Session deleted successfully');
        loadSessions();
    }
}

async function loadSessionsForDropdown() {
    const sessions = await apiCall('/admin/sessions');
    const select = document.getElementById('sessionSelect');
    select.innerHTML = '<option value="">Select Session</option>';
    sessions.forEach(session => {
        select.innerHTML += `<option value="${session.sessionId}">${session.sessionName}</option>`;
    });
}

document.getElementById('createSessionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.isActive = true; // Always active

    try {
        const result = await apiCall('/admin/sessions', 'POST', data);
        if (result && result.message) {
            showAlert(result.message);
            hideAddSessionForm();
            loadSessions();
        }
    } catch (error) {
        showAlert(error.message, 'error');
    }
});

// ====================
// ASSIGNMENTS SECTION
// ====================
async function loadAssignmentData() {
    try {
        // Load teachers, students, courses, sections, sessions
        const [teachers, students, courses, sections, sessions] = await Promise.all([
            apiCall('/admin/teachers'),
            apiCall('/admin/students'),
            apiCall('/admin/courses'),
            apiCall('/admin/sections'),
            apiCall('/admin/sessions')
        ]);

        console.log('Teachers:', teachers);
        console.log('Students:', students);
        console.log('Courses:', courses);
        console.log('Sections:', sections);
        console.log('Sessions:', sessions);

        // Populate teacher select
        const teacherSelect = document.getElementById('teacherSelect');
        teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
        if (teachers && teachers.length > 0) {
            teachers.forEach(teacher => {
                teacherSelect.innerHTML += `<option value="${teacher.teacherId}">${teacher.fullName} (${teacher.employeeId})</option>`;
            });
        } else {
            teacherSelect.innerHTML += '<option value="" disabled>No teachers available</option>';
        }

        // Populate student select
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        if (students && students.length > 0) {
            students.forEach(student => {
                studentSelect.innerHTML += `<option value="${student.studentId}">${student.fullName} (${student.rollNumber})</option>`;
            });
        } else {
            studentSelect.innerHTML += '<option value="" disabled>No students available</option>';
        }

        // Populate course selects
        [document.getElementById('courseSelectTeacher'), document.getElementById('courseSelectStudent')].forEach(select => {
            select.innerHTML = '<option value="">Select Course</option>';
            courses.forEach(course => {
                select.innerHTML += `<option value="${course.courseId}">${course.courseName} (${course.courseCode})</option>`;
            });
        });

        // Populate section selects
        [document.getElementById('sectionSelectTeacher')].forEach(select => {
            select.innerHTML = '<option value="">Select Section</option>';
            sections.forEach(section => {
                const sessionInfo = section.sessionName ? ` (${section.sessionName})` : '';
                select.innerHTML += `<option value="${section.sectionId}">${section.sectionName}${sessionInfo}</option>`;
            });
        });

        // Populate session selects
        [document.getElementById('sessionSelectTeacher'), document.getElementById('sessionSelectStudent')].forEach(select => {
            select.innerHTML = '<option value="">Select Session</option>';
            sessions.forEach(session => {
                select.innerHTML += `<option value="${session.sessionId}">${session.sessionName}</option>`;
            });
        });

        // Load teacher assignments table
        loadTeacherAssignments();
    } catch (error) {
        console.error('Error loading assignment data:', error);
        showAlert('Error loading assignment data: ' + error.message, 'error');
    }
}

// Load Enrollment Data (Students, Courses, Sessions for enrollment form)
async function loadEnrollmentData() {
    try {
        const [students, courses, sections, sessions, enrollments] = await Promise.all([
            apiCall('/admin/students'),
            apiCall('/admin/courses'),
            apiCall('/admin/sections'),
            apiCall('/admin/sessions'),
            apiCall('/admin/course-enrollments')
        ]);

        console.log('Loading enrollment data - Students:', students);

        // Store globally for course dropdown updates
        window.allCoursesForEnrollment = courses;
        window.allEnrollmentsForDropdown = enrollments;

        // Populate student select
        const studentSelect = document.getElementById('studentSelect');
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        if (students && students.length > 0) {
            students.forEach(student => {
                console.log('Adding student to dropdown:', student);
                studentSelect.innerHTML += `<option value="${student.studentId}">${student.fullName} (${student.rollNumber})</option>`;
            });
            console.log('Total students added:', students.length);
        } else {
            console.log('No students found!');
            studentSelect.innerHTML += '<option value="" disabled>No students available</option>';
        }

        // Populate course select (initially all courses)
        const courseSelect = document.getElementById('courseSelectStudent');
        courseSelect.innerHTML = '<option value="">Select Course</option>';
        courses.forEach(course => {
            courseSelect.innerHTML += `<option value="${course.courseId}">${course.courseName} (${course.courseCode})</option>`;
        });

        // Populate section select
        const sectionSelect = document.getElementById('sectionSelectEnrollment');
        sectionSelect.innerHTML = '<option value="">Select Section</option>';
        sections.forEach(section => {
            const sessionInfo = section.sessionName ? ` (${section.sessionName})` : '';
            sectionSelect.innerHTML += `<option value="${section.sectionId}">${section.sectionName}${sessionInfo}</option>`;
        });

        // Populate session select
        const sessionSelect = document.getElementById('sessionSelectStudent');
        sessionSelect.innerHTML = '<option value="">Select Session</option>';
        sessions.forEach(session => {
            sessionSelect.innerHTML += `<option value="${session.sessionId}">${session.sessionName}</option>`;
        });

        // Load enrollments table
        loadStudentEnrollments();
    } catch (error) {
        console.error('Error loading enrollment data:', error);
        showAlert('Error loading enrollment data: ' + error.message, 'error');
    }
}

// Update course dropdown based on selected student's enrollments
function updateCourseDropdownForStudent() {
    const studentSelect = document.getElementById('studentSelect');
    const courseSelect = document.getElementById('courseSelectStudent');
    const sessionSelect = document.getElementById('sessionSelectStudent');

    const selectedStudentId = parseInt(studentSelect.value);
    const selectedSessionId = parseInt(sessionSelect.value);

    const courses = window.allCoursesForEnrollment || [];
    const enrollments = window.allEnrollmentsForDropdown || [];

    // Get active enrollments for this student
    const studentEnrollments = enrollments.filter(e =>
        e.studentId === selectedStudentId && e.status === 'Active'
    );

    // Get course IDs that are already enrolled (for selected session if specified)
    const enrolledCourseIds = studentEnrollments
        .filter(e => !selectedSessionId || e.sessionId === selectedSessionId)
        .map(e => e.courseId);

    // Rebuild course dropdown
    courseSelect.innerHTML = '<option value="">Select Course</option>';
    courses.forEach(course => {
        const isEnrolled = enrolledCourseIds.includes(course.courseId);
        if (isEnrolled) {
            courseSelect.innerHTML += `<option value="${course.courseId}" disabled style="color: #999; background-color: #f0f0f0;">📚 ${course.courseName} (${course.courseCode}) - Already Enrolled</option>`;
        } else {
            courseSelect.innerHTML += `<option value="${course.courseId}">${course.courseName} (${course.courseCode})</option>`;
        }
    });
}

// Load Teacher Assignments Table
async function loadTeacherAssignments() {
    try {
        const assignments = await apiCall('/admin/course-teachers');
        const tbody = document.getElementById('teacherAssignmentsTableBody');

        if (!assignments || assignments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No teacher assignments found</td></tr>';
            return;
        }

        tbody.innerHTML = assignments.map(assignment => `
            <tr>
                <td>${assignment.courseTeacherId}</td>
                <td>${assignment.teacherName}</td>
                <td>${assignment.courseName}</td>
                <td>${assignment.sectionName || 'N/A'}</td>
                <td>${assignment.sessionName}</td>
                <td>
                    <button class="btn-delete" onclick="deleteTeacherAssignment(${assignment.courseTeacherId})">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading teacher assignments:', error);
        showAlert('Error loading teacher assignments', 'error');
    }
}

// Load Student Enrollments Table
async function loadStudentEnrollments() {
    try {
        const enrollments = await apiCall('/admin/course-enrollments');
        window.allEnrollments = enrollments; // Store globally for filtering
        window.allEnrollmentsForDropdown = enrollments; // Also update for dropdown

        // Update course dropdown if student is selected
        updateCourseDropdownForStudent();

        // Populate course filter dropdown
        const courseFilter = document.getElementById('filterEnrollmentCourse');
        courseFilter.innerHTML = '<option value="">All Courses</option>';
        const uniqueCourses = [...new Set(enrollments.map(e => e.courseName).filter(c => c))].sort();
        uniqueCourses.forEach(course => {
            courseFilter.innerHTML += `<option value="${course}">${course}</option>`;
        });

        // Populate section filter dropdown
        const sectionFilter = document.getElementById('filterEnrollmentSection');
        sectionFilter.innerHTML = '<option value="">All Sections</option>';
        const uniqueSections = [...new Set(enrollments.map(e => e.sectionName).filter(s => s))].sort();
        uniqueSections.forEach(section => {
            sectionFilter.innerHTML += `<option value="${section}">${section}</option>`;
        });

        displayEnrollments(enrollments);
    } catch (error) {
        console.error('Error loading enrollments:', error);
        showAlert('Error loading enrollments', 'error');
    }
}

function displayEnrollments(enrollments) {
    const tbody = document.getElementById('enrollmentsTableBody');

    if (!enrollments || enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No student enrollments found</td></tr>';
        return;
    }

    // Sort by enrollmentId descending (newest first)
    enrollments.sort((a, b) => b.enrollmentId - a.enrollmentId);

    tbody.innerHTML = enrollments.map(enrollment => `
        <tr>
            <td>${enrollment.enrollmentId}</td>
            <td>${enrollment.studentName}</td>
            <td>${enrollment.rollNumber}</td>
            <td>${enrollment.courseName}</td>
            <td>${enrollment.sectionName}</td>
            <td>${enrollment.sessionName}</td>
            <td>${new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-edit" onclick="editEnrollment(${enrollment.enrollmentId})" title="Edit">✏️</button>
                    <button class="btn-delete" onclick="deleteEnrollment(${enrollment.enrollmentId})" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter enrollments by course and section
function filterEnrollments() {
    const courseFilter = document.getElementById('filterEnrollmentCourse').value;
    const sectionFilter = document.getElementById('filterEnrollmentSection').value;
    const searchTerm = document.getElementById('searchEnrollments').value.toLowerCase();

    let filtered = window.allEnrollments || [];

    if (courseFilter) {
        filtered = filtered.filter(e => e.courseName === courseFilter);
    }

    if (sectionFilter) {
        filtered = filtered.filter(e => e.sectionName === sectionFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(e =>
            e.studentName.toLowerCase().includes(searchTerm) ||
            e.rollNumber.toLowerCase().includes(searchTerm) ||
            e.courseName.toLowerCase().includes(searchTerm) ||
            e.sectionName.toLowerCase().includes(searchTerm) ||
            e.sessionName.toLowerCase().includes(searchTerm)
        );
    }

    displayEnrollments(filtered);
}

// Delete Teacher Assignment
async function deleteTeacherAssignment(id) {
    if (!confirm('Are you sure you want to remove this teacher assignment?')) return;

    try {
        await apiCall(`/admin/course-teachers/${id}`, 'DELETE');
        showAlert('Teacher assignment removed successfully', 'success');
        loadTeacherAssignments();
    } catch (error) {
        showAlert('Failed to remove teacher assignment: ' + error.message, 'error');
    }
}

// Delete Student Enrollment
async function deleteEnrollment(id) {
    if (!confirm('Are you sure you want to remove this enrollment?')) return;

    try {
        await apiCall(`/admin/course-enrollments/${id}`, 'DELETE');
        showAlert('Enrollment removed successfully', 'success');
        loadStudentEnrollments();
    } catch (error) {
        showAlert('Failed to remove enrollment: ' + error.message, 'error');
    }
}

// Edit Student Enrollment
async function editEnrollment(enrollmentId) {
    try {
        // Get current enrollment data
        const enrollments = window.allEnrollments || [];
        const enrollment = enrollments.find(e => e.enrollmentId === enrollmentId);
        if (!enrollment) {
            showToast('Enrollment not found', 'error');
            return;
        }

        // Get all courses and sessions for dropdown
        const [courses, sessions] = await Promise.all([
            apiCall('/admin/courses'),
            apiCall('/admin/sessions')
        ]);

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'confirm-modal-overlay active';
        modal.innerHTML = `
            <div class="confirm-modal" style="max-width: 400px;">
                <h3 style="margin-bottom: 20px;">✏️ Edit Enrollment</h3>
                <p style="margin-bottom: 10px;"><strong>Student:</strong> ${enrollment.studentName} (${enrollment.rollNumber})</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Course:</label>
                    <select id="editEnrollmentCourse" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                        ${courses.map(c => `<option value="${c.courseId}" ${c.courseId === enrollment.courseId ? 'selected' : ''}>${c.courseName}</option>`).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Session:</label>
                    <select id="editEnrollmentSession" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
                        ${sessions.map(s => `<option value="${s.sessionId}" ${s.sessionId === enrollment.sessionId ? 'selected' : ''}>${s.sessionName}</option>`).join('')}
                    </select>
                </div>
                
                <div class="confirm-modal-actions">
                    <button class="btn-confirm-cancel" id="cancelEditEnrollment">Cancel</button>
                    <button class="btn-confirm-success" id="saveEditEnrollment">Save Changes</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus trap
        const saveBtn = modal.querySelector('#saveEditEnrollment');
        const cancelBtn = modal.querySelector('#cancelEditEnrollment');
        saveBtn.focus();

        // Event handlers
        cancelBtn.onclick = () => modal.remove();

        saveBtn.onclick = async () => {
            const newCourseId = parseInt(document.getElementById('editEnrollmentCourse').value);
            const newSessionId = parseInt(document.getElementById('editEnrollmentSession').value);

            try {
                await apiCall(`/admin/course-enrollments/${enrollmentId}`, 'PUT', {
                    courseId: newCourseId,
                    sessionId: newSessionId
                });
                modal.remove();
                showToast('Enrollment updated successfully!', 'success');
                loadStudentEnrollments();
            } catch (error) {
                showToast('Failed to update: ' + error.message, 'error');
            }
        };

        // Close on Escape
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') modal.remove();
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

    } catch (error) {
        showToast('Error loading enrollment data: ' + error.message, 'error');
    }
}

// Update Enrollment Status
async function updateEnrollmentStatus(enrollmentId, newStatus) {
    try {
        await apiCall(`/admin/course-enrollments/${enrollmentId}/status`, 'PUT', { status: newStatus });
        showToast(`Status updated to ${newStatus}`, 'success');
        // Update the select color based on status
        const select = document.querySelector(`select[data-enrollment-id="${enrollmentId}"]`);
        if (select) {
            select.className = 'status-select-enrollment';
            if (newStatus === 'Active') select.classList.add('status-active-select');
            else if (newStatus === 'Dropped') select.classList.add('status-dropped-select');
            else if (newStatus === 'Completed') select.classList.add('status-completed-select');
        }
    } catch (error) {
        showToast('Failed to update status: ' + error.message, 'error');
        loadStudentEnrollments(); // Reload to reset
    }
}

// ====================
// ATTENDANCE SECTION
// ====================
async function loadAttendances() {
    try {
        const attendances = await apiCall('/admin/attendances');

        // Store globally for filtering
        window.allAttendanceRecords = attendances;

        // Hide the table header in summary view
        const tableHeader = document.getElementById('attendanceTableHeader');
        if (tableHeader) tableHeader.style.display = 'none';

        // Remove any existing filter dropdowns
        const filtersContainer = document.getElementById('attendanceFilters');
        const existingSelects = filtersContainer.querySelectorAll('select');
        existingSelects.forEach(select => select.remove());

        const tbody = document.getElementById('attendanceTableBody');

        if (!attendances || attendances.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No attendance records found</td></tr>';
            return;
        }

        // Sort by attendanceId descending (newest first)
        attendances.sort((a, b) => b.attendanceId - a.attendanceId);

        // Group by student
        const studentGroups = {};
        attendances.forEach(att => {
            if (!studentGroups[att.studentId]) {
                studentGroups[att.studentId] = {
                    studentId: att.studentId,
                    studentName: att.studentName,
                    rollNumber: att.rollNumber,
                    records: []
                };
            }
            studentGroups[att.studentId].records.push(att);
        });

        // Display grouped summary (without status column)
        tbody.innerHTML = `
            <tr style="background: #f5f5f5; font-weight: bold;">
                <td colspan="5">
                    <strong>📊 Attendance Summary by Student</strong>
                    <button class="btn-action" style="float: right;" onclick="showAllAttendanceRecords()">View All Records</button>
                </td>
            </tr>
        ` + Object.values(studentGroups).map(group => {
            const total = group.records.length;
            const present = group.records.filter(r => r.status === 'Present').length;
            const absent = group.records.filter(r => r.status === 'Absent').length;
            const percentage = ((present / total) * 100).toFixed(1);

            return `
                <tr class="clickable-row" onclick="showStudentDetails(${group.studentId}, '${group.studentName}')">
                    <td style="text-align: center;">-</td>
                    <td><a href="#" onclick="showStudentDetails(${group.studentId}, '${group.studentName}'); return false;" class="student-link">👤 ${group.studentName}</a></td>
                    <td>${group.rollNumber}</td>
                    <td>Total Records: ${total} | <span class="status-badge status-active">PRESENT: ${present}</span> | <span class="status-badge status-inactive">ABSENT: ${absent}</span></td>
                    <td><strong>${percentage}%</strong></td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading attendances:', error);
        showAlert('Error loading attendances', 'error');
    }
}

// Show all attendance records (ungrouped)
async function showAllAttendanceRecords() {
    try {
        const attendances = await apiCall('/admin/attendances');
        window.allAttendanceRecords = attendances;

        // Show the table header in detailed view
        const tableHeader = document.getElementById('attendanceTableHeader');
        if (tableHeader) tableHeader.style.display = '';

        // Add section and session filter dropdowns
        const filtersContainer = document.getElementById('attendanceFilters');

        // Remove any existing select elements
        const existingSelects = filtersContainer.querySelectorAll('select');
        existingSelects.forEach(select => select.remove());

        // Create section filter
        const sectionFilter = document.createElement('select');
        sectionFilter.id = 'filterAttendanceSection';
        sectionFilter.style.cssText = 'margin-left: 10px; padding: 10px; border-radius: 5px; border: 1px solid #ddd; font-size: 14px; min-width: 150px;';
        sectionFilter.onchange = filterAttendance;
        sectionFilter.innerHTML = '<option value="">All Sections</option>';
        const uniqueSections = [...new Set(attendances.map(a => a.sectionName).filter(s => s))].sort();
        uniqueSections.forEach(section => {
            sectionFilter.innerHTML += `<option value="${section}">${section}</option>`;
        });
        filtersContainer.appendChild(sectionFilter);

        // Create session filter
        const sessionFilter = document.createElement('select');
        sessionFilter.id = 'filterAttendanceSession';
        sessionFilter.style.cssText = 'margin-left: 10px; padding: 10px; border-radius: 5px; border: 1px solid #ddd; font-size: 14px; min-width: 150px;';
        sessionFilter.onchange = filterAttendance;
        sessionFilter.innerHTML = '<option value="">All Sessions</option>';
        const uniqueSessions = [...new Set(attendances.map(a => a.sessionName).filter(s => s))].sort();
        uniqueSessions.forEach(session => {
            sessionFilter.innerHTML += `<option value="${session}">${session}</option>`;
        });
        filtersContainer.appendChild(sessionFilter);

        displayAllAttendanceRecords(attendances);
    } catch (error) {
        showAlert('Error loading records', 'error');
    }
}

function displayAllAttendanceRecords(attendances) {
    const tbody = document.getElementById('attendanceTableBody');

    tbody.innerHTML = `
        <tr style="background: #f5f5f5;">
            <td colspan="9">
                <strong>📋 All Attendance Records</strong>
                <button class="btn-action" style="float: right;" onclick="loadAttendances()">← Back to Summary</button>
            </td>
        </tr>
    ` + attendances.map(att => `
        <tr>
            <td>${att.attendanceId}</td>
            <td><a href="#" class="student-link" onclick="showStudentDetails(${att.studentId}, '${att.studentName}'); return false;">${att.studentName}</a></td>
            <td>${att.rollNumber}</td>
            <td><a href="#" class="course-link" onclick="showCourseAttendance(${att.courseId}, '${att.courseName}'); return false;">${att.courseName} (${att.courseCode})</a></td>
            <td>${new Date(att.attendanceDate).toLocaleDateString()}</td>
            <td><span class="status-badge ${att.status === 'Present' ? 'status-active' : att.status === 'Absent' ? 'status-inactive' : ''}">${att.status}</span></td>
            <td>${att.markedAt ? new Date(att.markedAt).toLocaleString() : 'N/A'}</td>
            <td>${att.remarks || '-'}</td>
            <td>
                <button class="btn-delete" onclick="deleteAttendance(${att.attendanceId})" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Filter attendance records
function filterAttendance() {
    const sectionFilterEl = document.getElementById('filterAttendanceSection');
    const sessionFilterEl = document.getElementById('filterAttendanceSession');
    const searchTerm = document.getElementById('searchAttendance').value.toLowerCase();

    let filtered = window.allAttendanceRecords || [];

    // Only apply filters if elements exist (in detailed view)
    if (sectionFilterEl && sectionFilterEl.value) {
        filtered = filtered.filter(a => a.sectionName === sectionFilterEl.value);
    }

    if (sessionFilterEl && sessionFilterEl.value) {
        filtered = filtered.filter(a => a.sessionName === sessionFilterEl.value);
    }

    if (searchTerm) {
        filtered = filtered.filter(a =>
            a.studentName.toLowerCase().includes(searchTerm) ||
            a.rollNumber.toLowerCase().includes(searchTerm) ||
            a.courseName.toLowerCase().includes(searchTerm) ||
            a.courseCode.toLowerCase().includes(searchTerm)
        );
    }

    displayAllAttendanceRecords(filtered);
}

// Show detailed attendance for a specific student
async function showStudentDetails(studentId, studentName) {
    try {
        const attendances = await apiCall('/admin/attendances');
        const studentAtt = attendances.filter(a => a.studentId === studentId);

        // Show the table header in detailed view
        const tableHeader = document.getElementById('attendanceTableHeader');
        if (tableHeader) tableHeader.style.display = '';

        const tbody = document.getElementById('attendanceTableBody');

        if (studentAtt.length === 0) {
            showAlert(`No attendance records found for ${studentName}`, 'info');
            return;
        }

        // Calculate statistics
        const total = studentAtt.length;
        const present = studentAtt.filter(a => a.status === 'Present').length;
        const absent = studentAtt.filter(a => a.status === 'Absent').length;
        const percentage = ((present / total) * 100).toFixed(2);

        tbody.innerHTML = `
            <tr style="background: #e3f2fd;">
                <td colspan="9">
                    <strong>📊 ${studentName}'s Attendance Summary:</strong> 
                    Total: ${total} | Present: ${present} | Absent: ${absent} | Attendance: ${percentage}%
                    <button class="btn-action" style="float: right;" onclick="loadAttendances()">← Back to All</button>
                </td>
            </tr>
        ` + studentAtt.map(att => `
            <tr>
                <td>${att.attendanceId}</td>
                <td>${att.studentName}</td>
                <td>${att.rollNumber}</td>
                <td>${att.courseName} (${att.courseCode})</td>
                <td>${new Date(att.attendanceDate).toLocaleDateString()}</td>
                <td><span class="status-badge ${att.status === 'Present' ? 'status-active' : att.status === 'Absent' ? 'status-inactive' : ''}">${att.status}</span></td>
                <td>${att.markedAt ? new Date(att.markedAt).toLocaleString() : 'N/A'}</td>
                <td>${att.remarks || '-'}</td>
                <td>
                    <button class="btn-delete" onclick="deleteAttendance(${att.attendanceId})" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showAlert('Error loading student details', 'error');
    }
}

// Show attendance for a specific course
async function showCourseAttendance(courseId, courseName) {
    try {
        const attendances = await apiCall('/admin/attendances');
        const courseAtt = attendances.filter(a => a.courseId === courseId);

        // Show the table header in detailed view
        const tableHeader = document.getElementById('attendanceTableHeader');
        if (tableHeader) tableHeader.style.display = '';

        const tbody = document.getElementById('attendanceTableBody');

        if (courseAtt.length === 0) {
            showAlert(`No attendance records found for ${courseName}`, 'info');
            return;
        }

        tbody.innerHTML = `
            <tr style="background: #e3f2fd;">
                <td colspan="9">
                    <strong>📚 ${courseName} - Attendance Records (${courseAtt.length} entries)</strong>
                    <button class="btn-action" style="float: right;" onclick="loadAttendances()">← Back to All</button>
                </td>
            </tr>
        ` + courseAtt.map(att => `
            <tr>
                <td>${att.attendanceId}</td>
                <td><a href="#" onclick="showStudentDetails(${att.studentId}, '${att.studentName}'); return false;">${att.studentName}</a></td>
                <td>${att.rollNumber}</td>
                <td>${att.courseName} (${att.courseCode})</td>
                <td>${new Date(att.attendanceDate).toLocaleDateString()}</td>
                <td><span class="status-badge ${att.status === 'Present' ? 'status-active' : att.status === 'Absent' ? 'status-inactive' : ''}">${att.status}</span></td>
                <td>${att.markedAt ? new Date(att.markedAt).toLocaleString() : 'N/A'}</td>
                <td>${att.remarks || '-'}</td>
                <td>
                    <button class="btn-delete" onclick="deleteAttendance(${att.attendanceId})" title="Delete">🗑️</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading attendances:', error);
        showAlert('Error loading attendances', 'error');
    }
}

// ====================
// TIMETABLE SECTION
// ====================
function showAddTimetableForm() {
    document.getElementById('addTimetableForm').style.display = 'block';
    loadTimetableFormData();
}

function hideAddTimetableForm() {
    document.getElementById('addTimetableForm').style.display = 'none';
    document.getElementById('createTimetableForm').reset();
}

async function loadTimetableFormData() {
    try {
        const [courses, teachers, sections] = await Promise.all([
            apiCall('/admin/courses'),
            apiCall('/admin/teachers'),
            apiCall('/admin/sections')
        ]);

        // Populate course select
        const courseSelect = document.getElementById('courseSelectTimetable');
        courseSelect.innerHTML = '<option value="">Select Course</option>';
        courses.forEach(course => {
            courseSelect.innerHTML += `<option value="${course.courseId}">${course.courseName} (${course.courseCode})</option>`;
        });

        // Populate teacher select
        const teacherSelect = document.getElementById('teacherSelectTimetable');
        teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
        teachers.forEach(teacher => {
            teacherSelect.innerHTML += `<option value="${teacher.teacherId}">${teacher.fullName} (${teacher.employeeId})</option>`;
        });

        // Populate section select
        const sectionSelect = document.getElementById('sectionSelectTimetable');
        sectionSelect.innerHTML = '<option value="">Select Section</option>';
        sections.forEach(section => {
            const sessionInfo = section.sessionName ? ` (${section.sessionName})` : '';
            sectionSelect.innerHTML += `<option value="${section.sectionId}">${section.sectionName}${sessionInfo}</option>`;
        });
    } catch (error) {
        console.error('Error loading timetable form data:', error);
    }
}

async function loadTimetable() {
    try {
        const timetables = await apiCall('/admin/timetables');
        const tbody = document.getElementById('timetableTableBody');

        if (!timetables || timetables.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No timetable entries found</td></tr>';
            return;
        }

        // Group by teacher
        const teacherGroups = {};
        timetables.forEach(entry => {
            if (!teacherGroups[entry.teacherId]) {
                teacherGroups[entry.teacherId] = {
                    teacherId: entry.teacherId,
                    teacherName: entry.teacherName,
                    courses: new Set(),
                    entries: []
                };
            }
            teacherGroups[entry.teacherId].courses.add(entry.courseName);
            teacherGroups[entry.teacherId].entries.push(entry);
        });

        // Display grouped summary by teacher
        tbody.innerHTML = `
            <tr style="background: #f5f5f5; font-weight: bold;">
                <td colspan="9">
                    <strong>🕐 Timetable Summary by Teacher</strong>
                    <button class="btn-action" style="float: right;" onclick="showTimetableByCourse()">View by Course</button>
                    <button class="btn-action" style="float: right; margin-right: 10px;" onclick="showAllTimetableRecords()">View All Records</button>
                </td>
            </tr>
        ` + Object.values(teacherGroups).map(group => {
            const safeName = group.teacherName.replace(/'/g, "\\'");
            return `
                <tr class="clickable-row" onclick="showTeacherTimetable(${group.teacherId}, '${safeName}')">
                    <td colspan="3"><a href="#" onclick="showTeacherTimetable(${group.teacherId}, '${safeName}'); return false;" class="student-link">👨‍🏫 ${group.teacherName}</a></td>
                    <td colspan="3">Courses: ${group.courses.size}</td>
                    <td colspan="3">Total Classes: ${group.entries.length}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading timetables:', error);
        showAlert('Error loading timetables', 'error');
    }
}

// Show timetable grouped by course
async function showTimetableByCourse() {
    try {
        const timetables = await apiCall('/admin/timetables');
        const tbody = document.getElementById('timetableTableBody');

        // Group by course
        const courseGroups = {};
        timetables.forEach(entry => {
            if (!courseGroups[entry.courseId]) {
                courseGroups[entry.courseId] = {
                    courseId: entry.courseId,
                    courseName: entry.courseName,
                    courseCode: entry.courseCode,
                    teachers: new Set(),
                    entries: []
                };
            }
            courseGroups[entry.courseId].teachers.add(entry.teacherName);
            courseGroups[entry.courseId].entries.push(entry);
        });

        tbody.innerHTML = `
            <tr style="background: #f5f5f5; font-weight: bold;">
                <td colspan="9">
                    <strong>📚 Timetable Summary by Course</strong>
                    <button class="btn-action" style="float: right;" onclick="loadTimetable()">View by Teacher</button>
                    <button class="btn-action" style="float: right; margin-right: 10px;" onclick="showAllTimetableRecords()">View All Records</button>
                </td>
            </tr>
        ` + Object.values(courseGroups).map(group => {
            const safeName = group.courseName.replace(/'/g, "\\'");
            return `
                <tr class="clickable-row" onclick="showCourseTimetable(${group.courseId}, '${safeName}')">
                    <td colspan="3"><a href="#" onclick="showCourseTimetable(${group.courseId}, '${safeName}'); return false;" class="course-link">📚 ${group.courseName} (${group.courseCode})</a></td>
                    <td colspan="3">Teachers: ${group.teachers.size}</td>
                    <td colspan="3">Total Classes: ${group.entries.length}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        showAlert('Error loading timetable', 'error');
    }
}

// Show all timetable records (ungrouped)
async function showAllTimetableRecords() {
    try {
        const timetables = await apiCall('/admin/timetables');
        const tbody = document.getElementById('timetableTableBody');

        tbody.innerHTML = `
            <tr style="background: #f5f5f5;">
                <td colspan="9">
                    <strong>📋 All Timetable Entries</strong>
                    <button class="btn-action" style="float: right;" onclick="loadTimetable()">← Back to Summary</button>
                </td>
            </tr>
        ` + timetables.map(entry => {
            const safeCourse = entry.courseName.replace(/'/g, "\\'");
            const safeTeacher = entry.teacherName.replace(/'/g, "\\'");
            return `
            <tr>
                <td>${entry.timetableId}</td>
                <td><a href="#" onclick="showCourseTimetable(${entry.courseId}, '${safeCourse}'); return false;">${entry.courseName} (${entry.courseCode})</a></td>
                <td><a href="#" onclick="showTeacherTimetable(${entry.teacherId}, '${safeTeacher}'); return false;">${entry.teacherName}</a></td>
                <td>${entry.sectionName}</td>
                <td>${entry.dayOfWeek}</td>
                <td>${entry.startTime}</td>
                <td>${entry.endTime}</td>
                <td>${entry.roomNumber || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editTimetable(${entry.timetableId})">✏️</button>
                    <button class="btn-delete" onclick="deleteTimetable(${entry.timetableId})">🗑️</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        showAlert('Error loading records', 'error');
    }
}

// Show timetable for a specific course
async function showCourseTimetable(courseId, courseName) {
    try {
        const timetables = await apiCall('/admin/timetables');
        const courseTimetable = timetables.filter(t => t.courseId === courseId);

        const tbody = document.getElementById('timetableTableBody');

        if (courseTimetable.length === 0) {
            showAlert(`No timetable entries found for ${courseName}`, 'info');
            return;
        }

        tbody.innerHTML = `
            <tr style="background: #e3f2fd;">
                <td colspan="9">
                    <strong>📚 ${courseName} - Schedule (${courseTimetable.length} entries)</strong>
                    <button class="btn-action" style="float: right;" onclick="loadTimetable()">← Back to All</button>
                </td>
            </tr>
        ` + courseTimetable.map(entry => {
            const safeTeacher = entry.teacherName.replace(/'/g, "\\'");
            return `
            <tr>
                <td>${entry.timetableId}</td>
                <td>${entry.courseName} (${entry.courseCode})</td>
                <td><a href="#" onclick="showTeacherTimetable(${entry.teacherId}, '${safeTeacher}'); return false;">${entry.teacherName}</a></td>
                <td>${entry.sectionName}</td>
                <td>${entry.dayOfWeek}</td>
                <td>${entry.startTime}</td>
                <td>${entry.endTime}</td>
                <td>${entry.roomNumber || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editTimetable(${entry.timetableId})">✏️</button>
                    <button class="btn-delete" onclick="deleteTimetable(${entry.timetableId})">🗑️</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        showAlert('Error loading course timetable', 'error');
    }
}

// Show timetable for a specific teacher
async function showTeacherTimetable(teacherId, teacherName) {
    try {
        const timetables = await apiCall('/admin/timetables');
        const teacherTimetable = timetables.filter(t => t.teacherId === teacherId);

        const tbody = document.getElementById('timetableTableBody');

        if (teacherTimetable.length === 0) {
            showAlert(`No timetable entries found for ${teacherName}`, 'info');
            return;
        }

        tbody.innerHTML = `
            <tr style="background: #e3f2fd;">
                <td colspan="9">
                    <strong>👨‍🏫 ${teacherName} - Schedule (${teacherTimetable.length} entries)</strong>
                    <button class="btn-action" style="float: right;" onclick="loadTimetable()">← Back to All</button>
                </td>
            </tr>
        ` + teacherTimetable.map(entry => {
            const safeCourse = entry.courseName.replace(/'/g, "\\'");
            return `
            <tr>
                <td>${entry.timetableId}</td>
                <td><a href="#" onclick="showCourseTimetable(${entry.courseId}, '${safeCourse}'); return false;">${entry.courseName} (${entry.courseCode})</a></td>
                <td>${entry.teacherName}</td>
                <td>${entry.sectionName}</td>
                <td>${entry.dayOfWeek}</td>
                <td>${entry.startTime}</td>
                <td>${entry.endTime}</td>
                <td>${entry.roomNumber || '-'}</td>
                <td>
                    <button class="btn-edit" onclick="editTimetable(${entry.timetableId})">✏️</button>
                    <button class="btn-delete" onclick="deleteTimetable(${entry.timetableId})">🗑️</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        showAlert('Error loading teacher timetable', 'error');
    }
}

async function editTimetable(id) {
    try {
        const timetables = await apiCall('/admin/timetables');
        const entry = timetables.find(t => t.timetableId === id);
        if (!entry) return;

        // Load fresh data for dropdowns
        const [courses, teachers, sections] = await Promise.all([
            apiCall('/admin/courses'),
            apiCall('/admin/teachers'),
            apiCall('/admin/sections')
        ]);

        // Create a modal-like form
        const modalHtml = `
            <div id="editTimetableModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
                    <h3>Edit Timetable Entry</h3>
                    <form id="editTimetableForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Course *</label>
                                <select name="courseId" required>
                                    ${courses.map(c =>
            `<option value="${c.courseId}" ${c.courseId === entry.courseId ? 'selected' : ''}>${c.courseName} (${c.courseCode})</option>`
        ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Teacher *</label>
                                <select name="teacherId" required>
                                    ${teachers.map(t =>
            `<option value="${t.teacherId}" ${t.teacherId === entry.teacherId ? 'selected' : ''}>${t.fullName} (${t.employeeId})</option>`
        ).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Section</label>
                                <select name="sectionId">
                                    <option value="">Select Section</option>
                                    ${sections.map(s =>
            `<option value="${s.sectionId}" ${s.sectionId === entry.sectionId ? 'selected' : ''}>${s.sectionName}</option>`
        ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Day of Week *</label>
                                <select name="dayOfWeek" required>
                                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day =>
            `<option value="${day}" ${day === entry.dayOfWeek ? 'selected' : ''}>${day}</option>`
        ).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Start Time *</label>
                                <input type="time" name="startTime" value="${entry.startTime.substring(0, 5)}" required />
                            </div>
                            <div class="form-group">
                                <label>End Time *</label>
                                <input type="time" name="endTime" value="${entry.endTime.substring(0, 5)}" required />
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Room Number</label>
                            <input type="text" name="roomNumber" value="${entry.roomNumber || ''}" />
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Update Entry</button>
                            <button type="button" class="btn-secondary" onclick="document.getElementById('editTimetableModal').remove()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('editTimetableForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            data.courseId = parseInt(data.courseId);
            data.teacherId = parseInt(data.teacherId);
            data.sectionId = data.sectionId ? parseInt(data.sectionId) : null;

            // Format time strings
            if (data.startTime) {
                data.startTime = data.startTime.length === 5 ? data.startTime + ':00' : data.startTime;
            }
            if (data.endTime) {
                data.endTime = data.endTime.length === 5 ? data.endTime + ':00' : data.endTime;
            }

            await apiCall(`/admin/timetables/${id}`, 'PUT', data);
            showAlert('Timetable entry updated successfully', 'success');
            document.getElementById('editTimetableModal').remove();
            loadTimetable();
        });
    } catch (error) {
        showAlert('Error editing timetable: ' + error.message, 'error');
    }
}

async function deleteTimetable(id) {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
        await apiCall(`/admin/timetables/${id}`, 'DELETE');
        showAlert('Timetable entry deleted successfully', 'success');
        loadTimetable();
    } catch (error) {
        showAlert('Failed to delete timetable entry: ' + error.message, 'error');
    }
}

// ====================
// REPORTS SECTION
// ====================
async function loadReports() {
    const [users, courses, sessions] = await Promise.all([
        apiCall('/admin/users'),
        apiCall('/admin/courses'),
        apiCall('/admin/sessions')
    ]);

    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalCourses').textContent = courses.length;
    document.getElementById('totalSessions').textContent = sessions.length;
}

// Edit user
async function editUser(userId) {
    const user = window.allUsers.find(u => u.userId === userId);
    if (!user) {
        showAlert('User not found', 'error');
        return;
    }

    // Fetch sections for dropdown
    let sectionsOptions = '';
    try {
        const sections = await apiCall('/admin/sections');
        sectionsOptions = sections.map(s =>
            `<option value="${s.sectionId}" ${user.sectionId === s.sectionId ? 'selected' : ''}>${s.sectionName}</option>`
        ).join('');
    } catch (e) {
        console.error('Failed to load sections');
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'editUserModal';
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h3 style="margin-bottom: 20px;">Edit User: ${user.username}</h3>
                <form id="editUserForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Username</label>
                        <input type="text" id="editUsername" value="${user.username}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Full Name</label>
                        <input type="text" id="editFullName" value="${user.fullName}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email</label>
                        <input type="email" id="editEmail" value="${user.email}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    ${user.role === 'Student' ? `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Section</label>
                        <select id="editSectionId" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="">Select Section</option>
                            ${sectionsOptions}
                        </select>
                    </div>
                    ` : ''}
                    ${user.role === 'Teacher' ? `
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Department</label>
                        <input type="text" id="editDepartment" value="${user.department || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    ` : ''}
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="closeEditUserModal()" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = {
                username: document.getElementById('editUsername').value,
                fullName: document.getElementById('editFullName').value,
                email: document.getElementById('editEmail').value
            };

            if (user.role === 'Student') {
                const sectionId = document.getElementById('editSectionId')?.value;
                if (sectionId) data.sectionId = parseInt(sectionId);
            }
            if (user.role === 'Teacher') {
                data.department = document.getElementById('editDepartment')?.value || null;
            }

            await apiCall(`/admin/users/${userId}`, 'PUT', data);
            showAlert('User updated successfully');
            closeEditUserModal();
            loadUsers();
        } catch (error) {
            showAlert('Failed to update user: ' + error.message, 'error');
        }
    });
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.remove();
}

// Reset user password
async function resetPassword(userId, username) {
    const newPassword = prompt(`Enter new password for ${username}:`);
    if (!newPassword) return;

    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
        alert('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
        return;
    }
    try {
        const result = await apiCall('/admin/reset-password', 'POST', {
            userId: userId,
            newPassword: newPassword
        });

        if (result && result.message) {
            showAlert(`Password reset successfully for ${username}`);
        }
    } catch (error) {
        showAlert('Failed to reset password', 'error');
    }
}

// Delete user
async function deleteUser(userId, username) {
    const confirmed = await showConfirmModal({
        title: 'Delete User?',
        message: `Are you sure you want to delete "${username}"? This action cannot be undone and will remove all associated data.`,
        type: 'danger',
        confirmText: '🗑️ Delete',
        cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
        await apiCall(`/admin/users/${userId}`, 'DELETE');
        showToast(`User "${username}" deleted successfully`, 'success', 'User Deleted');
        loadUsers();

        // Refresh enrollment/assignment dropdowns if those sections are visible
        const enrollmentSection = document.getElementById('enrollments');
        const assignmentSection = document.getElementById('assign');

        if (enrollmentSection && enrollmentSection.classList.contains('active')) {
            loadEnrollmentData();
        }
        if (assignmentSection && assignmentSection.classList.contains('active')) {
            loadAssignmentData();
        }
    } catch (error) {
        showToast('Failed to delete user: ' + error.message, 'error');
    }
}

// ====================
// SEARCH FUNCTIONALITY
// ====================
function filterTable(tableId, searchInputId) {
    const input = document.getElementById(searchInputId);
    const filter = (input && typeof input.value === 'string') ? input.value.toLowerCase().trim() : '';
    const table = document.getElementById(tableId);
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;

        // Skip empty search - show all rows
        if (!filter) {
            rows[i].style.display = '';
            continue;
        }

        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            if (cell) {
                const txtValue = (cell.textContent || cell.innerText).toLowerCase();
                if (txtValue.includes(filter)) {
                    found = true;
                    break;
                }
            }
        }

        rows[i].style.display = found ? '' : 'none';
    }
}

function filterTableByBody(tbodyId, searchInputId) {
    const input = document.getElementById(searchInputId);
    const filter = input.value.toLowerCase().trim();
    const tbody = document.getElementById(tbodyId);
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;

        // Skip empty search - show all rows
        if (!filter) {
            rows[i].style.display = '';
            continue;
        }

        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            if (cell) {
                const txtValue = (cell.textContent || cell.innerText).toLowerCase();
                if (txtValue.includes(filter)) {
                    found = true;
                    break;
                }
            }
        }

        rows[i].style.display = found ? '' : 'none';
    }
}

// Initial load
loadUsers();

// Setup filter event listeners explicitly
const searchUsersInput = document.getElementById('searchUsers');
const filterRoleSelect = document.getElementById('filterRole');

if (searchUsersInput) {
    searchUsersInput.addEventListener('input', filterUsersByRole);
    console.log('Search input listener attached');
}

if (filterRoleSelect) {
    filterRoleSelect.addEventListener('change', filterUsersByRole);
    console.log('Filter role listener attached');
}

// Setup form event listeners
const assignTeacherForm = document.getElementById('assignTeacherForm');
const enrollStudentForm = document.getElementById('enrollStudentForm');

console.log('assignTeacherForm:', assignTeacherForm);
console.log('enrollStudentForm:', enrollStudentForm);

if (assignTeacherForm) {
    assignTeacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            console.log('Assigning teacher with data:', data);

            // Convert to integers
            data.teacherId = parseInt(data.teacherId);
            data.courseId = parseInt(data.courseId);
            data.sessionId = parseInt(data.sessionId);
            data.sectionId = data.sectionId ? parseInt(data.sectionId) : null;

            console.log('Converted data:', data);

            const result = await apiCall('/admin/assign-teacher', 'POST', data);
            console.log('Assignment result:', result);

            if (result && result.message) {
                showAlert(result.message);
                e.target.reset();
                loadTeacherAssignments(); // Reload the table
            } else {
                showAlert('Teacher assigned successfully', 'success');
                e.target.reset();
                loadTeacherAssignments(); // Reload the table
            }
        } catch (error) {
            console.error('Error assigning teacher:', error);
            showAlert('Error: ' + error.message, 'error');
        }
    });
}

if (enrollStudentForm) {
    enrollStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            console.log('Enrolling student with data:', data);

            // Convert to integers
            data.studentId = parseInt(data.studentId);
            data.courseId = parseInt(data.courseId);
            data.sectionId = parseInt(data.sectionId);
            data.sessionId = parseInt(data.sessionId);

            console.log('Converted data:', data);

            const result = await apiCall('/admin/enroll-student', 'POST', data);
            console.log('Enrollment result:', result);

            if (result && result.message) {
                showAlert(result.message);
                e.target.reset();
                loadStudentEnrollments(); // Reload the table
            } else {
                showAlert('Student enrolled successfully', 'success');
                e.target.reset();
                loadStudentEnrollments(); // Reload the table
            }
        } catch (error) {
            console.error('Error enrolling student:', error);
            showAlert('Error: ' + error.message, 'error');
        }
    });
}

// Timetable form handler
const createTimetableForm = document.getElementById('createTimetableForm');
if (createTimetableForm) {
    createTimetableForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // Convert to appropriate types
            data.courseId = parseInt(data.courseId);
            data.teacherId = parseInt(data.teacherId);
            data.sectionId = data.sectionId ? parseInt(data.sectionId) : null;

            // Format time strings properly (ensure HH:mm:ss format)
            if (data.startTime) {
                data.startTime = data.startTime.length === 5 ? data.startTime + ':00' : data.startTime;
            }
            if (data.endTime) {
                data.endTime = data.endTime.length === 5 ? data.endTime + ':00' : data.endTime;
            }

            const result = await apiCall('/admin/timetables', 'POST', data);

            if (result && result.message) {
                showAlert(result.message, 'success');
                hideAddTimetableForm();
                loadTimetable();
            }
        } catch (error) {
            console.error('Error creating timetable:', error);
            showAlert('Error: ' + error.message, 'error');
        }
    });
}

// Delete attendance record
async function deleteAttendance(attendanceId) {
    if (!confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) {
        return;
    }

    try {
        const result = await apiCall(`/admin/attendances/${attendanceId}`, 'DELETE');
        if (result && result.message) {
            showAlert(result.message, 'success');
            // Reload the current view
            loadAttendances();
        }
    } catch (error) {
        console.error('Error deleting attendance:', error);
        showAlert('Error: ' + error.message, 'error');
    }
}
