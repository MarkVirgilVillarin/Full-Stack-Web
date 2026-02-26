/**
 * Full-Stack App Script
 * Implements client-side routing, auth simulation, and data persistence
 */

// --- Global Variables & State ---
let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    initApp();
});

function initApp() {
    // Listen for route changes
    window.addEventListener('hashchange', handleRouting);
    
    // Check initial auth state
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
        const user = window.db.accounts.find(a => a.email === savedToken && a.verified);
        if (user) {
            setAuthState(true, user);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // Initial routing
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
    handleRouting();

    // Event Listeners for Forms
    setupFormListeners();
}

// --- Routing ---
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    const pages = document.querySelectorAll('.page');
    
    // Hide all pages
    pages.forEach(p => p.classList.remove('active'));

    // Route logic
    let targetPageId = 'home-page';
    
    if (hash === '#/') targetPageId = 'home-page';
    else if (hash === '#/login') targetPageId = 'login-page';
    else if (hash === '#/register') targetPageId = 'register-page';
    else if (hash === '#/verify-email') targetPageId = 'verify-email-page';
    else if (hash === '#/profile') targetPageId = 'profile-page';
    else if (hash === '#/requests') targetPageId = 'requests-page';
    else if (hash === '#/employees') targetPageId = 'employees-page';
    else if (hash === '#/accounts') targetPageId = 'accounts-page';
    else if (hash === '#/departments') targetPageId = 'departments-page';

    // Protection logic
    const protectedRoutes = ['#/profile', '#/requests', '#/employees', '#/accounts', '#/departments'];
    const adminRoutes = ['#/employees', '#/accounts', '#/departments'];

    if (protectedRoutes.includes(hash) && !currentUser) {
        navigateTo('#/login');
        return;
    }

    if (adminRoutes.includes(hash) && (!currentUser || currentUser.role !== 'Admin')) {
        navigateTo('#/');
        showToast('Access Denied: Admin only', 'danger');
        return;
    }

    // Special page renders
    if (hash === '#/profile') renderProfile();
    if (hash === '#/requests') renderRequests();
    if (hash === '#/accounts') renderAccountsList();
    if (hash === '#/departments') renderDepartments();
    if (hash === '#/employees') renderEmployeesTable();
    if (hash === '#/verify-email') {
        const unverified = localStorage.getItem('unverified_email');
        document.getElementById('unverified-email-display').textContent = unverified || 'your email';
    }

    const targetPage = document.getElementById(targetPageId);
    if (targetPage) targetPage.classList.add('active');
}

// --- Authentication ---
function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;
    
    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        document.getElementById('nav-username').textContent = `${user.firstName} (${user.role})`;
        
        if (user.role === 'Admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
    } else {
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated');
        body.classList.remove('is-admin');
        currentUser = null;
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    setAuthState(false);
    navigateTo('#/');
    showToast('Logged out successfully');
}

