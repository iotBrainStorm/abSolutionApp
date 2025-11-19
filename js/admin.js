import { db, storage } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    ref, 
    uploadBytesResumable, 
    getDownloadURL,
    deleteObject,
    listAll
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Subject mappings
const subjectsData = {
    'class-9': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
    'class-10': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
    'sem-1': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
    'sem-2': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
    'sem-3': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
    'sem-4': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
    'neet': ['biology', 'chemistry', 'physics'],
    'jee': ['physics', 'chemistry', 'mathematics']
};

// Check admin authentication
function checkAdminAuth() {
    const userSession = sessionStorage.getItem('userSession');
    if (!userSession) {
        window.location.href = '../index.html';
        return null;
    }
    
    const session = JSON.parse(userSession);
    if (session.userType !== 'admin') {
        alert('Access Denied: Admin privileges required');
        window.location.href = './main.html';
        return null;
    }
    
    return session;
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    const session = checkAdminAuth();
    if (!session) return;
    
    document.getElementById('adminName').textContent = `Welcome, ${session.name}`;
    
    // Load initial data
    await loadUsers();
    await loadPDFs();
    await updateStatistics();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize default admin if not exists
    await initializeDefaultAdmin();
});

// Initialize default admin user
async function initializeDefaultAdmin() {
    try {
        const adminDoc = await getDoc(doc(db, 'users', 'ADMIN001'));
        if (!adminDoc.exists()) {
            await setDoc(doc(db, 'users', 'ADMIN001'), {
                userId: 'ADMIN001',
                password: 'admin123',
                name: 'System Administrator',
                userType: 'admin',
                allowedClasses: ['class-9', 'class-10', 'sem-1', 'sem-2', 'sem-3', 'sem-4', 'neet', 'jee'],
                allowedSubjects: {
                    'class-9': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
                    'class-10': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
                    'sem-1': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
                    'sem-2': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
                    'sem-3': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
                    'sem-4': ['mathematics', 'physics', 'chemistry', 'biology', 'english', 'bengali', 'geography', 'history', 'others'],
                    'neet': ['biology', 'chemistry', 'physics'],
                    'jee': ['physics', 'chemistry', 'mathematics']
                },
                createdAt: new Date().toISOString()
            });
            console.log('Default admin created: ADMIN001 / admin123');
        }
    } catch (error) {
        console.error('Error initializing admin:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add user form
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    
    // PDF upload form
    document.getElementById('uploadPdfForm').addEventListener('submit', handleUploadPDF);
    
    // Class selection for subjects
    document.querySelectorAll('#classesCheckbox input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSubjectOptions);
    });
    
    // Upload class selection
    document.getElementById('uploadClass').addEventListener('change', (e) => {
        const subjectSelect = document.getElementById('uploadSubject');
        subjectSelect.disabled = false;
        subjectSelect.innerHTML = '<option value="">Choose subject...</option>';
        
        const subjects = subjectsData[e.target.value] || [];
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject.charAt(0).toUpperCase() + subject.slice(1);
            subjectSelect.appendChild(option);
        });
    });
    
    // Search users
    document.getElementById('searchUser').addEventListener('input', (e) => {
        filterUsers(e.target.value);
    });
}

// Update subject options based on selected classes
function updateSubjectOptions() {
    const selectedClasses = Array.from(document.querySelectorAll('#classesCheckbox input:checked'))
        .map(cb => cb.value);
    
    const subjectsContainer = document.getElementById('subjectsContainer');
    subjectsContainer.innerHTML = '';
    
    if (selectedClasses.length === 0) {
        subjectsContainer.innerHTML = '<p style="color: #888;">Select at least one class to choose subjects</p>';
        return;
    }
    
    selectedClasses.forEach(classId => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-subjects-group';
        
        const classTitle = document.createElement('h4');
        classTitle.textContent = classId.toUpperCase().replace('-', ' ');
        classDiv.appendChild(classTitle);
        
        const checkboxGrid = document.createElement('div');
        checkboxGrid.className = 'checkbox-grid';
        
        const subjects = subjectsData[classId] || [];
        subjects.forEach(subject => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = subject;
            checkbox.dataset.class = classId;
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + subject.charAt(0).toUpperCase() + subject.slice(1)));
            checkboxGrid.appendChild(label);
        });
        
        classDiv.appendChild(checkboxGrid);
        subjectsContainer.appendChild(classDiv);
    });
}

