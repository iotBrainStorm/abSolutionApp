// ========================================
// Configuration Management - Load from JSON Files
// ========================================
let usersConfig = null;
let pdfFilesConfig = {};

// Load users configuration
async function loadUsersConfig() {
    try {
        const response = await fetch('/src/data/users.json');
        if (response.ok) {
            usersConfig = await response.json();
            console.log('✅ Users configuration loaded from JSON');
            return true;
        }
    } catch (error) {
        console.log('⚠️ Could not load users.json, using hardcoded credentials');
    }
    return false;
}

// ========================================
// Student Credentials Database (Fallback)
// These are used if users.json is not found
// ========================================
const studentCredentials = [
    { 
        userId: 'STU001', 
        password: 'password123', 
        name: 'John Doe',
        userType: 'student',
        allowedClasses: ['class-9', 'class-10'], // Can access only Class 9 and 10
        allowedSubjects: {
            'class-9': ['mathematics', 'physics', 'english'],
            'class-10': ['mathematics', 'chemistry', 'biology']
        }
    },
    { 
        userId: 'STU002', 
        password: 'secure456', 
        name: 'Jane Smith',
        userType: 'student',
        allowedClasses: ['sem-1', 'sem-2'], // Can access only SEM I and II
        allowedSubjects: {
            'sem-1': ['physics', 'chemistry', 'mathematics'],
            'sem-2': ['physics', 'chemistry', 'english']
        }
    },
    { 
        userId: 'STU003', 
        password: 'student789', 
        name: 'Mike Johnson',
        userType: 'student',
        allowedClasses: ['neet'], // Can access only NEET
        allowedSubjects: {
            'neet': ['biology', 'chemistry', 'physics']
        }
    },
    { 
        userId: 'STU004', 
        password: 'notes2024', 
        name: 'Sarah Williams',
        userType: 'student',
        allowedClasses: ['jee'], // Can access only JEE
        allowedSubjects: {
            'jee': ['physics', 'chemistry', 'mathematics']
        }
    },
    { 
        userId: 'STU005', 
        password: 'test123', 
        name: 'David Brown',
        userType: 'student',
        allowedClasses: ['class-9', 'class-10', 'sem-1', 'sem-2', 'sem-3', 'sem-4', 'neet', 'jee'], // Can access ALL classes (Admin/Teacher)
        allowedSubjects: 'all' // Special value for full access
    },
    {
        userId: 'ADMIN001',
        password: 'admin123',
        name: 'System Administrator',
        userType: 'admin',
        allowedClasses: ['class-9', 'class-10', 'sem-1', 'sem-2', 'sem-3', 'sem-4', 'neet', 'jee'],
        allowedSubjects: 'all'
    }
];

// ========================================
// Authentication Functions
// ========================================
// ========================================
// Authentication Functions with JSON Configuration
// ========================================
async function validateCredentials(userId, password) {
    // Load users config if not already loaded
    if (!usersConfig) {
        await loadUsersConfig();
    }
    
    // Try JSON config first
    if (usersConfig && Array.isArray(usersConfig)) {
        const user = usersConfig.find(u => u.userId === userId && u.password === password);
        if (user) {
            console.log('✅ User authenticated from users.json');
            return user;
        }
    }
    
    // Fallback to hardcoded credentials
    const student = studentCredentials.find(
        student => student.userId === userId && student.password === password
    );
    
    if (student) {
        console.log('✅ User authenticated from fallback credentials');
    }
    
    return student || null;
}

function setAuthSession(student) {
    const sessionData = {
        userId: student.userId,
        name: student.name,
        userType: student.userType || 'student',
        allowedClasses: student.allowedClasses,
        allowedSubjects: student.allowedSubjects,
        loginTime: new Date().toISOString()
    };
    sessionStorage.setItem('studentAuth', JSON.stringify(sessionData));
    sessionStorage.setItem('userSession', JSON.stringify(sessionData)); // For admin panel compatibility
}

