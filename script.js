// Data Storage (simulating a database)
let users = [
    { username: 'admin1', password: 'Admin@123', role: 'Admin' },
    { username: 'lead1', password: 'Lead@123', role: 'Project Lead' },
    { username: 'dev1', password: 'Dev@123', role: 'Developer' }
];

let projects = [];
let currentUser = null;
let projectIdCounter = 1;

// Utility Functions
function hashPassword(password) {
    // Simple hash simulation (in production, use bcrypt)
    return btoa(password + 'salt');
}

function verifyPassword(password, hash) {
    return btoa(password + 'salt') === hash;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Authentication Functions
function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }
    return false;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginForm();
}

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
}

// UI Functions
function showLoginForm() {
    document.querySelector('.container').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
    document.querySelector('.container').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser.username} (${currentUser.role})`;

    // Hide all dashboards first
    document.querySelectorAll('.role-dashboard').forEach(dash => dash.classList.add('hidden'));

    // Show appropriate dashboard
    switch(currentUser.role) {
        case 'Admin':
            document.getElementById('adminDashboard').classList.remove('hidden');
            loadAdminDashboard();
            break;
        case 'Project Lead':
            document.getElementById('leadDashboard').classList.remove('hidden');
            loadLeadDashboard();
            break;
        case 'Developer':
            document.getElementById('devDashboard').classList.remove('hidden');
            loadDevDashboard();
            break;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    setTimeout(() => errorDiv.textContent = '', 3000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.className = 'success';
    setTimeout(() => {
        errorDiv.textContent = '';
        errorDiv.className = 'error';
    }, 3000);
}

// Admin Functions
function loadAdminDashboard() {
    loadProjectsList();
    loadUsersList();
    updateStatistics();
    setTimeout(initializeCharts, 100); // Small delay to ensure DOM is ready
}

function loadProjectsList() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';

    projects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.innerHTML = `
            <h4>${project.name}</h4>
            <p><strong>Description:</strong> ${project.description}</p>
            <p><strong>Deadline:</strong> ${project.deadline}</p>
            <p><strong>Status:</strong> <span class="status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span></p>
            <p><strong>Assigned Members:</strong> ${project.assignedMembers.length}</p>
            <div class="project-actions">
                <button onclick="viewProject('${project.id}')">View Details</button>
                <button onclick="uploadDocument('${project.id}')" class="btn-secondary">Upload Document</button>
                ${project.status === 'Active' ? 
                    `<button onclick="markCompleted('${project.id}')" class="btn-success">Mark Complete</button>` : 
                    ''}
                <button onclick="deleteProject('${project.id}')" class="btn-danger">Delete</button>
            </div>
        `;
        projectsList.appendChild(projectDiv);
    });
}

function loadUsersList() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <h4>${user.username}</h4>
            <p><strong>Role:</strong> ${user.role}</p>
            <div class="user-actions">
                <button onclick="editUser('${user.username}')" class="btn-secondary">Edit Role</button>
                ${user.username !== currentUser.username ? 
                    `<button onclick="deleteUser('${user.username}')" class="btn-danger">Delete</button>` : 
                    ''}
            </div>
        `;
        usersList.appendChild(userDiv);
    });
}

function addProject(name, description, deadline) {
    const project = {
        id: generateId(),
        name,
        description,
        deadline,
        status: 'Active',
        assignedMembers: [],
        documents: [],
        createdBy: currentUser.username
    };
    projects.push(project);
    loadProjectsList();
    updateStatistics();
    addActivityItem(`<strong>${currentUser.username}</strong> created new project "${name}"`, 'fas fa-plus-circle');
}

function markCompleted(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.status = 'Completed';
        loadProjectsList();
        updateStatistics();
        addActivityItem(`<strong>${currentUser.username}</strong> completed project "${project.name}"`, 'fas fa-check-circle');
        showSuccess('Project marked as completed!');
    }
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== projectId);
        loadProjectsList();
        showSuccess('Project deleted successfully!');
    }
}

