# 🚀 Quick Setup Guide

## Step-by-Step Firebase Setup

### 1. Enable Firebase Realtime Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `mycoaching-mm`
3. Click **"Realtime Database"** in left menu
4. Click **"Create Database"**
5. Choose location: (your nearest location)
6. **Start in test mode** (we'll update rules later)

### 2. Update Database Rules

Go to **Rules** tab and paste:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Click **"Publish"**

### 3. Add Database URL to Config

1. In Realtime Database page, copy the **Database URL**

   - Should look like: `https://project-name-default-rtdb.firebaseio.com`

2. Open `src/js/firebase-config.js`

3. Ensure `databaseURL` is set:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBlYZBkng7APnplMiC6jIy5kc2zw5bMTO0",
  authDomain: "domainn-name.firebaseapp.com",
  databaseURL: "https://appname-default-rtdb.firebaseio.com", // ✅ This line
  projectId: "mycoaching-mm",
  storageBucket: "bucket-name.firebasestorage.app",
  messagingSenderId: "304171946364",
  appId: "1:304171946364:web:b1c329c6861d5764bf94f9",
};
```

### 4. Enable Email/Password Authentication

1. Go to **Authentication** in Firebase Console
2. Click **"Sign-in method"** tab
3. Click **"Email/Password"**
4. Toggle **"Enable"**
5. Click **"Save"**

### 5. Add Admin User

1. Go to **Authentication** → **Users** tab
2. Click **"Add user"**
3. Enter:
   - Email: `admin@mycoaching.com`
   - Password: (choose a secure password)
4. Click **"Add user"**

### 6. Add Student Users

Repeat for students:

- `student1@coaching.com`
- `student2@coaching.com`
- etc.

### 7. Add Initial Data to Database

Go to **Realtime Database** → **Data** tab, click ➕ and paste this structure:

```json
{
  "access-control": {
    "-OeMJChnfIvBDev7PnjC": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "grantedAt": "2025-11-18T14:14:10.162Z",
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST",
      "userEmail": "mrinal_maity@gmail.com"
    },
    "-OeMLLyUrsfTlAU-M8Kt": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "grantedAt": "2025-11-18T14:23:32.371Z",
      "subjectName": "PHYSICS",
      "testtypeName": "WRITTEN EXAM",
      "userEmail": "mrinal_maity@gmail.com"
    }
  },
  "chapters": {
    "-OeICvhZobo3ndqISJTs": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-17T19:08:14.611Z",
      "name": "Atomic Structure",
      "serialNo": 1,
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST"
    },
    "-OeIEnQKuBIbURIGw2r6": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-17T19:16:24.925Z",
      "name": "Complex Compound",
      "serialNo": 2,
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST"
    },
    "-OeIF2vLLF48fXzKvQfO": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-17T19:17:32.510Z",
      "name": "Organic Chemistry",
      "serialNo": 3,
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST"
    },
    "-OeIFER3eSUUHMm5ss7X": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-17T19:18:19.660Z",
      "name": "Inorganic Chemistry",
      "serialNo": 4,
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST"
    },
    "-OeMFtKPeKFNw4j_TOtM": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-18T13:59:40.280Z",
      "name": "INTERFERENCE",
      "serialNo": 1,
      "subjectName": "PHYSICS",
      "testtypeName": "WRITTEN EXAM"
    }
  },
  "classes": {
    "-OeHqRu-UK3-n6ROB6RY": {
      "classId": "cls-6",
      "coachingId": "coaching-1",
      "color": "#e94979",
      "createdAt": "2025-11-17T17:40:12.552Z",
      "icon": "📗",
      "name": "Class VI"
    },
    "-OeI0y6ISKwjL06ycrIV": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "color": "#4caf50",
      "createdAt": "2025-11-17T18:15:58.732Z",
      "icon": "🎓",
      "name": "SEM III"
    },
    "-OeI1PYaWTBi4owOUHLd": {
      "classId": "sem-4",
      "coachingId": "coaching-3",
      "color": "#1d90d7",
      "createdAt": "2025-11-17T18:17:55.231Z",
      "icon": "🎓",
      "name": "SEM IV"
    }
  },
  "coaching-centers": {
    "coaching-1": {
      "contact": "9647545424",
      "createdAt": "2025-11-17T17:12:16.136Z",
      "icon": "🎓",
      "id": "coaching-1",
      "name": "Excellence Coaching",
      "owner": "Mrinal Maity",
      "place": "Patharpratima"
    },
    "coaching-2": {
      "contact": "9876456789",
      "createdAt": "2025-11-17T17:13:25.330Z",
      "icon": "🏫",
      "id": "coaching-2",
      "name": "NEET Academy",
      "owner": "Sudip Mahajan",
      "place": "Garia"
    },
    "coaching-3": {
      "contact": "9078654567",
      "createdAt": "2025-11-17T17:16:57.603Z",
      "icon": "🎯",
      "id": "coaching-3",
      "name": "BH Chem Lab",
      "owner": "Bikramjeet Sir",
      "place": "Sonarpur"
    },
    "coaching-4": {
      "contact": "9732876006",
      "createdAt": "2025-11-17T18:01:38.153Z",
      "icon": "💡",
      "id": "coaching-4",
      "name": "Tech Lab",
      "owner": "Lohit Maity",
      "place": "Ganjer Bajar"
    }
  },
  "pdfs": {
    "-OeIJ7xNdLX9MN6RToUK": {
      "chapterKey": "-OeICvhZobo3ndqISJTs",
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-17T19:35:21.686Z",
      "fileName": "ATOM STR",
      "serialNo": 1,
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST",
      "url": "https://drive.google.com/file/d/1JTO0emgj8s8JQljvyCGfaUTZtImBZCxR/view?usp=sharing"
    },
    "-OeIKro2cNajWRRsMaSQ": {
      "chapterKey": "-OeICvhZobo3ndqISJTs",
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-17T19:42:55.735Z",
      "fileName": "ATOM MCQ",
      "serialNo": 2,
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST",
      "url": "https://drive.google.com/file/d/1JTO0emgj8s8JQljvyCGfaUTZtImBZCxR/view?usp=sharing"
    },
    "-OeIRrlDsBjAu_vtqJIm": {
      "chapterKey": "-OeIEnQKuBIbURIGw2r6",
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-17T20:14:27.729Z",
      "fileName": "ATOM SECOND PART",
      "serialNo": 3,
      "subjectName": "CHEMISTRY",
      "testtypeName": "MOCK TEST",
      "url": "https://docs.google.com/document/d/192dL0PgRHBBou7DXx3eWBkWbUcLbJLmYqDctCYwslW4/edit?usp=sharing"
    },
    "-OeMIyUPA3Rb6OINCdj3": {
      "chapterKey": "-OeMFtKPeKFNw4j_TOtM",
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "createdAt": "2025-11-18T14:13:07.801Z",
      "fileName": "NOTES",
      "serialNo": 1,
      "subjectName": "PHYSICS",
      "testtypeName": "WRITTEN EXAM",
      "url": "https://drive.google.com/file/d/1JTO0emgj8s8JQljvyCGfaUTZtImBZCxR/view?usp=sharing"
    }
  },
  "subjects": {
    "-OeI4fckIHLjRQ0nLqk0": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "color": "#f93e63",
      "createdAt": "2025-11-17T18:32:11.623Z",
      "icon": "⚗️",
      "name": "CHEMISTRY"
    },
    "-OeI5A_8idMlxEkMPEAN": {
      "classId": "cls-6",
      "coachingId": "coaching-1",
      "color": "#0d9ac9",
      "createdAt": "2025-11-17T18:34:22.464Z",
      "icon": "🔬",
      "name": "PHYSICS"
    },
    "-OeI5VcaQSgvpChG31Z8": {
      "classId": "sem-4",
      "coachingId": "coaching-3",
      "color": "#ff9800",
      "createdAt": "2025-11-17T18:35:48.701Z",
      "icon": "📐",
      "name": "MATHEMATICS"
    },
    "-OeI5cowIesQij_xYI18": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "color": "#ae00ff",
      "createdAt": "2025-11-17T18:36:22.259Z",
      "icon": "🔬",
      "name": "PHYSICS"
    },
    "-OeI5kFw9TquCq5n_Z5C": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "color": "#ff0095",
      "createdAt": "2025-11-17T18:36:52.723Z",
      "icon": "🧬",
      "name": "BIOLOGY"
    },
    "-OeI5vIAgsikLnJjFFwy": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "color": "#07cf72",
      "createdAt": "2025-11-17T18:37:37.922Z",
      "icon": "🌍",
      "name": "GEOGRAPHY"
    }
  },
  "test-types": {
    "-OeI9Dt6kjXdXLsHW40u": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "color": "#9f1ff4",
      "createdAt": "2025-11-17T18:52:04.578Z",
      "icon": "📊",
      "name": "MOCK TEST",
      "subjectName": "CHEMISTRY"
    },
    "-OeI9_Qi8sKc0NkWcXNh": {
      "classId": "sem-3",
      "coachingId": "coaching-3",
      "color": "#0586f0",
      "createdAt": "2025-11-17T18:57:43.824Z",
      "icon": "📝",
      "name": "WRITTEN EXAM",
      "subjectName": "PHYSICS"
    }
  }
}
```

**Note:** Replace `YOUR_FILE_ID` with actual Google Drive file IDs.

---

## 🔗 Getting Google Drive Links

### Method 1: Share Link

1. Upload PDF to Google Drive
2. Right-click → **Share**
3. Click **"Change to anyone with the link"**
4. Copy link (looks like: `https://drive.google.com/file/d/ABC123XYZ/view`)
5. Paste in admin panel