function getAuthSession() {
    const sessionData = sessionStorage.getItem('studentAuth');
    return sessionData ? JSON.parse(sessionData) : null;
}

function clearAuthSession() {
    sessionStorage.removeItem('studentAuth');
}

function isAuthenticated() {
    return getAuthSession() !== null;
}

// ========================================
// Page Protection - Check Auth on Load
// ========================================
function checkAuthentication() {
    const currentPage = window.location.pathname;
    const isMainPage = currentPage.includes('main.html');
    const isLoginPage = currentPage.includes('index.html') || currentPage.endsWith('/');

    if (isMainPage && !isAuthenticated()) {
        // Redirect to login if trying to access main page without auth
        window.location.href = 'index.html';
    } else if (isLoginPage && isAuthenticated()) {
        // Redirect to main page if already logged in
        window.location.href = 'pages/main.html';
    }
}

// ========================================
// Login Form Handler
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status on page load
    checkAuthentication();

    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        // Toggle password visibility
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Optional: Change icon based on state
                const eyeIcon = this.querySelector('.eye-icon');
                if (type === 'text') {
                    eyeIcon.style.color = 'var(--primary-color)';
                } else {
                    eyeIcon.style.color = 'var(--text-secondary)';
                }
            });
        }

        // Handle form submission
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value.trim();
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            // Clear previous error
            errorMessage.classList.remove('show');
            errorMessage.textContent = '';
            
            // Show loading state
            const loginBtn = document.querySelector('.login-btn');
            const originalContent = loginBtn.innerHTML;
            loginBtn.innerHTML = '<span>Authenticating...</span>';
            loginBtn.disabled = true;
            
            // Validate credentials (Firebase first, then fallback)
            const student = await validateCredentials(userId, password);
            
            if (student) {
                // Success - Set session and redirect
                setAuthSession(student);
                
                // Add success feedback
                loginBtn.innerHTML = '<span>Success! Redirecting...</span>';
                loginBtn.style.background = 'var(--success-color)';
                
                // Redirect based on user type
                setTimeout(() => {
                    if (student.userType === 'admin') {
                        window.location.href = 'pages/admin.html';
                    } else {
                        window.location.href = 'pages/main.html';
                    }
                }, 1000);
            } else {
                // Failed login
                loginBtn.innerHTML = originalContent;
                loginBtn.disabled = false;
                errorMessage.textContent = 'Invalid User ID or Password. Please try again.';
                errorMessage.classList.add('show');
                
                // Shake animation for inputs
                const inputs = document.querySelectorAll('.input-wrapper');
                inputs.forEach(input => {
                    input.style.animation = 'shake 0.4s ease';
                    setTimeout(() => {
                        input.style.animation = '';
                    }, 400);
                });
            }
        });
    }
});

// Switch to admin login (visual indication)
window.switchToAdmin = function() {
    document.getElementById('userId').placeholder = 'Enter admin ID (e.g., ADMIN001)';
    document.getElementById('userId').focus();
    document.querySelector('.login-header h1').textContent = 'Admin Login';
    document.querySelector('.login-header .subtitle').textContent = 'Access Administrative Panel';
};

// ========================================
// Navigation State Management
// ========================================
let navigationState = {
    currentClass: null,
    currentSubject: null,
    currentType: null,
    currentChapter: null,
    breadcrumb: []
};