function addUser(username, password, role) {
    if (users.find(u => u.username === username)) {
        showError('Username already exists!');
        return false;
    }

    users.push({ username, password, role });
    loadUsersList();
    showSuccess('User added successfully!');
    return true;
}

function deleteUser(username) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(u => u.username !== username);
        loadUsersList();
        showSuccess('User deleted successfully!');
    }
}

// Project Lead Functions
function loadLeadDashboard() {
    const leadProjectsList = document.getElementById('leadProjectsList');
    leadProjectsList.innerHTML = '';

    const leadProjects = projects.filter(p => 
        p.createdBy === currentUser.username || 
        (currentUser.role === 'Project Lead' && p.assignedMembers.includes(currentUser.username))
    );

    leadProjects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.innerHTML = `
            <h4>${project.name}</h4>
            <p><strong>Description:</strong> ${project.description}</p>
            <p><strong>Deadline:</strong> ${project.deadline}</p>
            <p><strong>Status:</strong> <span class="status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span></p>
            <p><strong>Assigned Members:</strong> ${project.assignedMembers.length}</p>
            <div class="project-actions">
                <button onclick="viewProject('${project.id}')">View Details</button>
                <button onclick="assignMembers('${project.id}')" class="btn-secondary">Assign Members</button>
                <button onclick="uploadDocument('${project.id}')" class="btn-success">Upload Document</button>
            </div>
        `;
        leadProjectsList.appendChild(projectDiv);
    });

    if (leadProjects.length === 0) {
        leadProjectsList.innerHTML = '<p>No projects assigned to you yet.</p>';
    }
}

// Developer Functions
function loadDevDashboard() {
    const devProjectsList = document.getElementById('devProjectsList');
    devProjectsList.innerHTML = '';

    const devProjects = projects.filter(p => p.assignedMembers.includes(currentUser.username));

    devProjects.forEach(project => {
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item';
        projectDiv.innerHTML = `
            <h4>${project.name}</h4>
            <p><strong>Description:</strong> ${project.description}</p>
            <p><strong>Deadline:</strong> ${project.deadline}</p>
            <p><strong>Status:</strong> <span class="status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span></p>
            <p><strong>Documents:</strong> ${project.documents.length}</p>
            <div class="project-actions">
                <button onclick="viewProject('${project.id}')">View Details</button>
            </div>
        `;
        devProjectsList.appendChild(projectDiv);
    });

    if (devProjects.length === 0) {
        devProjectsList.innerHTML = '<p>No projects assigned to you yet.</p>';
    }
}

// Project Detail Functions
function viewProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const modal = document.getElementById('projectModal');
    const details = document.getElementById('projectDetails');

    const membersList = project.assignedMembers.length > 0 ? 
        project.assignedMembers.join(', ') : 'No members assigned';

    const documentsList = project.documents.length > 0 ?
        project.documents.map(doc => `<div class="document-item"><a href="#" onclick="downloadDocument('${doc.id}')">${doc.name}</a></div>`).join('') :
        '<p>No documents uploaded</p>';

    details.innerHTML = `
        <h3>${project.name}</h3>
        <p><strong>Description:</strong> ${project.description}</p>
        <p><strong>Deadline:</strong> ${project.deadline}</p>
        <p><strong>Status:</strong> <span class="status-${project.status.toLowerCase().replace(' ', '-')}">${project.status}</span></p>
        <p><strong>Created by:</strong> ${project.createdBy}</p>
        <p><strong>Assigned Members:</strong> ${membersList}</p>
        <div class="document-list">
            <h4>Project Documents:</h4>
            ${documentsList}
        </div>
    `;

    modal.classList.remove('hidden');
}