### Method 2: Get File ID

From the link: `https://drive.google.com/file/d/ABC123XYZ/view`

- File ID: `ABC123XYZ`

You can create links manually:

- **View:** `https://drive.google.com/file/d/ABC123XYZ/view`
- **Download:** `https://drive.google.com/uc?export=download&id=ABC123XYZ`

---

## 🧪 Testing Locally

```powershell
# Start local server (from MyApp folder)
cd d:\MyApp

# Option 1: Node.js server
node -e "require('http').createServer((req, res) => { const fs = require('fs'); const path = require('path'); let filePath = '.' + (req.url === '/' ? '/public/index.html' : req.url); const ext = path.extname(filePath).toLowerCase(); const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' }; const contentType = mimeTypes[ext] || 'application/octet-stream'; fs.readFile(filePath, (error, content) => { if (error) { if (error.code === 'ENOENT') { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end('404 Not Found', 'utf-8'); } else { res.writeHead(500); res.end('Error: '+error.code); } } else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content, 'utf-8'); } }); }).listen(8000, () => console.log('Server at http://localhost:8000'));"

# Option 2: Python (if available)
python -m http.server 8000

# Option 3: PHP (if available)
php -S localhost:8000
```

Then open: `http://localhost:8000`

---

## 🚀 Deploy to Firebase