// --- Data Persistence ---
function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            window.db = JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse storage', e);
            seedData();
        }
    } else {
        seedData();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function seedData() {
    window.db = {
        accounts: [
            { 
                firstName: 'Admin', 
                lastName: 'User', 
                email: 'admin@example.com', 
                password: 'Password123!', 
                role: 'Admin', 
                verified: true 
            }
        ],
        departments: [
            { name: 'Engineering', description: 'Software team' },
            { name: 'HR', description: 'Human Resources' }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

// --- UI Helpers ---
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message');
    const toastTitle = document.getElementById('toast-title');
    
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastTitle.textContent = type === 'success' ? 'Success' : 'Error';
    toastBody.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// --- Event Listeners & Form Handlers ---
function setupFormListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Register
    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const exists = window.db.accounts.find(a => a.email === email);
        
        if (exists) {
            showToast('Email already registered', 'danger');
            return;
        }

        const newUser = {
            firstName: document.getElementById('reg-firstname').value,
            lastName: document.getElementById('reg-lastname').value,
            email: email,
            password: document.getElementById('reg-password').value,
            role: 'User',
            verified: false
        };

        window.db.accounts.push(newUser);
        localStorage.setItem('unverified_email', email);
        saveToStorage();
        navigateTo('#/verify-email');
    });

    // Simulate Verify
    document.getElementById('simulate-verify-btn').addEventListener('click', () => {
        const email = localStorage.getItem('unverified_email');
        const user = window.db.accounts.find(a => a.email === email);
        if (user) {
            user.verified = true;
            saveToStorage();
            document.getElementById('verify-message').textContent = 'Email verified! You may now log in.';
            document.getElementById('simulate-verify-btn').classList.add('d-none');
            document.getElementById('go-to-login-btn').classList.remove('d-none');
            showToast('Email verified successfully');
        }
    });

    // Login
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        
        const user = window.db.accounts.find(a => a.email === email && a.password === pass);
        
        if (!user) {
            errorDiv.textContent = 'Invalid email or password';
            errorDiv.classList.remove('d-none');
            return;
        }

        if (!user.verified) {
            errorDiv.textContent = 'Please verify your email first';
            errorDiv.classList.remove('d-none');
            return;
        }

        errorDiv.classList.add('d-none');
        localStorage.setItem('auth_token', user.email);
        setAuthState(true, user);
        navigateTo('#/profile');
        showToast(`Welcome back, ${user.firstName}!`);
    });

    // Request Form
    document.getElementById('request-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('req-type').value;
        const itemRows = document.querySelectorAll('#request-items-list .input-group');
        const items = [];
        
        itemRows.forEach(row => {
            const name = row.querySelector('input[type="text"]').value;
            const qty = row.querySelector('input[type="number"]').value;
            if (name) items.push({ name, qty });
        });

        if (items.length === 0) {
            showToast('Please add at least one item', 'danger');
            return;
        }

        const newRequest = {
            type,
            items,
            status: 'Pending',
            date: new Date().toLocaleDateString(),
            employeeEmail: currentUser.email
        };

        window.db.requests.push(newRequest);
        saveToStorage();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('newRequestModal'));
        modal.hide();
        e.target.reset();
        renderRequests();
        showToast('Request submitted successfully');
    });

    // Account Form
    document.getElementById('account-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const oldEmail = document.getElementById('acc-old-email').value;
        const email = document.getElementById('acc-email').value;
        const pass = document.getElementById('acc-password').value;
        
        // Check if email already exists (excluding self)
        const exists = window.db.accounts.find(a => a.email === email && a.email !== oldEmail);
        if (exists) {
            showToast('Email already in use', 'danger');
            return;
        }

        const accountData = {
            firstName: document.getElementById('acc-firstname').value,
            lastName: document.getElementById('acc-lastname').value,
            email: email,
            role: document.getElementById('acc-role').value,
            verified: document.getElementById('acc-verified').checked
        };

        if (oldEmail) {
            // Edit existing
            const index = window.db.accounts.findIndex(a => a.email === oldEmail);
            const originalPass = window.db.accounts[index].password;
            window.db.accounts[index] = { ...accountData, password: pass || originalPass };
            showToast('Account updated');
        } else {
            // Add new
            if (!pass) {
                showToast('Password is required for new accounts', 'danger');
                return;
            }
            window.db.accounts.push({ ...accountData, password: pass });
            showToast('Account added');
        }

        saveToStorage();
        const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
        modal.hide();
        renderAccountsList();
    });

    // Employee Form
    document.getElementById('employee-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('emp-email').value;
        const acc = window.db.accounts.find(a => a.email === email);
        
        if (!acc) {
            showToast('No account found with that email', 'danger');
            return;
        }

        const newEmp = {
            id: document.getElementById('emp-id').value,
            name: `${acc.firstName} ${acc.lastName}`,
            email: email,
            position: document.getElementById('emp-position').value,
            dept: document.getElementById('emp-dept').value,
            hireDate: document.getElementById('emp-hiredate').value
        };

        // Check for existing ID
        const existingIdx = window.db.employees.findIndex(emp => emp.id === newEmp.id);
        if (existingIdx !== -1) {
            window.db.employees[existingIdx] = newEmp;
            showToast('Employee updated');
        } else {
            window.db.employees.push(newEmp);
            showToast('Employee added');
        }

        saveToStorage();
        const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
        modal.hide();
        renderEmployeesTable();
    });
}

// --- Page Renders ---
function renderProfile() {
    const container = document.getElementById('profile-details');
    if (!currentUser) return;

    container.innerHTML = `
        <div class="mb-3"><strong>Name:</strong> ${currentUser.firstName} ${currentUser.lastName}</div>
        <div class="mb-3"><strong>Email:</strong> ${currentUser.email}</div>
        <div class="mb-3"><strong>Role:</strong> ${currentUser.role}</div>
    `;
}

function renderRequests() {
    const tbody = document.getElementById('requests-table-body');
    const userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
    
    tbody.innerHTML = userRequests.length ? '' : '<tr><td colspan="4" class="text-center">No requests yet</td></tr>';
    
    userRequests.forEach(r => {
        const itemsStr = r.items.map(i => `${i.name} (${i.qty})`).join(', ');
        const statusClass = r.status === 'Pending' ? 'warning' : (r.status === 'Approved' ? 'success' : 'danger');
        
        tbody.innerHTML += `
            <tr>
                <td>${r.type}</td>
                <td>${itemsStr}</td>
                <td><span class="badge bg-${statusClass}">${r.status}</span></td>
                <td>${r.date}</td>
            </tr>
        `;
    });
}

