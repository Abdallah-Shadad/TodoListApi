// Configuration
const CONFIG = {
    baseUrl: 'http://localhost:5257/api',
    validation: {
        minPasswordLength: 6,
        minUsernameLength: 3,
        minNameLength: 2
    }
};

// State management
const state = {
    token: localStorage.getItem('todoToken') || null,
    user: JSON.parse(localStorage.getItem('todoUser') || 'null'),
    editingTaskId: null,
    currentView: 'login',
    loadingStates: new Set()
};

// DOM elements cache
const elements = {
    // Navigation
    navLogin: document.getElementById('nav-login'),
    navRegister: document.getElementById('nav-register'),
    navLogout: document.getElementById('nav-logout'),

    // Sections
    loginSection: document.getElementById('login-section'),
    registerSection: document.getElementById('register-section'),
    dashboardSection: document.getElementById('dashboard-section'),

    // Forms
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    taskForm: document.getElementById('task-form'),

    // Form inputs and validation
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    registerName: document.getElementById('register-name'),
    registerUsername: document.getElementById('register-username'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    taskTitle: document.getElementById('task-title'),
    taskDescription: document.getElementById('task-description'),
    taskDueDate: document.getElementById('task-dueDate'),

    // Form errors
    loginEmailError: document.getElementById('login-email-error'),
    loginPasswordError: document.getElementById('login-password-error'),
    registerNameError: document.getElementById('register-name-error'),
    registerUsernameError: document.getElementById('register-username-error'),
    registerEmailError: document.getElementById('register-email-error'),
    registerPasswordError: document.getElementById('register-password-error'),
    taskTitleError: document.getElementById('task-title-error'),
    taskDueDateError: document.getElementById('task-dueDate-error'),

    // Buttons and loading states
    loginSubmit: document.getElementById('login-submit'),
    registerSubmit: document.getElementById('register-submit'),
    taskSubmit: document.getElementById('task-submit'),
    taskCancel: document.getElementById('task-cancel'),
    refreshTasks: document.getElementById('refresh-tasks'),

    // Dashboard elements
    userName: document.getElementById('user-name'),
    taskList: document.getElementById('task-list'),
    tasksCount: document.getElementById('tasks-count'),
    emptyState: document.getElementById('empty-state'),
    taskSubmitText: document.getElementById('task-submit-text'),

    // Switch buttons
    switchToRegister: document.getElementById('switch-to-register'),
    switchToLogin: document.getElementById('switch-to-login'),

    // Toast container
    toastContainer: document.getElementById('toast-container')
};

// Utility functions
function saveAuth(token, user) {
    state.token = token;
    state.user = user;
    localStorage.setItem('todoToken', token);
    localStorage.setItem('todoUser', JSON.stringify(user));
}

function clearAuth() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('todoToken');
    localStorage.removeItem('todoUser');
}

function getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth && state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }
    return headers;
}

function setLoading(element, loading) {
    const button = element.closest('.btn');
    const spinner = button.querySelector('.btn-spinner');
    const text = button.querySelector('.btn-text');

    if (loading) {
        state.loadingStates.add(element.id);
        button.disabled = true;
        spinner.classList.remove('hidden');
        text.style.opacity = '0.7';
    } else {
        state.loadingStates.delete(element.id);
        button.disabled = false;
        spinner.classList.add('hidden');
        text.style.opacity = '1';
    }
}

function showError(element, message) {
    const errorDiv = document.getElementById(`${element.id}-error`);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
    element.classList.add('error');
    element.classList.remove('success');
}

function hideError(element) {
    const errorDiv = document.getElementById(`${element.id}-error`);
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.remove('show');
    }
    element.classList.remove('error');
    element.classList.remove('success');
}

function showSuccess(element) {
    element.classList.add('success');
    element.classList.remove('error');
    hideError(element);
}

function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
}