function assignMembers(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const developers = users.filter(u => u.role === 'Developer');

    const modal = document.getElementById('projectModal');
    const details = document.getElementById('projectDetails');

    const checkboxes = developers.map(dev => `
        <div class="user-checkbox">
            <input type="checkbox" id="user_${dev.username}" ${project.assignedMembers.includes(dev.username) ? 'checked' : ''}>
            <label for="user_${dev.username}">${dev.username}</label>
        </div>
    `).join('');

    details.innerHTML = `
        <h3>Assign Members to: ${project.name}</h3>
        <div class="assignment-section">
            <h4>Select Developers:</h4>
            ${checkboxes}
            <button onclick="saveAssignments('${projectId}')" style="margin-top: 15px;">Save Assignments</button>
        </div>
    `;

    modal.classList.remove('hidden');
}

function saveAssignments(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const developers = users.filter(u => u.role === 'Developer');
    project.assignedMembers = [];

    developers.forEach(dev => {
        const checkbox = document.getElementById(`user_${dev.username}`);
        if (checkbox && checkbox.checked) {
            project.assignedMembers.push(dev.username);
        }
    });

    document.getElementById('projectModal').classList.add('hidden');
    showSuccess('Member assignments updated!');

    // Refresh the appropriate dashboard
    if (currentUser.role === 'Admin') {
        loadAdminDashboard();
    } else if (currentUser.role === 'Project Lead') {
        loadLeadDashboard();
    }
}

function uploadDocument(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const modal = document.getElementById('projectModal');
    const details = document.getElementById('projectDetails');

    details.innerHTML = `
        <h3>Upload Document for: ${project.name}</h3>
        <div class="file-upload">
            <input type="file" id="documentFile" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg">
            <button onclick="saveDocument('${projectId}')">Upload Document</button>
        </div>
        <div class="document-list">
            <h4>Existing Documents:</h4>
            ${project.documents.map(doc => `
                <div class="document-item">
                    <span>${doc.name}</span>
                    <button onclick="removeDocument('${projectId}', '${doc.id}')" class="btn-danger" style="width: auto; padding: 5px 10px;">Remove</button>
                </div>
            `).join('') || '<p>No documents uploaded</p>'}
        </div>
    `;

    modal.classList.remove('hidden');
}

function saveDocument(projectId) {
    const project = projects.find(p => p.id === projectId);
    const fileInput = document.getElementById('documentFile');

    if (!project || !fileInput.files[0]) {
        showError('Please select a file to upload');
        return;
    }

    const file = fileInput.files[0];
    const document = {
        id: generateId(),
        name: file.name,
        size: file.size,
        uploadedBy: currentUser.username,
        uploadedAt: new Date().toISOString()
    };

    project.documents.push(document);
    document.getElementById('projectModal').classList.add('hidden');
    showSuccess('Document uploaded successfully!');
}

function removeDocument(projectId, documentId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (confirm('Are you sure you want to remove this document?')) {
        project.documents = project.documents.filter(doc => doc.id !== documentId);
        uploadDocument(projectId); // Refresh the upload modal
        showSuccess('Document removed successfully!');
    }
}

function downloadDocument(documentId) {
    showSuccess('Document download would start here (simulated)');
}

// Password Change Function
function changePassword(currentPassword, newPassword) {
    if (currentUser.password !== currentPassword) {
        showError('Current password is incorrect');
        return false;
    }

    currentUser.password = newPassword;
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showSuccess('Password changed successfully!');
    return true;
}

// Infographic Functions
function updateStatistics() {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const totalUsers = users.length;

    // Update the correct element IDs
    const totalProjectsEl = document.getElementById('totalProjects');
    const activeProjectsEl = document.getElementById('activeProjects');
    const completedProjectsEl = document.getElementById('completedProjects');
    const totalUsersEl = document.getElementById('totalUsers');

    if (totalProjectsEl) totalProjectsEl.textContent = totalProjects || '12';
    if (activeProjectsEl) activeProjectsEl.textContent = activeProjects || '8';
    if (completedProjectsEl) completedProjectsEl.textContent = completedProjects || '4';
    if (totalUsersEl) totalUsersEl.textContent = totalUsers || '15';
}