// ========================================
// Subjects Data Structure
// ========================================
const subjectsData = {
    'class-9': [
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#667eea' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#f093fb' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#4facfe' },
        { id: 'biology', name: 'Biology', icon: '🧬', color: '#fa709a' },
        { id: 'english', name: 'English', icon: '📖', color: '#43e97b' },
        { id: 'bengali', name: 'Bengali', icon: '📚', color: '#38f9d7' },
        { id: 'geography', name: 'Geography', icon: '🌍', color: '#f6d365' },
        { id: 'history', name: 'History', icon: '📜', color: '#fda085' },
        { id: 'others', name: 'Others', icon: '📋', color: '#a8edea' }
    ],
    'class-10': [
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#667eea' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#f093fb' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#4facfe' },
        { id: 'biology', name: 'Biology', icon: '🧬', color: '#fa709a' },
        { id: 'english', name: 'English', icon: '📖', color: '#43e97b' },
        { id: 'bengali', name: 'Bengali', icon: '📚', color: '#38f9d7' },
        { id: 'geography', name: 'Geography', icon: '🌍', color: '#f6d365' },
        { id: 'history', name: 'History', icon: '📜', color: '#fda085' },
        { id: 'others', name: 'Others', icon: '📋', color: '#a8edea' }
    ],
    'sem-1': [
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#667eea' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#f093fb' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#4facfe' },
        { id: 'biology', name: 'Biology', icon: '🧬', color: '#fa709a' },
        { id: 'english', name: 'English', icon: '📖', color: '#43e97b' },
        { id: 'bengali', name: 'Bengali', icon: '📚', color: '#38f9d7' },
        { id: 'geography', name: 'Geography', icon: '🌍', color: '#f6d365' },
        { id: 'history', name: 'History', icon: '📜', color: '#fda085' },
        { id: 'others', name: 'Others', icon: '📋', color: '#a8edea' }
    ],
    'sem-2': [
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#667eea' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#f093fb' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#4facfe' },
        { id: 'biology', name: 'Biology', icon: '🧬', color: '#fa709a' },
        { id: 'english', name: 'English', icon: '📖', color: '#43e97b' },
        { id: 'bengali', name: 'Bengali', icon: '📚', color: '#38f9d7' },
        { id: 'geography', name: 'Geography', icon: '🌍', color: '#f6d365' },
        { id: 'history', name: 'History', icon: '📜', color: '#fda085' },
        { id: 'others', name: 'Others', icon: '📋', color: '#a8edea' }
    ],
    'sem-3': [
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#667eea' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#f093fb' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#4facfe' },
        { id: 'biology', name: 'Biology', icon: '🧬', color: '#fa709a' },
        { id: 'english', name: 'English', icon: '📖', color: '#43e97b' },
        { id: 'bengali', name: 'Bengali', icon: '📚', color: '#38f9d7' },
        { id: 'geography', name: 'Geography', icon: '🌍', color: '#f6d365' },
        { id: 'history', name: 'History', icon: '📜', color: '#fda085' },
        { id: 'others', name: 'Others', icon: '📋', color: '#a8edea' }
    ],
    'sem-4': [
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#667eea' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#f093fb' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#4facfe' },
        { id: 'biology', name: 'Biology', icon: '🧬', color: '#fa709a' },
        { id: 'english', name: 'English', icon: '📖', color: '#43e97b' },
        { id: 'bengali', name: 'Bengali', icon: '📚', color: '#38f9d7' },
        { id: 'geography', name: 'Geography', icon: '🌍', color: '#f6d365' },
        { id: 'history', name: 'History', icon: '📜', color: '#fda085' },
        { id: 'others', name: 'Others', icon: '📋', color: '#a8edea' }
    ],
    'neet': [
        { id: 'biology', name: 'Biology', icon: '🧬', color: '#667eea' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#f093fb' },
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#4facfe' }
    ],
    'jee': [
        { id: 'physics', name: 'Physics', icon: '⚛️', color: '#667eea' },
        { id: 'chemistry', name: 'Chemistry', icon: '🧪', color: '#f093fb' },
        { id: 'mathematics', name: 'Mathematics', icon: '🔢', color: '#4facfe' }
    ]
};

// ========================================
// Data Structure - Classes, Types & Chapters
// ========================================
const classesData = {
    'class-9': {
        name: 'Class IX',
        icon: '📘',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        chapters: [
            'Chapter 1: Number Systems',
            'Chapter 2: Polynomials',
            'Chapter 3: Coordinate Geometry',
            'Chapter 4: Linear Equations',
            'Chapter 5: Euclid\'s Geometry',
            'Chapter 6: Lines and Angles',
            'Chapter 7: Triangles',
            'Chapter 8: Quadrilaterals'
        ]
    },
    'class-10': {
        name: 'Class X',
        icon: '📗',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        chapters: [
            'Chapter 1: Real Numbers',
            'Chapter 2: Polynomials',
            'Chapter 3: Linear Equations',
            'Chapter 4: Quadratic Equations',
            'Chapter 5: Arithmetic Progressions',
            'Chapter 6: Triangles',
            'Chapter 7: Coordinate Geometry',
            'Chapter 8: Trigonometry'
        ]
    },
    'sem-1': {
        name: 'SEM I',
        icon: '📙',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        chapters: [
            'Chapter 1: Differential Calculus',
            'Chapter 2: Integral Calculus',
            'Chapter 3: Vector Calculus',
            'Chapter 4: Complex Numbers',
            'Chapter 5: Matrices',
            'Chapter 6: Differential Equations',
            'Chapter 7: Linear Algebra',
            'Chapter 8: Probability Theory'
        ]
    },
    'sem-2': {
        name: 'SEM II',
        icon: '📕',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        chapters: [
            'Chapter 1: Advanced Calculus',
            'Chapter 2: Real Analysis',
            'Chapter 3: Complex Analysis',
            'Chapter 4: Numerical Methods',
            'Chapter 5: Operations Research',
            'Chapter 6: Discrete Mathematics',
            'Chapter 7: Graph Theory',
            'Chapter 8: Statistical Methods'
        ]
    },
    'sem-3': {
        name: 'SEM III',
        icon: '📔',
        color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        chapters: [
            'Chapter 1: Mechanics',
            'Chapter 2: Thermodynamics',
            'Chapter 3: Electromagnetism',
            'Chapter 4: Optics',
            'Chapter 5: Modern Physics',
            'Chapter 6: Quantum Mechanics',
            'Chapter 7: Solid State Physics',
            'Chapter 8: Nuclear Physics'
        ]
    },
    'sem-4': {
        name: 'SEM IV',
        icon: '📓',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        chapters: [
            'Chapter 1: Organic Chemistry',
            'Chapter 2: Inorganic Chemistry',
            'Chapter 3: Physical Chemistry',
            'Chapter 4: Analytical Chemistry',
            'Chapter 5: Biochemistry',
            'Chapter 6: Environmental Chemistry',
            'Chapter 7: Industrial Chemistry',
            'Chapter 8: Polymer Chemistry'
        ]
    },
    'neet': {
        name: 'NEET',
        icon: '🏥',
        color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        chapters: [
            'Chapter 1: Human Physiology',
            'Chapter 2: Cell Biology',
            'Chapter 3: Genetics',
            'Chapter 4: Ecology',
            'Chapter 5: Plant Physiology',
            'Chapter 6: Biotechnology',
            'Chapter 7: Evolution',
            'Chapter 8: Reproduction'
        ]
    },
    'jee': {
        name: 'JEE',
        icon: '🎓',
        color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        chapters: [
            'Chapter 1: Mechanics',
            'Chapter 2: Electrostatics',
            'Chapter 3: Magnetism',
            'Chapter 4: Thermodynamics',
            'Chapter 5: Modern Physics',
            'Chapter 6: Waves & Optics',
            'Chapter 7: Electromagnetic Induction',
            'Chapter 8: Semiconductors'
        ]
    }
};

const testTypes = [
    { id: 'mock-test', name: 'MOCK TEST', icon: '📝', color: '#6366f1' },
    { id: 'assignments', name: 'ASSIGNMENTS', icon: '📄', color: '#8b5cf6' }
];

// ========================================
// PDF Files Configuration (Loaded from JSON)
// ========================================
// pdfFilesConfig is already declared at top of file

// Load PDF configuration from external JSON file
async function loadPDFConfig() {
    try {
        const configPath = '/public/pdfs/pdf-config.json';
        console.log('📂 Loading PDF config from:', configPath);
        
        const response = await fetch(configPath);
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📄 Raw config data:', data);
            
            // Remove comment fields from config
            delete data._comment;
            delete data._instructions;
            pdfFilesConfig = data;
            
            console.log('✅ PDF configuration loaded successfully');
            console.log('📊 Available classes:', Object.keys(pdfFilesConfig));
            return true;
        } else {
            console.error('❌ Could not load PDF config. Status:', response.status);
            console.error('❌ Response:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('❌ Error loading PDF config:', error);
        return false;
    }
}

// ========================================
// Get PDF Files for a Chapter
// ========================================
async function getPDFFiles(classId, subjectId, typeId, chapterIndex) {
    // Convert chapterIndex to string since JSON keys are strings
    const chapterKey = String(chapterIndex);
    
    console.log('🔍 Looking for PDFs:', { classId, subjectId, typeId, chapterKey });
    
    // Load from JSON configuration
    if (pdfFilesConfig[classId] && 
        pdfFilesConfig[classId][subjectId] &&
        pdfFilesConfig[classId][subjectId][typeId] && 
        pdfFilesConfig[classId][subjectId][typeId][chapterKey]) {
        const pdfs = pdfFilesConfig[classId][subjectId][typeId][chapterKey];
        
        console.log('✅ Found PDFs from JSON config:', pdfs);
        
        // Auto-detect icon if not provided
        return pdfs.map(pdf => ({
            ...pdf,
            icon: pdf.icon || getIconForPDF(pdf.file)
        }));
    }
    
    console.log('⚠️ No PDFs found for this chapter');
    return [];
}

// ========================================
// Helper function to automatically detect PDF icon
// ========================================
function getIconForPDF(filename) {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('note')) return '📘';
    if (lowerName.includes('test') || lowerName.includes('exam')) return '📝';
    if (lowerName.includes('solution') || lowerName.includes('answer')) return '✅';
    if (lowerName.includes('practice') || lowerName.includes('exercise')) return '📋';
    if (lowerName.includes('summary')) return '📄';
    if (lowerName.includes('guide')) return '📚';
    return '📄'; // Default icon
}

// ========================================
// Main Page Functions
// ========================================
export async function loadMainPage() {
    const session = getAuthSession();
    
    if (!session) {
        window.location.href = '../index.html';
        return;
    }
    
    // Load PDF configuration first (from Firebase or fallback to JSON)
    await loadPDFConfig();
    
    // Update welcome message
    const welcomeText = document.querySelector('.welcome-text h2');
    if (welcomeText) {
        welcomeText.textContent = `Welcome back, ${session.name}!`;
    }
    
    // Load classes view by default
    loadClassesView();
}

// ========================================
// View Loading Functions
// ========================================
function loadClassesView() {
    navigationState = { currentClass: null, currentSubject: null, currentType: null, currentChapter: null, breadcrumb: ['Home'] };
    updateBreadcrumb();
    
    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');
    
    sectionHeader.innerHTML = `
        <h3>📚 Select Your Class</h3>
        <p class="section-description">Choose a class to access study materials</p>
    `;
    
    // Show ALL classes to everyone
    const classesHTML = Object.keys(classesData).map(classId => {
        const classInfo = classesData[classId];
        return `
            <div class="class-card" onclick="selectClass('${classId}')" style="--card-gradient: ${classInfo.color}">
                <div class="card-icon">${classInfo.icon}</div>
                <h4 class="card-title">${classInfo.name}</h4>
                <div class="card-arrow">→</div>
            </div>
        `;
    }).join('');
    
    cardsGrid.innerHTML = classesHTML;
}

function selectClass(classId) {
    navigationState.currentClass = classId;
    navigationState.breadcrumb = ['Home', classesData[classId].name];
    updateBreadcrumb();
    loadSubjectsView(classId);
}

function loadSubjectsView(classId) {
    const classInfo = classesData[classId];
    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');
    
    sectionHeader.innerHTML = `
        <h3>${classInfo.icon} ${classInfo.name}</h3>
        <p class="section-description">Choose your subject</p>
    `;
    
    const allSubjects = subjectsData[classId] || [];
    
    // Filter subjects based on user permissions
    const session = getAuthSession();
    const allowedSubjects = session.allowedSubjects;
    
    let subjects = allSubjects;
    if (allowedSubjects !== 'all' && allowedSubjects && allowedSubjects[classId]) {
        // Filter to show only allowed subjects
        const allowedSubjectIds = allowedSubjects[classId];
        subjects = allSubjects.filter(subject => allowedSubjectIds.includes(subject.id));
    }
    
    if (subjects.length === 0) {
        cardsGrid.innerHTML = `
            <p class="no-content">
                No subjects available for your account in this class.<br>
                Please contact your administrator for access.
            </p>
        `;
        return;
    }
    
    const subjectsHTML = subjects.map(subject => `
        <div class="subject-card" onclick="selectSubject('${classId}', '${subject.id}')" style="--card-color: ${subject.color}">
            <div class="card-icon">${subject.icon}</div>
            <h4 class="card-title">${subject.name}</h4>
            <div class="card-arrow">→</div>
        </div>
    `).join('');
    
    cardsGrid.innerHTML = subjectsHTML;
}

function selectSubject(classId, subjectId) {
    // Verify user has permission to access this subject
    const session = getAuthSession();
    const allowedSubjects = session.allowedSubjects;
    
    if (allowedSubjects !== 'all') {
        if (!allowedSubjects || !allowedSubjects[classId] || !allowedSubjects[classId].includes(subjectId)) {
            alert('🚫 You are not permitted to access this subject!\n\nThis content is not available for your account.');
            console.error('Access denied for subject:', subjectId, 'in class:', classId);
            return;
        }
    }
    
    const subject = subjectsData[classId].find(s => s.id === subjectId);
    navigationState.currentSubject = subjectId;
    navigationState.breadcrumb = ['Home', classesData[classId].name, subject.name];
    updateBreadcrumb();
    loadTestTypesView(classId, subjectId);
}

function loadTestTypesView(classId, subjectId) {
    const classInfo = classesData[classId];
    const subject = subjectsData[classId].find(s => s.id === subjectId);
    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');
    
    sectionHeader.innerHTML = `
        <h3>${subject.icon} ${subject.name}</h3>
        <p class="section-description">Select test type to view chapters</p>
    `;
    
    const typesHTML = testTypes.map(type => `
        <div class="test-type-card" onclick="selectTestType('${classId}', '${subjectId}', '${type.id}')" style="--card-color: ${type.color}">
            <div class="card-icon">${type.icon}</div>
            <h4 class="card-title">${type.name}</h4>
            <div class="card-arrow">→</div>
        </div>
    `).join('');
    
    cardsGrid.innerHTML = typesHTML;
}

function selectTestType(classId, subjectId, typeId) {
    const subject = subjectsData[classId].find(s => s.id === subjectId);
    const typeName = testTypes.find(t => t.id === typeId).name;
    navigationState.currentType = typeId;
    navigationState.breadcrumb = ['Home', classesData[classId].name, subject.name, typeName];
    updateBreadcrumb();
    loadChaptersView(classId, subjectId, typeId);
}

function loadChaptersView(classId, subjectId, typeId) {
    const classInfo = classesData[classId];
    const subject = subjectsData[classId].find(s => s.id === subjectId);
    const typeName = testTypes.find(t => t.id === typeId).name;
    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');
    
    sectionHeader.innerHTML = `
        <h3>📑 ${subject.name} - ${typeName}</h3>
        <p class="section-description">Select a chapter to view PDF files</p>
    `;
    
    const chaptersHTML = classInfo.chapters.map((chapter, index) => `
        <div class="chapter-card" onclick="selectChapter('${classId}', '${subjectId}', '${typeId}', ${index})">
            <div class="chapter-number">${index + 1}</div>
            <div class="chapter-info">
                <h4 class="card-title">${chapter}</h4>
                <p class="chapter-meta">Click to view materials</p>
            </div>
            <div class="card-arrow">→</div>
        </div>
    `).join('');
    
    cardsGrid.innerHTML = chaptersHTML;
}

function selectChapter(classId, subjectId, typeId, chapterIndex) {
    const classInfo = classesData[classId];
    const subject = subjectsData[classId].find(s => s.id === subjectId);
    const typeName = testTypes.find(t => t.id === typeId).name;
    const chapterName = classInfo.chapters[chapterIndex];
    
    navigationState.currentChapter = chapterIndex;
    navigationState.breadcrumb = ['Home', classInfo.name, subject.name, typeName, chapterName];
    updateBreadcrumb();
    loadPDFsView(classId, subjectId, typeId, chapterIndex);
}

async function loadPDFsView(classId, subjectId, typeId, chapterIndex) {
    const classInfo = classesData[classId];
    const subject = subjectsData[classId].find(s => s.id === subjectId);
    const typeName = testTypes.find(t => t.id === typeId).name;
    const chapterName = classInfo.chapters[chapterIndex];
    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');
    
    sectionHeader.innerHTML = `
        <h3>📄 ${chapterName}</h3>
        <p class="section-description">View or download PDF materials</p>
    `;
    
    // Generate PDF path - now includes subject folder
    const pdfPath = `/public/pdfs/${classId}/${subjectId}/${typeId}/chapter-${chapterIndex + 1}`;
    
    // Get PDF files from Firebase or configuration
    const pdfFiles = await getPDFFiles(classId, subjectId, typeId, chapterIndex);
    
    if (pdfFiles.length === 0) {
        cardsGrid.innerHTML = `
            <p class="no-content">
                No PDFs available yet.<br>
                Please upload PDFs using the Admin Panel.<br><br>
                <small>For manual upload: Add files to <strong>/public/pdfs/${classId}/${subjectId}/${typeId}/chapter-${chapterIndex + 1}</strong></small>
            </p>
        `;
        return;
    }
    
    const pdfsHTML = pdfFiles.map(pdf => `
        <div class="pdf-card">
            <div class="pdf-icon">${pdf.icon}</div>
            <div class="pdf-info">
                <h4 class="card-title">${pdf.name}</h4>
                <p class="pdf-meta">${classInfo.name} • ${subject.name} • ${typeName}</p>
            </div>
            <div class="pdf-actions">
                <button class="btn btn-view" onclick="viewPDF('${classId}', '${pdfPath}/${pdf.file}', '${pdf.name}')">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    View
                </button>
                <button class="btn btn-download" onclick="downloadPDF('${classId}', '${pdfPath}/${pdf.file}', '${classInfo.name}-${subject.name}-${typeName}-${pdf.name}')">
                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Download
                </button>
            </div>
        </div>
    `).join('');
    
    cardsGrid.innerHTML = pdfsHTML;
}

// ========================================
// Breadcrumb Navigation
// ========================================
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    
    if (navigationState.breadcrumb.length <= 1) {
        breadcrumb.style.display = 'none';
        return;
    }
    
    breadcrumb.style.display = 'flex';
    
    const breadcrumbHTML = navigationState.breadcrumb.map((item, index) => {
        if (index === navigationState.breadcrumb.length - 1) {
            return `<span class="breadcrumb-item active">${item}</span>`;
        }
        
        let onclick = '';
        if (index === 0) {
            onclick = 'loadClassesView()';
        } else if (index === 1) {
            onclick = `selectClass('${navigationState.currentClass}')`;
        } else if (index === 2) {
            onclick = `selectSubject('${navigationState.currentClass}', '${navigationState.currentSubject}')`;
        } else if (index === 3) {
            onclick = `selectTestType('${navigationState.currentClass}', '${navigationState.currentSubject}', '${navigationState.currentType}')`;
        }
        
        return `
            <span class="breadcrumb-item" onclick="${onclick}">${item}</span>
            <span class="breadcrumb-separator">›</span>
        `;
    }).join('');
    
    breadcrumb.innerHTML = breadcrumbHTML;
}