// Toast notification system
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : '✕';
    const bgColor = type === 'success' ? 'var(--color-success)' : 'var(--color-error)';

    toast.innerHTML = `
        <div class="toast-icon" style="color: ${bgColor}">${icon}</div>
        <div class="toast-content">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    elements.toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// API request wrapper
async function apiRequest(path, options = {}) {
    const url = `${CONFIG.baseUrl}${path}`;
    const config = {
        headers: getHeaders(true),
        ...options,
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 401) {
            clearAuth();
            switchView('login');
            showToast('Session expired. Please sign in again.', 'error');
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            let payload = null;
            try {
                payload = await response.json();
            } catch (e) {
                // Ignore JSON parse errors
            }
            const message = payload?.message || payload?.title || response.statusText || 'Request failed';
            throw new Error(message);
        }

        return response.status === 204 ? null : response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
}

// View management
function switchView(view) {
    state.currentView = view;

    // Hide all sections
    elements.loginSection.classList.add('hidden');
    elements.registerSection.classList.add('hidden');
    elements.dashboardSection.classList.add('hidden');

    // Show target section with animation
    const targetSection = elements[`${view}Section`];
    targetSection.classList.remove('hidden');

    // Update navigation
    elements.navLogin.classList.toggle('hidden', view === 'dashboard');
    elements.navRegister.classList.toggle('hidden', view === 'dashboard');
    elements.navLogout.classList.toggle('hidden', view !== 'dashboard');

    // Update dashboard content if switching to dashboard
    if (view === 'dashboard' && state.user) {
        elements.userName.textContent = state.user.username;
        loadTasks();
    }
}

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= CONFIG.validation.minPasswordLength;
}

function validateUsername(username) {
    return username.length >= CONFIG.validation.minUsernameLength && /^[a-zA-Z0-9_]+$/.test(username);
}

function validateName(name) {
    return name.length >= CONFIG.validation.minNameLength && /^[a-zA-Z\s]+$/.test(name);
}

function validateRequired(value) {
    return value.trim().length > 0;
}

function validateDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
}

// Real-time validation
function setupValidation() {
    // Login form validation
    elements.loginEmail.addEventListener('input', () => {
        const value = elements.loginEmail.value.trim();
        if (value === '') {
            hideError(elements.loginEmail);
        } else if (validateEmail(value)) {
            showSuccess(elements.loginEmail);
        } else {
            showError(elements.loginEmail, 'Please enter a valid email address');
        }
    });

    elements.loginPassword.addEventListener('input', () => {
        const value = elements.loginPassword.value;
        if (value === '') {
            hideError(elements.loginPassword);
        } else if (validatePassword(value)) {
            showSuccess(elements.loginPassword);
        } else {
            showError(elements.loginPassword, `Password must be at least ${CONFIG.validation.minPasswordLength} characters`);
        }
    });

    // Register form validation
    elements.registerName.addEventListener('input', () => {
        const value = elements.registerName.value.trim();
        if (value === '') {
            hideError(elements.registerName);
        } else if (validateName(value)) {
            showSuccess(elements.registerName);
        } else {
            showError(elements.registerName, 'Please enter a valid name (letters and spaces only)');
        }
    });

    elements.registerUsername.addEventListener('input', () => {
        const value = elements.registerUsername.value.trim();
        if (value === '') {
            hideError(elements.registerUsername);
        } else if (validateUsername(value)) {
            showSuccess(elements.registerUsername);
        } else {
            showError(elements.registerUsername, `Username must be at least ${CONFIG.validation.minUsernameLength} characters (letters, numbers, underscores only)`);
        }
    });

    elements.registerEmail.addEventListener('input', () => {
        const value = elements.registerEmail.value.trim();
        if (value === '') {
            hideError(elements.registerEmail);
        } else if (validateEmail(value)) {
            showSuccess(elements.registerEmail);
        } else {
            showError(elements.registerEmail, 'Please enter a valid email address');
        }
    });

    elements.registerPassword.addEventListener('input', () => {
        const value = elements.registerPassword.value;
        if (value === '') {
            hideError(elements.registerPassword);
        } else if (validatePassword(value)) {
            showSuccess(elements.registerPassword);
        } else {
            showError(elements.registerPassword, `Password must be at least ${CONFIG.validation.minPasswordLength} characters`);
        }
    });

    // Task form validation
    elements.taskTitle.addEventListener('input', () => {
        const value = elements.taskTitle.value.trim();
        if (value === '') {
            hideError(elements.taskTitle);
        } else if (validateRequired(value)) {
            showSuccess(elements.taskTitle);
        } else {
            showError(elements.taskTitle, 'Task title is required');
        }
    });

    elements.taskDueDate.addEventListener('input', () => {
        const value = elements.taskDueDate.value;
        if (value === '') {
            hideError(elements.taskDueDate);
        } else if (validateDate(value)) {
            showSuccess(elements.taskDueDate);
        } else {
            showError(elements.taskDueDate, 'Please select a date in the future');
        }
    });
}

// Form submission handlers
async function handleLogin(event) {
    event.preventDefault();

    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;

    // Validate all fields
    let hasErrors = false;
    if (!validateEmail(email)) {
        showError(elements.loginEmail, 'Please enter a valid email address');
        hasErrors = true;
    }
    if (!validatePassword(password)) {
        showError(elements.loginPassword, `Password must be at least ${CONFIG.validation.minPasswordLength} characters`);
        hasErrors = true;
    }

    if (hasErrors) {
        shakeElement(elements.loginForm);
        return;
    }

    setLoading(elements.loginSubmit, true);

    try {
        const payload = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: getHeaders(false),
        });

        saveAuth(payload.token, { username: payload.username, email: payload.email });
        switchView('dashboard');
        showToast('Welcome back!');
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
        shakeElement(elements.loginForm);
    } finally {
        setLoading(elements.loginSubmit, false);
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const name = elements.registerName.value.trim();
    const username = elements.registerUsername.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;

    // Validate all fields
    let hasErrors = false;
    if (!validateName(name)) {
        showError(elements.registerName, 'Please enter a valid name');
        hasErrors = true;
    }
    if (!validateUsername(username)) {
        showError(elements.registerUsername, `Username must be at least ${CONFIG.validation.minUsernameLength} characters`);
        hasErrors = true;
    }
    if (!validateEmail(email)) {
        showError(elements.registerEmail, 'Please enter a valid email address');
        hasErrors = true;
    }
    if (!validatePassword(password)) {
        showError(elements.registerPassword, `Password must be at least ${CONFIG.validation.minPasswordLength} characters`);
        hasErrors = true;
    }

    if (hasErrors) {
        shakeElement(elements.registerForm);
        return;
    }

    setLoading(elements.registerSubmit, true);

    try {
        await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, username, email, password }),
            headers: getHeaders(false),
        });

        showToast('Account created successfully! Please sign in.');
        switchView('login');
        elements.registerForm.reset();
    } catch (error) {
        showToast(error.message || 'Registration failed', 'error');
        shakeElement(elements.registerForm);
    } finally {
        setLoading(elements.registerSubmit, false);
    }
}

async function handleTaskSubmit(event) {
    event.preventDefault();

    const title = elements.taskTitle.value.trim();
    const description = elements.taskDescription.value.trim();
    const dueDate = elements.taskDueDate.value;

    // Validate required fields
    let hasErrors = false;
    if (!validateRequired(title)) {
        showError(elements.taskTitle, 'Task title is required');
        hasErrors = true;
    }
    if (!validateDate(dueDate)) {
        showError(elements.taskDueDate, 'Please select a valid future date');
        hasErrors = true;
    }

    if (hasErrors) {
        shakeElement(elements.taskForm);
        return;
    }

    const payload = { title, description, dueDate };
    const method = state.editingTaskId ? 'PUT' : 'POST';
    const path = state.editingTaskId ? `/tasks/${state.editingTaskId}` : '/tasks';

    setLoading(elements.taskSubmit, true);

    try {
        await apiRequest(path, {
            method,
            body: JSON.stringify(payload),
        });

        showToast(state.editingTaskId ? 'Task updated successfully!' : 'Task added successfully!');
        resetTaskForm();
        loadTasks();
    } catch (error) {
        showToast(error.message || 'Failed to save task', 'error');
        shakeElement(elements.taskForm);
    } finally {
        setLoading(elements.taskSubmit, false);
    }
}

// Task management functions
function resetTaskForm() {
    state.editingTaskId = null;
    elements.taskForm.reset();
    elements.taskSubmitText.textContent = 'Add Task';
    elements.taskCancel.classList.add('hidden');

    // Clear validation states
    [elements.taskTitle, elements.taskDueDate].forEach(el => {
        el.classList.remove('error', 'success');
        const errorDiv = document.getElementById(`${el.id}-error`);
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.classList.remove('show');
        }
    });
}

function editTask(task) {
    state.editingTaskId = task.id;
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description || '';
    elements.taskDueDate.value = task.dueDate.slice(0, 10);
    elements.taskSubmitText.textContent = 'Update Task';
    elements.taskCancel.classList.remove('hidden');

    // Trigger validation for pre-filled values
    elements.taskTitle.dispatchEvent(new Event('input'));
    elements.taskDueDate.dispatchEvent(new Event('input'));

    // Focus on the title input
    elements.taskTitle.focus();
}

async function loadTasks() {
    try {
        const tasks = await apiRequest('/tasks');
        renderTasks(tasks || []);
    } catch (error) {
        elements.taskList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3 class="empty-state-title">Unable to load tasks</h3><p class="empty-state-text">Please try again later</p></div>';
        if (error.message !== 'Unauthorized') {
            showToast(error.message || 'Could not fetch tasks', 'error');
        }
    }
}

function renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
        elements.taskList.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        elements.tasksCount.textContent = '0 tasks';
        return;
    }

    elements.emptyState.classList.add('hidden');
    elements.tasksCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;

    // Sort tasks by due date
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    elements.taskList.innerHTML = '';
    sortedTasks.forEach((task, index) => {
        const taskCard = createTaskCard(task);
        taskCard.style.animationDelay = `${index * 0.1}s`;
        elements.taskList.appendChild(taskCard);
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card${task.isCompleted ? ' completed' : ''}`;
    card.dataset.taskId = task.id;

    const dueDate = new Date(task.dueDate);
    const isOverdue = !task.isCompleted && dueDate < new Date();

    card.innerHTML = `
        <h3 class="task-title">${task.title}</h3>
        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        <div class="task-meta">
            <span class="task-due-date${isOverdue ? ' overdue' : ''}">
                📅 ${dueDate.toLocaleDateString()}
            </span>
            <span class="task-status${task.isCompleted ? ' completed' : ''}">
                ${task.isCompleted ? '✅ Completed' : '⏳ Pending'}
            </span>
        </div>
        <div class="task-actions">
            <button class="task-btn edit" onclick="editTaskFromCard('${task.id}')">
                ✏️ Edit
            </button>
            <button class="task-btn ${task.isCompleted ? 'complete' : 'complete'}" onclick="toggleTask('${task.id}')">
                ${task.isCompleted ? '↩️ Mark Pending' : '✅ Mark Complete'}
            </button>
            <button class="task-btn delete" onclick="deleteTask('${task.id}')">
                🗑️ Delete
            </button>
        </div>
    `;

    return card;
}

