// Login handling
document.addEventListener('DOMContentLoaded', () => {
    // Clear invalid cached user data on login page load
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            // If user is valid (provinsi), redirect to dashboard
            if (user.role === 'provinsi' && user.permissions) {
                window.location.href = 'dashboard-admin.html';
                return;
            }
        } catch (e) {
            // Invalid JSON, clear it
            console.log('Clearing invalid cached user data');
            localStorage.removeItem('currentUser');
        }
    }
    
    // Set up password toggles
    setupPasswordToggles();
    
    // Login tabs functionality
    const tabs = document.querySelectorAll('.login-tab');
    const forms = document.querySelectorAll('.login-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            tab.classList.add('active');
            const formId = tab.getAttribute('data-form') + 'LoginForm';
            document.getElementById(formId).classList.add('active');
        });
    });

    // Set up form handlers - BOTH forms use same login but different user pools
    const adminForm = document.getElementById('adminLoginForm');
    const assessmentForm = document.getElementById('assessmentLoginForm');
    
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => handleAdminLogin(e));
    }
    
    if (assessmentForm) {
        assessmentForm.addEventListener('submit', (e) => handleAssessmentLogin(e));
    }

    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
});

// Password visibility toggle functionality
function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent form submission
            const input = this.parentElement.querySelector('input');
            const eyeIcon = this.querySelector('.eye-icon');
            
            // Toggle password visibility
            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                `;
            } else {
                input.type = 'password';
                eyeIcon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                `;
            }
        });
    });
}

// ===== ADMIN LOGIN =====
// Admin users pool - ONLY provinsi role can access admin dashboard
const adminUsers = [
    { 
        id: 4, 
        username: 'provinsi1', 
        email: 'provinsi1@jatimprov.go.id', 
        role: 'provinsi', 
        password: 'prov123', 
        type: 'assessment',
        permissions: ['pages', 'program-data', 'documents', 'media', 'notifications', 'provincial-assessment', 'field-assessment', 'review-district-assessment'],
        createdAt: new Date().toISOString() 
    }
];

function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    // Find user in ADMIN users pool
    const user = adminUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Store user data with permissions
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            type: user.type,
            permissions: user.permissions
        }));

        showToast('Login Admin berhasil! Mengalihkan ke Dashboard Admin...', 'success');
        
        setTimeout(() => {
            window.location.replace('dashboard-admin.html');
        }, 1500);
    } else {
        showToast('Username atau password admin salah', 'error');
    }
}

// ===== ASSESSMENT LOGIN =====
// Assessment users pool - all roles except when used for admin
const assessmentUsers = [
    // Assessment users - Masyarakat
    { 
        id: 1, 
        username: 'masyarakat1', 
        email: 'masyarakat1@mail.com', 
        role: 'masyarakat', 
        password: 'password123', 
        type: 'assessment',
        permissions: ['self-assessment', 'registration'],
        createdAt: new Date().toISOString() 
    },
    // Assessment users - Kabupaten/Kota
    { 
        id: 2, 
        username: 'kabkota1', 
        email: 'kabkota1@pemkot.go.id', 
        role: 'kabupaten/kota', 
        password: 'kabkota123', 
        type: 'assessment',
        permissions: ['district-assessment', 'review-self-assessment'],
        createdAt: new Date().toISOString() 
    },
    { 
        id: 3, 
        username: 'kabkota2', 
        email: 'kabkota2@pemkab.go.id', 
        role: 'kabupaten/kota', 
        password: 'kabkota456', 
        type: 'assessment',
        permissions: ['district-assessment', 'review-self-assessment'],
        createdAt: new Date().toISOString() 
    },
    // Assessment users - Provinsi (can view full assessment dashboard)
    { 
        id: 4, 
        username: 'provinsi1', 
        email: 'provinsi1@jatimprov.go.id', 
        role: 'provinsi', 
        password: 'prov123', 
        type: 'assessment',
        permissions: ['provincial-assessment', 'field-assessment', 'review-district-assessment'],
        createdAt: new Date().toISOString() 
    }
];

function handleAssessmentLogin(e) {
    e.preventDefault();
    const username = document.getElementById('assessmentUsername').value;
    const password = document.getElementById('assessmentPassword').value;

    // Find user in ASSESSMENT users pool
    const user = assessmentUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Store user data with permissions
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            type: user.type,
            permissions: user.permissions
        }));

        showToast('Login Penilaian berhasil! Mengalihkan ke Dashboard Penilaian...', 'success');
        
        setTimeout(() => {
            window.location.replace('dashboard-penilaian.html');
        }, 1500);
    } else {
        showToast('Username atau password penilaian salah', 'error');
    }
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Remove any existing show class
    toast.classList.remove('show');
    
    // Set the message and styling
    toast.textContent = message;
    toast.style.backgroundColor = type === 'error' ? '#fee2e2' : '#ecfdf5';
    toast.style.color = type === 'error' ? '#dc2626' : '#059669';
    toast.style.borderColor = type === 'error' ? '#fca5a5' : '#6ee7b7';
    
    // Force a reflow to ensure animation plays
    void toast.offsetWidth;
    
    // Show the toast
    toast.classList.add('show');
    
    // Hide after delay
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