function renderAccountsList() {
    const tbody = document.getElementById('accounts-table-body');
    tbody.innerHTML = '';
    
    window.db.accounts.forEach((acc, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${acc.firstName} ${acc.lastName}</td>
                <td>${acc.email}</td>
                <td>${acc.role}</td>
                <td>${acc.verified ? '✅' : '❌'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editAccount('${acc.email}')">Edit</button>
                    <button class="btn btn-sm btn-outline-warning" onclick="resetPassword('${acc.email}')">Reset PW</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount('${acc.email}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

function renderDepartments() {
    const tbody = document.getElementById('departments-table-body');
    tbody.innerHTML = '';
    window.db.departments.forEach(dept => {
        tbody.innerHTML += `
            <tr>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="alert('Not implemented')">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="alert('Not implemented')">Delete</button>
                </td>
            </tr>
        `;
    });
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-table-body');
    tbody.innerHTML = window.db.employees.length ? '' : '<tr><td colspan="5" class="text-center">No employees yet</td></tr>';
    
    window.db.employees.forEach(emp => {
        tbody.innerHTML += `
            <tr>
                <td>${emp.id}</td>
                <td>${emp.name}</td>
                <td>${emp.position}</td>
                <td>${emp.dept}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${emp.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

// --- Request Modal Helpers ---
function addRequestItem() {
    const container = document.getElementById('request-items-list');
    const div = document.createElement('div');
    div.className = 'input-group mb-2';
    div.innerHTML = `
        <input type="text" class="form-control" placeholder="Item name" required>
        <input type="number" class="form-control" placeholder="Qty" style="max-width: 80px;" value="1" min="1" required>
        <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.remove()">x</button>
    `;
    container.appendChild(div);
}

// --- Admin CRUD Operations ---
function deleteAccount(email) {
    if (email === currentUser.email) {
        showToast('Cannot delete yourself!', 'danger');
        return;
    }
    if (confirm(`Are you sure you want to delete account ${email}?`)) {
        window.db.accounts = window.db.accounts.filter(a => a.email !== email);
        saveToStorage();
        renderAccountsList();
        showToast('Account deleted');
    }
}

function resetPassword(email) {
    const newPass = prompt('Enter new password (min 6 chars):');
    if (newPass && newPass.length >= 6) {
        const acc = window.db.accounts.find(a => a.email === email);
        if (acc) {
            acc.password = newPass;
            saveToStorage();
            showToast('Password reset successfully');
        }
    } else if (newPass) {
        showToast('Password too short', 'danger');
    }
}

function showAccountModal(email = null) {
    const form = document.getElementById('account-form');
    form.reset();
    const title = document.getElementById('accountModalTitle');
    const passGroup = document.getElementById('acc-password-group');
    
    if (email) {
        const acc = window.db.accounts.find(a => a.email === email);
        title.textContent = 'Edit Account';
        document.getElementById('acc-old-email').value = acc.email;
        document.getElementById('acc-firstname').value = acc.firstName;
        document.getElementById('acc-lastname').value = acc.lastName;
        document.getElementById('acc-email').value = acc.email;
        document.getElementById('acc-role').value = acc.role;
        document.getElementById('acc-verified').checked = acc.verified;
        document.getElementById('acc-password').placeholder = 'Leave blank to keep current';
        document.getElementById('acc-password').required = false;
    } else {
        title.textContent = 'Add Account';
        document.getElementById('acc-old-email').value = '';
        document.getElementById('acc-password').placeholder = '';
        document.getElementById('acc-password').required = true;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    modal.show();
}

function editAccount(email) {
    showAccountModal(email);
}

function showEmployeeModal(id = null) {
    const form = document.getElementById('employee-form');
    form.reset();
    
    // Populate departments dropdown
    const deptSelect = document.getElementById('emp-dept');
    deptSelect.innerHTML = window.db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    
    if (id) {
        const emp = window.db.employees.find(e => e.id === id);
        document.getElementById('emp-id').value = emp.id;
        document.getElementById('emp-id').readOnly = true;
        document.getElementById('emp-email').value = emp.email;
        document.getElementById('emp-position').value = emp.position;
        document.getElementById('emp-dept').value = emp.dept;
        document.getElementById('emp-hiredate').value = emp.hireDate;
    } else {
        document.getElementById('emp-id').readOnly = false;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    modal.show();
}

function deleteEmployee(id) {
    if (confirm(`Are you sure you want to delete employee ${id}?`)) {
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveToStorage();
        renderEmployeesTable();
        showToast('Employee deleted');
    }
}