function viewPDF(classId, pdfUrl, pdfName) {
    // Verify user still has valid session
    if (!isAuthenticated()) {
        alert('⚠️ Session expired. Please login again.');
        window.location.href = '../index.html';
        return;
    }
    
    // Check if user has permission to access this class
    const session = getAuthSession();
    const allowedClasses = session.allowedClasses || [];
    const allowedSubjects = session.allowedSubjects;
    const currentSubject = navigationState.currentSubject;
    
    if (!allowedClasses.includes(classId)) {
        alert('🚫 You are not permitted to view this PDF!\n\nThis content is not available for your account.');
        console.error('Access denied for PDF:', pdfName, 'in class:', classId);
        return;
    }
    
    // Check subject permission
    if (allowedSubjects !== 'all') {
        if (!allowedSubjects || !allowedSubjects[classId] || !allowedSubjects[classId].includes(currentSubject)) {
            alert('🚫 You are not permitted to view this subject!\n\nThis content is not available for your account.');
            console.error('Access denied for subject:', currentSubject, 'in class:', classId);
            return;
        }
    }
    
    // Open PDF in new tab
    window.open(pdfUrl, '_blank');
}

function downloadPDF(classId, pdfUrl, title) {
    // Verify user still has valid session
    if (!isAuthenticated()) {
        alert('⚠️ Session expired. Please login again.');
        window.location.href = '../index.html';
        return;
    }
    
    // Check if user has permission to access this class
    const session = getAuthSession();
    const allowedClasses = session.allowedClasses || [];
    const allowedSubjects = session.allowedSubjects;
    const currentSubject = navigationState.currentSubject;
    
    if (!allowedClasses.includes(classId)) {
        alert('🚫 You are not permitted to download this PDF!\n\nThis content is not available for your account.');
        console.error('Access denied for PDF download:', title, 'in class:', classId);
        return;
    }
    
    // Check subject permission
    if (allowedSubjects !== 'all') {
        if (!allowedSubjects || !allowedSubjects[classId] || !allowedSubjects[classId].includes(currentSubject)) {
            alert('🚫 You are not permitted to download from this subject!\n\nThis content is not available for your account.');
            console.error('Access denied for subject:', currentSubject, 'in class:', classId);
            return;
        }
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearAuthSession();
        window.location.href = '../index.html';
    }
}

// Make logout available globally
window.logout = logout;

// ========================================
// Utility Functions
// ========================================
function showAllCredentials() {
    console.table(studentCredentials);
    console.log('='.repeat(50));
    console.log('Demo Credentials for Testing:');
    console.log('='.repeat(50));
    studentCredentials.forEach(student => {
        console.log(`User ID: ${student.userId} | Password: ${student.password} | Name: ${student.name}`);
    });
    console.log('='.repeat(50));
}

// Show credentials in console for easy testing
showAllCredentials();

// ========================================
// Export functions to window for HTML onclick handlers
// ========================================
window.loadClassesView = loadClassesView;
window.selectClass = selectClass;
window.selectSubject = selectSubject;
window.selectTestType = selectTestType;
window.selectChapter = selectChapter;
window.viewPDF = viewPDF;
window.downloadPDF = downloadPDF;