// Global functions for onclick handlers
window.editTaskFromCard = (taskId) => {
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskCard) {
        // Find the task data (you might want to store this differently)
        // For now, we'll reload tasks and find the task
        loadTasks().then(() => {
            // This is a simplified approach - in a real app you'd store task data
            apiRequest(`/tasks/${taskId}`).then(task => editTask(task));
        });
    }
};

window.toggleTask = async (taskId) => {
    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'PATCH',
            body: JSON.stringify({}), // The backend should toggle completion
        });

        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskCard) {
            taskCard.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => loadTasks(), 300);
        }

        showToast('Task status updated!');
    } catch (error) {
        showToast(error.message || 'Failed to update task', 'error');
    }
};

window.deleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        await apiRequest(`/tasks/${taskId}`, {
            method: 'DELETE',
        });

        const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskCard) {
            taskCard.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => loadTasks(), 300);
        }

        showToast('Task deleted successfully!');
    } catch (error) {
        showToast(error.message || 'Failed to delete task', 'error');
    }
};

// Event listeners setup
function setupEventListeners() {
    // Navigation
    elements.navLogin.addEventListener('click', () => switchView('login'));
    elements.navRegister.addEventListener('click', () => switchView('register'));
    elements.navLogout.addEventListener('click', () => {
        clearAuth();
        resetTaskForm();
        switchView('login');
        showToast('Signed out successfully.');
    });

    // Form switches
    elements.switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('register');
    });
    elements.switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('login');
    });

    // Form submissions
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.taskForm.addEventListener('submit', handleTaskSubmit);

    // Task form controls
    elements.taskCancel.addEventListener('click', resetTaskForm);
    elements.refreshTasks.addEventListener('click', loadTasks);
}

// Initialize the application
function initialize() {
    setupValidation();
    setupEventListeners();

    // Check if user is already logged in
    if (state.token && state.user) {
        switchView('dashboard');
    } else {
        switchView('login');
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', initialize);