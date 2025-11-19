// ========================================
// Firebase Integration - Main Application
// ========================================

import { auth, database } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

let currentUser = null;
let selectedCoaching = null;
let pdfDatabase = null;
let chaptersDatabase = null;
let isNavigatingBack = false; // Flag to prevent pushing state when using back button

// Navigation state
const navigationState = {
    currentClass: null,
    currentSubject: null,
    currentType: null,
    currentChapter: null,
    breadcrumb: ['Home']
};

// Class data
const classesData = {
    'class-9': { name: 'Class IX', icon: '📘', color: '#4CAF50' },
    'class-10': { name: 'Class X', icon: '📗', color: '#2196F3' },
    'sem-1': { name: 'SEM I', icon: '🎓', color: '#FF9800' },
    'sem-2': { name: 'SEM II', icon: '🎓', color: '#FF5722' },
    'sem-3': { name: 'SEM III', icon: '🎓', color: '#9C27B0' },
    'sem-4': { name: 'SEM IV', icon: '🎓', color: '#E91E63' },
    'neet': { name: 'NEET', icon: '🏥', color: '#00BCD4' },
    'jee': { name: 'JEE', icon: '⚡', color: '#FFC107' }
};

// Test types
const testTypes = [
    { id: 'mock-test', name: 'Mock Test', icon: '📝', color: '#4CAF50' },
    { id: 'assignments', name: 'Assignments', icon: '📋', color: '#2196F3' }
];

// ========================================
// Authentication Check
// ========================================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // Not logged in, redirect to login
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = '/src/index.html';
        }
        return;
    }

    currentUser = user;
    
    // Check if on main page and has coaching selected
    if (window.location.pathname.includes('main.html')) {
        selectedCoaching = sessionStorage.getItem('selectedCoaching');
        if (!selectedCoaching) {
            window.location.href = 'coaching-select.html';
            return;
        }
        
        // Load databases
        await loadDatabases();
        
        // Initialize main page
        initMainPage();
        
        // Handle browser back button - only add listener once
        if (!window.backButtonHandlerAdded) {
            window.backButtonHandlerAdded = true;
            
            // Replace the current history state (coaching-select -> main.html navigation)
            // with a classes view state to prevent going back to coaching-select
            window.history.replaceState({ view: 'classes', isRoot: true }, '');
            
            window.addEventListener('popstate', function(event) {
                isNavigatingBack = true; // Set flag before navigation
                
                if (event.state && event.state.view) {
                    // If we hit the root classes state, prevent further back navigation
                    if (event.state.isRoot) {
                        // Push it back so we can't go further back
                        window.history.pushState({ view: 'classes', isRoot: true }, '');
                        loadClassesView();
                    } else {
                        // Handle internal navigation based on state
                        handleInternalNavigation(event.state);
                    }
                } else {
                    // If no state, stay at classes view and push new state
                    window.history.pushState({ view: 'classes', isRoot: true }, '');
                    loadClassesView();
                }
                // Reset flag after a short delay
                setTimeout(() => { isNavigatingBack = false; }, 100);
            });
        }
    }
});

// ========================================
// Load Databases from Firebase
// ========================================
async function loadDatabases() {
    try {
        // Load PDFs database
        const pdfsRef = ref(database, 'pdfs');
        const pdfsSnapshot = await get(pdfsRef);
        pdfDatabase = pdfsSnapshot.exists() ? pdfsSnapshot.val() : {};

        // Load chapters database
        const chaptersRef = ref(database, 'chapters');
        const chaptersSnapshot = await get(chaptersRef);
        chaptersDatabase = chaptersSnapshot.exists() ? chaptersSnapshot.val() : {};

        console.log('✅ Databases loaded from Firebase');
    } catch (error) {
        console.error('❌ Error loading databases:', error);
        showAlert('Failed to load data from server', 'error');
    }
}