// Interactive Functions
function filterProjects(status) {
    const projectItems = document.querySelectorAll('.project-item');
    
    projectItems.forEach(item => {
        item.classList.remove('filtered-highlight');
        if (status === 'all') {
            item.style.display = 'block';
        } else {
            const statusElement = item.querySelector(`.status-${status}`);
            if (statusElement) {
                item.style.display = 'block';
                item.classList.add('filtered-highlight');
            } else {
                item.style.display = 'none';
            }
        }
    });

    // Update filter feedback
    const filterMessage = document.createElement('div');
    filterMessage.className = 'filter-message';
    filterMessage.innerHTML = `<i class="fas fa-filter"></i> Showing ${status === 'all' ? 'all' : status} projects`;
    filterMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        z-index: 1001;
        animation: slideInRight 0.5s ease;
    `;

    document.body.appendChild(filterMessage);
    setTimeout(() => filterMessage.remove(), 3000);
}

function showUserDistribution() {
    const developers = users.filter(u => u.role === 'Developer').length;
    const leads = users.filter(u => u.role === 'Project Lead').length;
    const admins = users.filter(u => u.role === 'Admin').length;

    const distributionModal = document.createElement('div');
    distributionModal.className = 'modal';
    distributionModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h3><i class="fas fa-users"></i> User Role Distribution</h3>
            <div class="user-distribution">
                <div class="distribution-item">
                    <div class="distribution-icon developer"><i class="fas fa-code"></i></div>
                    <div class="distribution-content">
                        <h4>Developers</h4>
                        <p>${developers || 9} users (${Math.round(((developers || 9) / (users.length || 15)) * 100)}%)</p>
                        <div class="distribution-bar">
                            <div class="distribution-fill developer" style="width: ${((developers || 9) / (users.length || 15)) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="distribution-item">
                    <div class="distribution-icon lead"><i class="fas fa-user-tie"></i></div>
                    <div class="distribution-content">
                        <h4>Project Leads</h4>
                        <p>${leads || 5} users (${Math.round(((leads || 5) / (users.length || 15)) * 100)}%)</p>
                        <div class="distribution-bar">
                            <div class="distribution-fill lead" style="width: ${((leads || 5) / (users.length || 15)) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="distribution-item">
                    <div class="distribution-icon admin"><i class="fas fa-shield-alt"></i></div>
                    <div class="distribution-content">
                        <h4>Admins</h4>
                        <p>${admins || 1} users (${Math.round(((admins || 1) / (users.length || 15)) * 100)}%)</p>
                        <div class="distribution-bar">
                            <div class="distribution-fill admin" style="width: ${((admins || 1) / (users.length || 15)) * 100}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(distributionModal);
}

function toggleChartSegment(segment) {
    showSuccess(`Showing ${segment} projects data in chart`);
}

function highlightRole(role) {
    const roleItems = document.querySelectorAll('.role-bar');
    roleItems.forEach(item => {
        item.style.background = '';
        if (item.textContent.includes(role)) {
            item.style.background = 'rgba(102, 126, 234, 0.1)';
            item.style.transform = 'translateX(10px)';
            setTimeout(() => {
                item.style.transform = 'translateX(0)';
            }, 500);
        }
    });
}

// Add live activity updates
function addActivityItem(message, icon = 'fas fa-info-circle') {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;

    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item recent';
    activityItem.innerHTML = `
        <div class="activity-icon"><i class="${icon}"></i></div>
        <div class="activity-content">
            <p>${message}</p>
            <small>Just now</small>
        </div>
    `;

    activityFeed.insertBefore(activityItem, activityFeed.firstChild);

    // Remove oldest item if more than 5
    if (activityFeed.children.length > 5) {
        activityFeed.removeChild(activityFeed.lastChild);
    }

    // Remove recent class after animation
    setTimeout(() => {
        activityItem.classList.remove('recent');
    }, 3000);
}

function initializeCharts() {
    // Clear previous charts if any
    document.getElementById('projectStatusChart').innerHTML = '';
    document.getElementById('userRoleChart').innerHTML = '';

    // Project Status Chart
    const projectStatusLabels = ['Active', 'Completed', 'On Hold']; // Add 'On Hold' if you implement it
    const projectStatusData = [
        projects.filter(p => p.status === 'Active').length,
        projects.filter(p => p.status === 'Completed').length,
        projects.filter(p => p.status === 'On Hold').length // Placeholder
    ];

    if (projectStatusData.some(data => data > 0)) {
        new Chart(document.getElementById('projectStatusChart'), {
            type: 'pie',
            data: {
                labels: projectStatusLabels,
                datasets: [{
                    data: projectStatusData,
                    backgroundColor: ['#36A2EB', '#8BC34A', '#FFC107'],
                    hoverBackgroundColor: ['#5FA5E3', '#6EBF3A', '#D9A405']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Project Status Distribution'
                    }
                }
            }
        });
    } else {
        document.getElementById('projectStatusChart').innerHTML = '<p>No project data available for chart.</p>';
    }

    // User Role Chart
    const userRoles = ['Admin', 'Project Lead', 'Developer'];
    const userRoleData = [
        users.filter(u => u.role === 'Admin').length,
        users.filter(u => u.role === 'Project Lead').length,
        users.filter(u => u.role === 'Developer').length
    ];

    if (userRoleData.some(data => data > 0)) {
        new Chart(document.getElementById('userRoleChart'), {
            type: 'bar',
            data: {
                labels: userRoles,
                datasets: [{
                    label: 'Number of Users',
                    data: userRoleData,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                    borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'User Role Distribution'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        document.getElementById('userRoleChart').innerHTML = '<p>No user data available for chart.</p>';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();

    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (login(username, password)) {
            showDashboard();
        } else {
            showError('Invalid username or password');
        }
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Add Project button and form
    document.getElementById('addProjectBtn').addEventListener('click', function() {
        document.getElementById('addProjectModal').classList.remove('hidden');
    });

    document.getElementById('addProjectForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('projectName').value;
        const description = document.getElementById('projectDescription').value;
        const deadline = document.getElementById('projectDeadline').value;

        addProject(name, description, deadline);
        document.getElementById('addProjectModal').classList.add('hidden');
        this.reset();
        showSuccess('Project added successfully!');
    });

    // Add User button and form
    document.getElementById('addUserBtn').addEventListener('click', function() {
        document.getElementById('addUserModal').classList.remove('hidden');
    });

    document.getElementById('addUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('userRole').value;

        if (addUser(username, password, role)) {
            document.getElementById('addUserModal').classList.add('hidden');
            this.reset();
        }
    });

    // Account Settings
    document.getElementById('accountSettings').addEventListener('click', function() {
        document.getElementById('accountModal').classList.remove('hidden');
    });

    document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPasswordInput').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showError('New passwords do not match');
            return;
        }

        if (changePassword(currentPassword, newPassword)) {
            document.getElementById('accountModal').classList.add('hidden');
            this.reset();
        }
    });

    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').classList.add('hidden');
        });
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
            }
        });
    });
});

// Sample data for demonstration
function initSampleData() {
    if (projects.length === 0) {
        projects.push({
            id: generateId(),
            name: 'Pixel Adventure Game',
            description: 'A 2D pixel art adventure game with RPG elements',
            deadline: '2024-06-15',
            status: 'Active',
            assignedMembers: ['dev1'],
            documents: [
                {
                    id: generateId(),
                    name: 'Game Design Document.pdf',
                    size: 1024000,
                    uploadedBy: 'admin1',
                    uploadedAt: new Date().toISOString()
                }
            ],
            createdBy: 'admin1'
        });

        projects.push({
            id: generateId(),
            name: 'Mobile Puzzle Game',
            description: 'Casual puzzle game for mobile platforms',
            deadline: '2024-08-30',
            status: 'Active',
            assignedMembers: [],
            documents: [],
            createdBy: 'lead1'
        });
    }
}

// Initialize sample data when the page loads
document.addEventListener('DOMContentLoaded', initSampleData);