```powershell
cd d:\MyApp

# Login (first time only)
firebase login

# Deploy
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only database rules
firebase deploy --only database
```

---

## 📋 Admin Workflow

1. **Login as Admin**

   - URL: `https://mycoaching-mm.web.app`
   - Email: `admin@mycoaching.com`
   - Password: [your admin password]

2. **Add Coaching Centers** (if not already added)

   - Go to "Coaching Centers" tab
   - Click "Add Coaching"
   - Fill details and save

3. **Upload PDFs to Google Drive**

   - Create folder structure in Drive
   - Upload PDFs
   - Get shareable links

4. **Add PDF Metadata**

   - Go to "PDF Management" tab
   - Click "Add PDF"
   - Select coaching, class, subject, type, chapter
   - Enter name and icon
   - Paste Google Drive link
   - Save

5. **Manage Chapters** (optional)

   - Go to "Chapter Management"
   - Select class and subject
   - Edit chapter names
   - Click "Save All Changes"

6. **Backup Database** (recommended weekly)
   - Go to "Import/Export"
   - Click "Download Database (JSON)"
   - Store backup file safely

---

## 👥 Student Workflow

1. **Login**

   - URL: `https://mycoaching-mm.web.app`
   - Email: `student@coaching.com`
   - Password: [student password]

2. **Choose Coaching**

   - Select from available coaching centers

3. **Browse Content**

   - Class → Subject → Test Type → Chapter

4. **View/Download PDFs**
   - Click "View" → Opens in Google Drive viewer
   - Click "Download" → Downloads from Google Drive

---

## 🐛 Common Issues & Fixes

### Issue: "Permission denied" when saving

**Fix:**

- Ensure logged in as admin
- Check email contains "admin" (e.g., `admin@mycoaching.com`)
- Verify database rules are published

### Issue: "Failed to load data"

**Fix:**

- Check internet connection
- Verify Firebase Realtime Database is enabled
- Check `databaseURL` in `firebase-config.js`
- Check browser console for errors (F12)

### Issue: PDFs not redirecting

**Fix:**

- Verify Google Drive link is shareable
- Check link format: `https://drive.google.com/file/d/FILE_ID/view`
- Test link manually in browser

### Issue: Login fails

**Fix:**

- Verify user exists in Firebase Authentication
- Check email/password spelling
- Ensure Email/Password auth is enabled
- Check browser console for specific error

---

## 📊 Monitoring & Maintenance

### Daily:

- Check Firebase Console → Authentication for activity
- Monitor errors in browser console

### Weekly:

- Export database backup
- Review Google Drive usage
- Check for broken Drive links

### Monthly:

- Update chapter names if curriculum changes
- Archive old content
- Review user access

---

## 🎯 Next Steps

After initial setup:

1. ✅ Test login with admin account
2. ✅ Add a coaching center
3. ✅ Upload test PDF to Google Drive
4. ✅ Add PDF metadata through admin panel
5. ✅ Test login with student account
6. ✅ Verify student can access and view PDF
7. ✅ Create backup of database

---

## 📞 Need Help?

1. Check README.md for detailed documentation
2. Review browser console (F12) for errors
3. Check Firebase Console logs
4. Verify all configuration values

---

**Setup Time:** ~15 minutes  
**Status:** ✅ Ready for production