// Handle add user
async function handleAddUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('newUserId').value.trim();
    const password = document.getElementById('newPassword').value;
    const name = document.getElementById('newName').value.trim();
    const userType = document.getElementById('newUserType').value;
    
    const allowedClasses = Array.from(document.querySelectorAll('#classesCheckbox input:checked'))
        .map(cb => cb.value);
    
    const allowedSubjects = {};
    document.querySelectorAll('#subjectsContainer input:checked').forEach(checkbox => {
        const classId = checkbox.dataset.class;
        if (!allowedSubjects[classId]) {
            allowedSubjects[classId] = [];
        }
        allowedSubjects[classId].push(checkbox.value);
    });
    
    try {
        // Check if user already exists
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            alert('User ID already exists. Please choose a different ID.');
            return;
        }
        
        await setDoc(doc(db, 'users', userId), {
            userId,
            password,
            name,
            userType,
            allowedClasses,
            allowedSubjects,
            createdAt: new Date().toISOString()
        });
        
        alert(`User ${userId} added successfully!`);
        document.getElementById('addUserForm').reset();
        document.getElementById('subjectsContainer').innerHTML = '';
        await loadUsers();
        await updateStatistics();
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user: ' + error.message);
    }
}

// Load users
async function loadUsers() {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';
        
        if (usersSnapshot.empty) {
            usersList.innerHTML = '<p style="text-align: center; color: #888;">No users found</p>';
            return;
        }
        
        usersSnapshot.forEach((doc) => {
            const user = doc.data();
            const userCard = createUserCard(user);
            usersList.appendChild(userCard);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users: ' + error.message);
    }
}

// Create user card
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    card.dataset.userId = user.userId;
    card.dataset.userName = user.name.toLowerCase();
    
    const typeIcon = user.userType === 'admin' ? '👑' : '👤';
    const typeBadge = user.userType === 'admin' ? 'admin-badge' : 'student-badge';
    
    card.innerHTML = `
        <div class="user-info">
            <div class="user-header">
                <h4>${typeIcon} ${user.name}</h4>
                <span class="badge ${typeBadge}">${user.userType}</span>
            </div>
            <p><strong>User ID:</strong> ${user.userId}</p>
            <p><strong>Classes:</strong> ${user.allowedClasses?.join(', ') || 'None'}</p>
            <p><strong>Subjects:</strong> ${formatSubjects(user.allowedSubjects)}</p>
            <p class="user-date"><strong>Created:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="user-actions">
            <button class="btn btn-edit" onclick="editUser('${user.userId}')">✏️ Edit</button>
            <button class="btn btn-danger" onclick="deleteUser('${user.userId}')">🗑️ Delete</button>
        </div>
    `;
    
    return card;
}

// Format subjects for display
function formatSubjects(allowedSubjects) {
    if (!allowedSubjects || Object.keys(allowedSubjects).length === 0) {
        return 'None';
    }
    
    const total = Object.values(allowedSubjects).reduce((sum, subjects) => sum + subjects.length, 0);
    return `${total} subjects across ${Object.keys(allowedSubjects).length} classes`;
}

// Edit user
window.editUser = async function(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            alert('User not found');
            return;
        }
        
        const user = userDoc.data();
        
        // Populate form
        document.getElementById('newUserId').value = user.userId;
        document.getElementById('newUserId').disabled = true;
        document.getElementById('newPassword').value = user.password;
        document.getElementById('newName').value = user.name;
        document.getElementById('newUserType').value = user.userType;
        
        // Check classes
        document.querySelectorAll('#classesCheckbox input').forEach(checkbox => {
            checkbox.checked = user.allowedClasses?.includes(checkbox.value);
        });
        
        updateSubjectOptions();
        
        // Check subjects
        setTimeout(() => {
            document.querySelectorAll('#subjectsContainer input').forEach(checkbox => {
                const classId = checkbox.dataset.class;
                checkbox.checked = user.allowedSubjects?.[classId]?.includes(checkbox.value);
            });
        }, 100);
        
        // Change form submission to update
        const form = document.getElementById('addUserForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            await updateUser(userId);
        };
        
        // Scroll to form
        document.getElementById('users-tab').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error editing user:', error);
        alert('Error loading user data: ' + error.message);
    }
};