// ========================================
// Check User Access Permission
// ========================================
async function checkUserAccess(coachingId, classId, subjectName, testtypeName) {
    try {
        const accessRef = ref(database, 'access-control');
        const snapshot = await get(accessRef);
        
        if (!snapshot.exists()) {
            return false;
        }
        
        const accessList = snapshot.val();
        const userEmail = currentUser.email;
        
        // Check if user has permission for this specific path
        const hasAccess = Object.values(accessList).some(access => 
            access.userEmail === userEmail &&
            access.coachingId === coachingId &&
            access.classId === classId &&
            access.subjectName === subjectName &&
            access.testtypeName === testtypeName
        );
        
        return hasAccess;
    } catch (error) {
        console.error('Error checking access:', error);
        return false;
    }
}

// ========================================
// Handle Internal Navigation (Back Button)
// ========================================
function handleInternalNavigation(state) {
    if (!state || !state.view) {
        loadClassesView();
        return;
    }
    
    switch(state.view) {
        case 'classes':
            loadClassesView();
            break;
        case 'subjects':
            if (state.classId) loadSubjectsView(state.classId);
            break;
        case 'types':
            if (state.classId && state.subjectId) {
                loadTestTypesView(state.classId, state.subjectId);
            }
            break;
        case 'chapters':
            if (state.classId && state.subjectId && state.typeId) {
                loadChaptersView(state.classId, state.subjectId, state.typeId);
            }
            break;
        case 'pdfs':
            if (state.classId && state.subjectId && state.typeId && state.chapterId) {
                loadPDFsView(state.classId, state.subjectId, state.typeId, state.chapterId, state.chapterName || 'Chapter');
            }
            break;
        default:
            loadClassesView();
    }
}

// ========================================
// Main Page Initialization
// ========================================
function initMainPage() {
    // Update welcome message
    const welcomeText = document.querySelector('.welcome-text h2');
    if (welcomeText) {
        welcomeText.textContent = `Welcome back, ${currentUser.displayName || currentUser.email.split('@')[0]}!`;
    }

    // Load classes view
    loadClassesView();
}

