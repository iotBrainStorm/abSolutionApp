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
    ".read": "auth != null",
    ".write": false,

    "coaching-centers": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.email.includes('admin')"
    },

    "pdfs": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.email.includes('admin')"
    },

    "chapters": {
      ".read": "auth != null",
      ".write": "auth != null && auth.token.email.includes('admin')"
    }
  }
}
```

Click **"Publish"**

### 3. Add Database URL to Config

1. In Realtime Database page, copy the **Database URL**

   - Should look like: `https://mycoaching-mm-default-rtdb.firebaseio.com`

2. Open `src/js/firebase-config.js`

3. Ensure `databaseURL` is set:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBlYZBktMwAPnplMiC6jIy5kc2zw5bMTO0",
  authDomain: "mycoaching-mm.firebaseapp.com",
  databaseURL: "https://mycoaching-mm-default-rtdb.firebaseio.com", // ✅ This line
  projectId: "mycoaching-mm",
  storageBucket: "mycoaching-mm.firebasestorage.app",
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
  "coaching-centers": {
    "coaching-1": {
      "id": "coaching-1",
      "name": "Excellence Coaching",
      "icon": "🎓",
      "description": "Premier coaching for Classes 9-10"
    },
    "coaching-2": {
      "id": "coaching-2",
      "name": "NEET Academy",
      "icon": "🏥",
      "description": "Specialized NEET preparation"
    },
    "coaching-3": {
      "id": "coaching-3",
      "name": "JEE Institute",
      "icon": "⚡",
      "description": "Top JEE coaching center"
    }
  },
  "chapters": {
    "class-9": {
      "mathematics": {
        "0": "Introduction",
        "1": "Number Systems",
        "2": "Polynomials",
        "3": "Linear Equations",
        "4": "Coordinate Geometry"
      },
      "physics": {
        "0": "Introduction",
        "1": "Motion",
        "2": "Force and Laws of Motion",
        "3": "Gravitation"
      }
    }
  },
  "pdfs": {
    "coaching-1": {
      "class-9": {
        "mathematics": {
          "mock-test": {
            "1": [
              {
                "name": "Polynomials Practice Test",
                "icon": "📄",
                "driveLink": "https://drive.google.com/file/d/YOUR_FILE_ID/view"
              }
            ]
          }
        }
      }
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