// Update user
async function updateUser(userId) {
    const password = document.getElementById('newPassword').value;
    const name = document.getElementById('newName').value.trim();
    const userType = document.getElementById('newUserType').value;
    
    const allowedClasses = Array.from(document.querySelectorAll('#classesCheckbox input:checked'))
        .map(cb => cb.value);
    
    const allowedSubjects = {};
    document.querySelectorAll('#subjectsContainer input:checked').forEach(checkbox => {
        const classId = checkbox.dataset.class;
        if (!allowedSubjects[classId]) {
            allowedSubjects[classId] = [];
        }
        allowedSubjects[classId].push(checkbox.value);
    });
    
    try {
        await updateDoc(doc(db, 'users', userId), {
            password,
            name,
            userType,
            allowedClasses,
            allowedSubjects,
            updatedAt: new Date().toISOString()
        });
        
        alert(`User ${userId} updated successfully!`);
        document.getElementById('addUserForm').reset();
        document.getElementById('newUserId').disabled = false;
        document.getElementById('subjectsContainer').innerHTML = '';
        
        // Reset form submission
        document.getElementById('addUserForm').onsubmit = handleAddUser;
        
        await loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user: ' + error.message);
    }
}

// Delete user
window.deleteUser = async function(userId) {
    if (!confirm(`Are you sure you want to delete user ${userId}?`)) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'users', userId));
        alert('User deleted successfully!');
        await loadUsers();
        await updateStatistics();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
    }
};