// ========================================
// View: Classes
// ========================================
async function loadClassesView() {
    navigationState.currentClass = null;
    navigationState.currentSubject = null;
    navigationState.currentType = null;
    navigationState.currentChapter = null;
    navigationState.breadcrumb = ['Choose Coaching'];
    updateBreadcrumb();
    
    // Only push state if not navigating back
    if (!isNavigatingBack) {
        window.history.pushState({ view: 'classes' }, '');
    }

    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');

    sectionHeader.innerHTML = `
        <h3>📚 Select Your Class</h3>
        <p class="section-description">Choose a class to access study materials</p>
    `;

    // Load classes from Firebase for the selected coaching
    try {
        const classesRef = ref(database, 'classes');
        const snapshot = await get(classesRef);

        if (snapshot.exists()) {
            const allClasses = snapshot.val();
            
            // Filter classes for the selected coaching
            const coachingClasses = Object.entries(allClasses)
                .filter(([key, classData]) => classData.coachingId === selectedCoaching)
                .map(([key, classData]) => ({
                    id: classData.classId,
                    name: classData.name,
                    icon: classData.icon,
                    color: classData.color
                }));

            if (coachingClasses.length > 0) {
                const classesHTML = coachingClasses.map(classInfo => {
                    return `
                        <div class="class-card" onclick="window.selectClass('${classInfo.id}')" style="background: ${classInfo.color}; cursor: pointer; padding: 30px; border-radius: 15px; color: white; text-align: center; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.2)'">
                            <div style="font-size: 3rem; margin-bottom: 15px;">${classInfo.icon}</div>
                            <h4 style="font-size: 1.3rem; font-weight: 600; margin: 0;">${classInfo.name}</h4>
                            <div style="margin-top: 15px; font-size: 1.5rem;">→</div>
                        </div>
                    `;
                }).join('');

                cardsGrid.innerHTML = classesHTML;
            } else {
                cardsGrid.innerHTML = '';
            }
        } else {
            // Fallback to default classes if none in database
            const classesHTML = Object.keys(classesData).map(classId => {
                const classInfo = classesData[classId];
                return `
                    <div class="class-card" onclick="window.selectClass('${classId}')" style="background: ${classInfo.color}; cursor: pointer; padding: 30px; border-radius: 15px; color: white; text-align: center; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.2)'">
                        <div style="font-size: 3rem; margin-bottom: 15px;">${classInfo.icon}</div>
                        <h4 style="font-size: 1.3rem; font-weight: 600; margin: 0;">${classInfo.name}</h4>
                        <div style="margin-top: 15px; font-size: 1.5rem;">→</div>
                    </div>
                `;
            }).join('');

            cardsGrid.innerHTML = classesHTML;
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        // Fallback to default classes on error
        const classesHTML = Object.keys(classesData).map(classId => {
            const classInfo = classesData[classId];
            return `
                <div class="class-card" onclick="window.selectClass('${classId}')" style="background: ${classInfo.color}; cursor: pointer; padding: 30px; border-radius: 15px; color: white; text-align: center; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.2)'">
                    <div style="font-size: 3rem; margin-bottom: 15px;">${classInfo.icon}</div>
                    <h4 style="font-size: 1.3rem; font-weight: 600; margin: 0;">${classInfo.name}</h4>
                    <div style="margin-top: 15px; font-size: 1.5rem;">→</div>
                </div>
            `;
        }).join('');

        cardsGrid.innerHTML = classesHTML;
    }
}

// ========================================
// View: Subjects
// ========================================
async function loadSubjectsView(classId) {
    navigationState.currentClass = classId;
    navigationState.breadcrumb = ['Choose Coaching', classesData[classId]?.name || 'Class'];
    updateBreadcrumb();
    
    // Only push state if not navigating back
    if (!isNavigatingBack) {
        window.history.pushState({ 
            view: 'subjects', 
            classId: classId 
        }, '');
    }

    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');

    sectionHeader.innerHTML = `
        <h3>${classesData[classId]?.icon || '📚'} ${classesData[classId]?.name || 'Class'}</h3>
        <p class="section-description">Choose your subject</p>
    `;

    // Load subjects from Firebase for the selected coaching and class
    try {
        const subjectsRef = ref(database, 'subjects');
        const snapshot = await get(subjectsRef);

        if (snapshot.exists()) {
            const allSubjects = snapshot.val();
            
            // Filter subjects for the selected coaching and class
            const classSubjects = Object.entries(allSubjects)
                .filter(([key, subjectData]) => 
                    subjectData.coachingId === selectedCoaching && 
                    subjectData.classId === classId
                )
                .map(([key, subjectData]) => ({
                    id: subjectData.name,
                    name: subjectData.name,
                    icon: subjectData.icon,
                    color: subjectData.color
                }));

            if (classSubjects.length > 0) {
                const subjectsHTML = classSubjects.map(subject => `
                    <div class="subject-card" onclick="window.selectSubject('${classId}', '${subject.id}')" style="background: ${subject.color}; cursor: pointer; padding: 30px; border-radius: 15px; color: white; text-align: center; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.2)'">
                        <div style="font-size: 3rem; margin-bottom: 15px;">${subject.icon}</div>
                        <h4 style="font-size: 1.3rem; font-weight: 600; margin: 0;">${subject.name}</h4>
                        <div style="margin-top: 15px; font-size: 1.5rem;">→</div>
                    </div>
                `).join('');

                cardsGrid.innerHTML = subjectsHTML;
            } else {
                cardsGrid.innerHTML = '';
            }
        } else {
            // Fallback to getting subjects from PDF database if none in subjects collection
            const subjects = getSubjectsForClass(classId);

            if (subjects.length === 0) {
                cardsGrid.innerHTML = '';
                return;
            }

            const subjectsHTML = subjects.map(subject => `
                <div class="subject-card" onclick="window.selectSubject('${classId}', '${subject.id}')">
                    <div class="card-icon">${subject.icon}</div>
                    <h4 class="card-title">${subject.name}</h4>
                    <div class="card-arrow">→</div>
                </div>
            `).join('');

            cardsGrid.innerHTML = subjectsHTML;
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        // Fallback to PDF database subjects on error
        const subjects = getSubjectsForClass(classId);

        if (subjects.length === 0) {
            cardsGrid.innerHTML = '';
            return;
        }

        const subjectsHTML = subjects.map(subject => `
            <div class="subject-card" onclick="window.selectSubject('${classId}', '${subject.id}')">
                <div class="card-icon">${subject.icon}</div>
                <h4 class="card-title">${subject.name}</h4>
                <div class="card-arrow">→</div>
            </div>
        `).join('');

        cardsGrid.innerHTML = subjectsHTML;
    }
}

// ========================================
// View: Test Types
// ========================================
async function loadTestTypesView(classId, subjectId) {
    navigationState.currentSubject = subjectId;
    navigationState.breadcrumb = ['Choose Coaching', classesData[classId]?.name || 'Class', subjectId];
    updateBreadcrumb();
    
    // Only push state if not navigating back
    if (!isNavigatingBack) {
        window.history.pushState({ 
            view: 'types', 
            classId: classId,
            subjectId: subjectId 
        }, '');
    }

    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');    sectionHeader.innerHTML = `
        <h3>📖 ${subjectId}</h3>
        <p class="section-description">Select test type</p>
    `;

    // Load test types from Firebase for the selected coaching, class, and subject
    try {
        const testtypesRef = ref(database, 'test-types');
        const snapshot = await get(testtypesRef);

        if (snapshot.exists()) {
            const allTestTypes = snapshot.val();
            
            // Filter test types for the selected coaching, class, and subject
            const subjectTestTypes = Object.entries(allTestTypes)
                .filter(([key, testtypeData]) => 
                    testtypeData.coachingId === selectedCoaching && 
                    testtypeData.classId === classId &&
                    testtypeData.subjectName === subjectId
                )
                .map(([key, testtypeData]) => ({
                    id: testtypeData.name,
                    name: testtypeData.name,
                    icon: testtypeData.icon,
                    color: testtypeData.color
                }));

            if (subjectTestTypes.length > 0) {
                const typesHTML = subjectTestTypes.map(type => `
                    <div class="test-type-card" onclick="window.selectTestType('${classId}', '${subjectId}', '${type.id}')" style="background: ${type.color}; cursor: pointer; padding: 30px; border-radius: 15px; color: white; text-align: center; transition: all 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.2);" onmouseover="this.style.transform='translateY(-5px) scale(1.02)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.2)'">
                        <div style="font-size: 3rem; margin-bottom: 15px;">${type.icon}</div>
                        <h4 style="font-size: 1.3rem; font-weight: 600; margin: 0;">${type.name}</h4>
                        <div style="margin-top: 15px; font-size: 1.5rem;">→</div>
                    </div>
                `).join('');

                cardsGrid.innerHTML = typesHTML;
            } else {
                cardsGrid.innerHTML = '';
            }
        } else {
            // Fallback to default test types if none in database
            const typesHTML = testTypes.map(type => `
                <div class="test-type-card" onclick="window.selectTestType('${classId}', '${subjectId}', '${type.id}')" style="--card-color: ${type.color}">
                    <div class="card-icon">${type.icon}</div>
                    <h4 class="card-title">${type.name}</h4>
                    <div class="card-arrow">→</div>
                </div>
            `).join('');

            cardsGrid.innerHTML = typesHTML;
        }
    } catch (error) {
        console.error('Error loading test types:', error);
        // Fallback to default test types on error
        const typesHTML = testTypes.map(type => `
            <div class="test-type-card" onclick="window.selectTestType('${classId}', '${subjectId}', '${type.id}')" style="--card-color: ${type.color}">
                <div class="card-icon">${type.icon}</div>
                <h4 class="card-title">${type.name}</h4>
                <div class="card-arrow">→</div>
            </div>
        `).join('');

        cardsGrid.innerHTML = typesHTML;
    }
}

// ========================================
// View: Chapters
// ========================================
async function loadChaptersView(classId, subjectId, typeId) {
    navigationState.currentType = typeId;
    
    // Get type name from Firebase or fallback to default
    let typeName = typeId;
    try {
        const testtypesRef = ref(database, 'test-types');
        const snapshot = await get(testtypesRef);
        if (snapshot.exists()) {
            const testtypes = snapshot.val();
            const foundType = Object.values(testtypes).find(t => 
                t.coachingId === selectedCoaching && 
                t.classId === classId && 
                t.subjectName === subjectId &&
                t.name === typeId
            );
            if (foundType) {
                typeName = foundType.name;
            }
        }
        if (typeName === typeId) {
            const defaultType = testTypes.find(t => t.id === typeId);
            if (defaultType) typeName = defaultType.name;
        }
    } catch (error) {
        console.error('Error loading test type name:', error);
        const defaultType = testTypes.find(t => t.id === typeId);
        if (defaultType) typeName = defaultType.name;
    }

    navigationState.breadcrumb = ['Choose Coaching', classesData[classId]?.name || classId, subjectId, typeName];
    updateBreadcrumb();
    
    // Only push state if not navigating back
    if (!isNavigatingBack) {
        window.history.pushState({ 
            view: 'chapters', 
            classId: classId,
            subjectId: subjectId,
            typeId: typeId
        }, '');
    }

    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');

    sectionHeader.innerHTML = `
        <h3>📑 ${subjectId} - ${typeName}</h3>
        <p class="section-description">Select a chapter</p>
    `;

    // Load chapters from Firebase database
    try {
        const chaptersRef = ref(database, 'chapters');
        const snapshot = await get(chaptersRef);

        if (snapshot.exists()) {
            const allChapters = snapshot.val();
            
            // Filter chapters for the selected coaching, class, subject, and test type
            const filteredChapters = Object.entries(allChapters)
                .filter(([key, chapterData]) => 
                    chapterData.coachingId === selectedCoaching && 
                    chapterData.classId === classId &&
                    chapterData.subjectName === subjectId &&
                    chapterData.testtypeName === typeId
                )
                .map(([key, chapterData]) => ({
                    key: key,
                    serialNo: chapterData.serialNo,
                    name: chapterData.name
                }))
                .sort((a, b) => a.serialNo - b.serialNo); // Sort by serial number

            if (filteredChapters.length > 0) {
                const chaptersHTML = filteredChapters.map(chapter => `
                    <div class="chapter-card" onclick="window.selectChapter('${classId}', '${subjectId}', '${typeId}', '${chapter.key}', '${chapter.name.replace(/'/g, "\\'")}')">
                        <div class="chapter-number">#${chapter.serialNo}</div>
                        <div class="chapter-info">
                            <h4 class="card-title">${chapter.name}</h4>
                            <p class="chapter-meta">Click to view materials</p>
                        </div>
                        <div class="card-arrow">→</div>
                    </div>
                `).join('');

                cardsGrid.innerHTML = chaptersHTML;
            } else {
                cardsGrid.innerHTML = `
                    <p class="no-content">
                        No chapters available yet.<br>
                        Please add chapters using the Admin Panel.
                    </p>
                `;
            }
        } else {
            cardsGrid.innerHTML = `
                <p class="no-content">
                    No chapters available yet.<br>
                    Please add chapters using the Admin Panel.
                </p>
            `;
        }
    } catch (error) {
        console.error('Error loading chapters:', error);
        cardsGrid.innerHTML = `
            <p class="no-content">
                Error loading chapters. Please try again later.
            </p>
        `;
    }
}

// ========================================
// View: PDFs
// ========================================
async function loadPDFsView(classId, subjectId, typeId, chapterKey, chapterName) {
    navigationState.currentChapter = chapterKey;
    
    // Get type name from Firebase or fallback to default
    let typeName = typeId;
    try {
        const testtypesRef = ref(database, 'test-types');
        const snapshot = await get(testtypesRef);
        if (snapshot.exists()) {
            const testtypes = snapshot.val();
            const foundType = Object.values(testtypes).find(t => 
                t.coachingId === selectedCoaching && 
                t.classId === classId && 
                t.subjectName === subjectId &&
                t.name === typeId
            );
            if (foundType) {
                typeName = foundType.name;
            }
        }
        if (typeName === typeId) {
            const defaultType = testTypes.find(t => t.id === typeId);
            if (defaultType) typeName = defaultType.name;
        }
    } catch (error) {
        console.error('Error loading test type name:', error);
        const defaultType = testTypes.find(t => t.id === typeId);
        if (defaultType) typeName = defaultType.name;
    }

    navigationState.breadcrumb = ['Choose Coaching', classesData[classId]?.name || classId, subjectId, typeName, chapterName];
    updateBreadcrumb();
    
    // Only push state if not navigating back
    if (!isNavigatingBack) {
        window.history.pushState({ 
            view: 'pdfs', 
            classId: classId,
            subjectId: subjectId,
            typeId: typeId,
            chapterId: chapterKey,
            chapterName: chapterName
        }, '');
    }
    const sectionHeader = document.getElementById('sectionHeader');
    const cardsGrid = document.getElementById('cardsGrid');

    sectionHeader.innerHTML = `
        <h3>📄 ${chapterName}</h3>
        <p class="section-description">View or download PDF materials</p>
    `;

    // Load PDFs from Firebase database
    try {
        const pdfsRef = ref(database, 'pdfs');
        const snapshot = await get(pdfsRef);

        if (snapshot.exists()) {
            const allPDFs = snapshot.val();
            
            // Filter PDFs for the selected chapter
            const chapterPDFs = Object.entries(allPDFs)
                .filter(([key, pdfData]) => 
                    pdfData.coachingId === selectedCoaching && 
                    pdfData.classId === classId &&
                    pdfData.subjectName === subjectId &&
                    pdfData.testtypeName === typeId &&
                    pdfData.chapterKey === chapterKey
                )
                .map(([key, pdfData]) => ({
                    key: key,
                    serialNo: pdfData.serialNo,
                    fileName: pdfData.fileName,
                    url: pdfData.url
                }))
                .sort((a, b) => a.serialNo - b.serialNo); // Sort by serial number

            if (chapterPDFs.length > 0) {
                // Check user access permission
                const hasAccess = await checkUserAccess(selectedCoaching, classId, subjectId, typeId);
                
                const pdfsHTML = chapterPDFs.map(pdf => `
                    <div class="pdf-card">
                        <div class="pdf-icon">📄</div>
                        <div class="pdf-info">
                            <h4 class="card-title">${pdf.fileName}</h4>
                            <p class="pdf-meta">#${pdf.serialNo} • ${classesData[classId]?.name || classId} • ${subjectId} • ${typeName}</p>
                        </div>
                        <div class="pdf-actions">
                            <button class="btn btn-view" onclick="window.handlePDFAction('view', '${pdf.url}', '${pdf.fileName.replace(/'/g, "\\'")}', '${selectedCoaching}', '${classId}', '${subjectId}', '${typeId}', ${hasAccess})">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                View
                            </button>
                            <button class="btn btn-download" onclick="window.handlePDFAction('download', '${pdf.url}', '${pdf.fileName.replace(/'/g, "\\'")}', '${selectedCoaching}', '${classId}', '${subjectId}', '${typeId}', ${hasAccess})">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2"/>
                                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2"/>
                                    <path d="M12 15V3" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                Download
                            </button>
                        </div>
                    </div>
                `).join('');

                cardsGrid.innerHTML = pdfsHTML;
            } else {
                cardsGrid.innerHTML = `
                    <p class="no-content">
                        No PDFs available yet.<br>
                        Please add PDFs using the Admin Panel.
                    </p>
                `;
            }
        } else {
            cardsGrid.innerHTML = `
                <p class="no-content">
                    No PDFs available yet.<br>
                    Please add PDFs using the Admin Panel.
                </p>
            `;
        }
    } catch (error) {
        console.error('Error loading PDFs:', error);
        cardsGrid.innerHTML = `
            <p class="no-content">
                Error loading PDFs. Please try again later.
            </p>
        `;
    }
}

// ========================================
// Helper Functions
// ========================================
function getSubjectsForClass(classId) {
    const subjects = new Set();
    
    if (pdfDatabase[selectedCoaching] && pdfDatabase[selectedCoaching][classId]) {
        Object.keys(pdfDatabase[selectedCoaching][classId]).forEach(subject => {
            subjects.add(subject);
        });
    }

    return Array.from(subjects).map(subject => ({
        id: subject,
        name: subject.charAt(0).toUpperCase() + subject.slice(1),
        icon: getSubjectIcon(subject)
    }));
}

function getSubjectIcon(subject) {
    const icons = {
        'mathematics': '🔢',
        'physics': '⚛️',
        'chemistry': '🧪',
        'biology': '🧬',
        'english': '📚',
        'hindi': '📖',
        'social': '🌍',
        'computer': '💻'
    };
    return icons[subject.toLowerCase()] || '📘';
}

function getChaptersForSubject(classId, subjectId) {
    if (chaptersDatabase[classId] && chaptersDatabase[classId][subjectId]) {
        const chapterData = chaptersDatabase[classId][subjectId];
        return Object.entries(chapterData).map(([num, name]) => ({
            number: parseInt(num),
            name: name
        }));
    }
    return [];
}

function getChapterName(classId, subjectId, chapterNumber) {
    if (chaptersDatabase[classId] && chaptersDatabase[classId][subjectId] && chaptersDatabase[classId][subjectId][chapterNumber]) {
        return chaptersDatabase[classId][subjectId][chapterNumber];
    }
    return `Chapter ${chapterNumber}`;
}

function getPDFsForChapter(classId, subjectId, typeId, chapterNumber) {
    try {
        const path = pdfDatabase[selectedCoaching]?.[classId]?.[subjectId]?.[typeId]?.[chapterNumber];
        return Array.isArray(path) ? path : [];
    } catch (error) {
        console.error('Error getting PDFs:', error);
        return [];
    }
}

// ========================================
// PDF Actions (Google Drive) with Permission Check
// ========================================
function handlePDFAction(action, url, fileName, coachingId, classId, subjectName, testtypeName, hasAccess) {
    if (!hasAccess) {
        showPermissionDeniedModal();
        return;
    }
    
    if (action === 'view') {
        viewPDF(url, fileName);
    } else if (action === 'download') {
        downloadPDF(url, fileName);
    }
}

function viewPDF(driveLink, pdfName) {
    if (!driveLink) {
        alert('⚠️ PDF link not available');
        return;
    }

    // Open Google Drive link in new tab
    window.open(driveLink, '_blank');
}

function downloadPDF(driveLink, pdfName) {
    if (!driveLink) {
        alert('⚠️ PDF link not available');
        return;
    }

    // Convert Drive view link to download link
    let downloadLink = driveLink;
    
    // If it's a view link, convert to download link
    if (driveLink.includes('/file/d/')) {
        const fileId = driveLink.match(/\/file\/d\/([^\/]+)/)?.[1];
        if (fileId) {
            downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
    }

    // Open download link
    window.open(downloadLink, '_blank');
}

// ========================================
// Permission Denied Modal
// ========================================
function showPermissionDeniedModal() {
    // Create modal HTML if it doesn't exist
    if (!document.getElementById('permissionModal')) {
        const modalHTML = `
            <div id="permissionModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    max-width: 450px;
                    animation: slideDown 0.3s ease;
                ">
                    <div style="
                        font-size: 4rem;
                        margin-bottom: 20px;
                        animation: shake 0.5s ease;
                    ">🔒</div>
                    <h2 style="
                        color: #d63031;
                        margin-bottom: 15px;
                        font-size: 1.8rem;
                        font-weight: 700;
                    ">Access Denied!</h2>
                    <p style="
                        color: #666;
                        font-size: 1.1rem;
                        margin-bottom: 30px;
                        line-height: 1.6;
                    ">You are not permitted to view or download this PDF.<br>Please contact your administrator for access.</p>
                    <button onclick="closePermissionModal()" style="
                        padding: 12px 40px;
                        background: linear-gradient(135deg, #d63031 0%, #e17055 100%);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 5px 15px rgba(214, 48, 49, 0.3);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(214, 48, 49, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 15px rgba(214, 48, 49, 0.3)'">
                        Okay, Got It
                    </button>
                </div>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    75% { transform: rotate(10deg); }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } else {
        document.getElementById('permissionModal').style.display = 'flex';
    }
}