// Filter users
function filterUsers(searchTerm) {
    const term = searchTerm.toLowerCase();
    const userCards = document.querySelectorAll('.user-card');
    
    userCards.forEach(card => {
        const userId = card.dataset.userId.toLowerCase();
        const userName = card.dataset.userName;
        
        if (userId.includes(term) || userName.includes(term)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Handle PDF upload
async function handleUploadPDF(e) {
    e.preventDefault();
    
    const classId = document.getElementById('uploadClass').value;
    const subjectId = document.getElementById('uploadSubject').value;
    const typeId = document.getElementById('uploadType').value;
    const chapterIndex = document.getElementById('uploadChapter').value;
    const displayName = document.getElementById('pdfDisplayName').value.trim();
    const icon = document.getElementById('pdfIcon').value;
    const file = document.getElementById('pdfFile').files[0];
    
    if (!file) {
        alert('Please select a PDF file');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
    }
    
    if (!file.type.includes('pdf')) {
        alert('Only PDF files are allowed');
        return;
    }
    
    try {
        // Show progress
        document.getElementById('uploadProgress').style.display = 'block';
        document.getElementById('uploadStatus').textContent = 'Uploading...';
        
        // Create storage reference
        const storagePath = `pdfs/${classId}/${subjectId}/${typeId}/chapter-${parseInt(chapterIndex) + 1}/${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                document.getElementById('progressFill').style.width = progress + '%';
                document.getElementById('uploadStatus').textContent = `Uploading... ${Math.round(progress)}%`;
            },
            (error) => {
                console.error('Upload error:', error);
                alert('Error uploading file: ' + error.message);
                document.getElementById('uploadProgress').style.display = 'none';
            },
            async () => {
                // Get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                // Save metadata to Firestore
                const pdfData = {
                    classId,
                    subjectId,
                    typeId,
                    chapterIndex: parseInt(chapterIndex),
                    displayName,
                    icon,
                    fileName: file.name,
                    filePath: storagePath,
                    downloadURL,
                    fileSize: file.size,
                    uploadedAt: new Date().toISOString()
                };
                
                await addDoc(collection(db, 'pdfs'), pdfData);
                
                document.getElementById('uploadStatus').textContent = 'Upload complete! ✅';
                setTimeout(() => {
                    document.getElementById('uploadProgress').style.display = 'none';
                    document.getElementById('progressFill').style.width = '0%';
                }, 2000);
                
                alert('PDF uploaded successfully!');
                document.getElementById('uploadPdfForm').reset();
                document.getElementById('uploadSubject').disabled = true;
                await loadPDFs();
                await updateStatistics();
            }
        );
    } catch (error) {
        console.error('Error uploading PDF:', error);
        alert('Error uploading PDF: ' + error.message);
        document.getElementById('uploadProgress').style.display = 'none';
    }
}

// Load PDFs
async function loadPDFs() {
    try {
        const pdfsSnapshot = await getDocs(collection(db, 'pdfs'));
        const pdfsList = document.getElementById('pdfsList');
        pdfsList.innerHTML = '';
        
        if (pdfsSnapshot.empty) {
            pdfsList.innerHTML = '<p style="text-align: center; color: #888;">No PDFs uploaded yet</p>';
            return;
        }
        
        pdfsSnapshot.forEach((doc) => {
            const pdf = doc.data();
            const pdfCard = createPDFCard(doc.id, pdf);
            pdfsList.appendChild(pdfCard);
        });
    } catch (error) {
        console.error('Error loading PDFs:', error);
        alert('Error loading PDFs: ' + error.message);
    }
}

// Create PDF card
function createPDFCard(docId, pdf) {
    const card = document.createElement('div');
    card.className = 'pdf-card';
    
    const fileSize = (pdf.fileSize / 1024 / 1024).toFixed(2);
    
    card.innerHTML = `
        <div class="pdf-info">
            <h4>${pdf.icon} ${pdf.displayName}</h4>
            <p><strong>Class:</strong> ${pdf.classId} | <strong>Subject:</strong> ${pdf.subjectId}</p>
            <p><strong>Type:</strong> ${pdf.typeId} | <strong>Chapter:</strong> ${pdf.chapterIndex + 1}</p>
            <p><strong>File:</strong> ${pdf.fileName} (${fileSize} MB)</p>
            <p class="pdf-date"><strong>Uploaded:</strong> ${new Date(pdf.uploadedAt).toLocaleDateString()}</p>
        </div>
        <div class="pdf-actions">
            <a href="${pdf.downloadURL}" target="_blank" class="btn btn-primary">👁️ View</a>
            <button class="btn btn-danger" onclick="deletePDF('${docId}', '${pdf.filePath}')">🗑️ Delete</button>
        </div>
    `;
    
    return card;
}

// Delete PDF
window.deletePDF = async function(docId, filePath) {
    if (!confirm('Are you sure you want to delete this PDF?')) {
        return;
    }
    
    try {
        // Delete from storage
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
        
        // Delete from Firestore
        await deleteDoc(doc(db, 'pdfs', docId));
        
        alert('PDF deleted successfully!');
        await loadPDFs();
        await updateStatistics();
    } catch (error) {
        console.error('Error deleting PDF:', error);
        alert('Error deleting PDF: ' + error.message);
    }
};

// Update statistics
async function updateStatistics() {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const pdfsSnapshot = await getDocs(collection(db, 'pdfs'));
        
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        document.getElementById('totalPdfs').textContent = pdfsSnapshot.size;
        
        let totalSize = 0;
        pdfsSnapshot.forEach(doc => {
            totalSize += doc.data().fileSize || 0;
        });
        document.getElementById('storageUsed').textContent = (totalSize / 1024 / 1024).toFixed(2) + ' MB';
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

// Tab switching
window.showTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
};

// Export users
window.exportUsers = async function() {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        
        usersSnapshot.forEach(doc => {
            users.push(doc.data());
        });
        
        const dataStr = JSON.stringify(users, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        alert('Users exported successfully!');
    } catch (error) {
        console.error('Error exporting users:', error);
        alert('Error exporting users: ' + error.message);
    }
};

// Backup data
window.backupData = async function() {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const pdfsSnapshot = await getDocs(collection(db, 'pdfs'));
        
        const users = [];
        const pdfs = [];
        
        usersSnapshot.forEach(doc => users.push(doc.data()));
        pdfsSnapshot.forEach(doc => pdfs.push(doc.data()));
        
        const backup = { users, pdfs, timestamp: new Date().toISOString() };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        alert('Backup created successfully!');
    } catch (error) {
        console.error('Error creating backup:', error);
        alert('Error creating backup: ' + error.message);
    }
};

// Clear cache
window.clearCache = function() {
    if (confirm('This will clear browser cache. Continue?')) {
        sessionStorage.clear();
        alert('Cache cleared! Please refresh the page.');
    }
};

// Logout
window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../index.html';
    }
};