function closePermissionModal() {
    const modal = document.getElementById('permissionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

window.closePermissionModal = closePermissionModal;

// ========================================
// Breadcrumb Navigation
// ========================================
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');

    // Always show breadcrumb
    breadcrumb.style.display = 'flex';

    const breadcrumbHTML = navigationState.breadcrumb.map((item, index) => {
        if (index === navigationState.breadcrumb.length - 1) {
            return `<span class="breadcrumb-item active">${item}</span>`;
        }

        let onclick = '';
        if (index === 0) {
            onclick = 'window.location.href="coaching-select.html"';
        } else if (index === 1) {
            onclick = `window.selectClass('${navigationState.currentClass}')`;
        } else if (index === 2) {
            onclick = `window.selectSubject('${navigationState.currentClass}', '${navigationState.currentSubject}')`;
        } else if (index === 3) {
            onclick = `window.selectTestType('${navigationState.currentClass}', '${navigationState.currentSubject}', '${navigationState.currentType}')`;
        }

        return `
            <span class="breadcrumb-item" onclick="${onclick}">${item}</span>
            <span class="breadcrumb-separator">›</span>
        `;
    }).join('');

    breadcrumb.innerHTML = breadcrumbHTML;
}

// ========================================
// Alert System
// ========================================
function showAlert(message, type = 'info') {
    alert(message);
}

// ========================================
// Logout
// ========================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut();
        sessionStorage.clear();
        window.location.href = '/src/index.html';
    }
}

// ========================================
// Export to Window for HTML onclick
// ========================================
window.loadClassesView = loadClassesView;
window.selectClass = function(...args) {
    isNavigatingBack = false;
    return loadSubjectsView(...args);
};
window.selectSubject = function(...args) {
    isNavigatingBack = false;
    return loadTestTypesView(...args);
};
window.selectTestType = function(...args) {
    isNavigatingBack = false;
    return loadChaptersView(...args);
};
window.selectChapter = function(...args) {
    isNavigatingBack = false;
    return loadPDFsView(...args);
};
window.handlePDFAction = handlePDFAction;
window.viewPDF = viewPDF;
window.downloadPDF = downloadPDF;
window.logout = logout;

// ========================================
// Export for Module Imports
// ========================================
export { initMainPage as loadMainPage };
