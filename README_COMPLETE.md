# SVIT Election - Vote Management System

## ✨ Features Implemented

### 1. **Professional Login Page** (`public/index.html`)
- Modern gradient design with smooth animations
- Password input with show/hide toggle
- Real-time password validation
- Error message display with animations
- Responsive design for all devices
- Enter key support for quick login

**Password:** `sardar123`

### 2. **Enhanced Deshboard** (`public/deshboard.html`)
- Display all 100 members with avatars/logos
- Real-time member statistics (Total Members, Total Votes)
- Search functionality to find members by name
- Filter options:
  - ✅ All members
  - ✅ Voted members
  - ✅ Not voted members
- Vote casting with instant updates
- Responsive grid layout
- Toast notifications for feedback
- Logout functionality

### 3. **Member Data**
Each member includes:
- **SR Number** (1-100) - Unique identifier
- **Name** - Full member name
- **Village** - Location
- **Mobile** - Phone number
- **Logo** - Avatar from ui-avatars.com API
- **Votes** - Vote count (updated in real-time)

### 4. **Backend API Endpoints**

#### Authentication
```
POST /login
Body: { "password": "sardar123" }
Response: { "success": true }
```

#### Get All Members
```
GET /votes
Response: Array of member objects with all details
```

#### Cast Vote
```
POST /votes/:id/vote
Response: { "success": true, "message": "Vote recorded", "data": {...} }
```

#### Upload Excel File
```
POST /upload-excel (multipart/form-data with file)
Uploads Excel file and imports members to database
```

---

## 🚀 How to Use

### Starting the Server
```bash
npm start
# Server runs on http://localhost:5000
```

### Accessing the Application
1. Open browser to: **http://localhost:5000**
2. You'll see the professional login page
3. Enter password: **sardar123**
4. Click Login or press Enter
 5. View the deshboard with all 100 members

### Adding Members
Two options:

**Option 1: Upload Excel File** (via deshboard)
- Use the existing `members_100.xlsx` file
- File is located: `/workspaces/svit-election/members_100.xlsx`

**Option 2: Direct Database Insert**
```bash
node insert_members.js
# This directly inserts 100 members into Supabase
```

### Manual Vote Casting
**Option 3: Manual Vote Casting** (via dedicated manual vote page)
- Access: **http://localhost:5000/manual-vote.html**
- Cast votes by entering SR numbers manually
- Supports both single vote casting and bulk vote updates
- View and update vote counts for any member

**Features:**
- ✅ Cast vote by SR number (single vote)
- ✅ Bulk upload Excel files with vote updates
- ✅ View member details before voting
- ✅ Increment vote counts manually
- ✅ Save updated vote counts
- ✅ Navigate between single and bulk modes

### Voting
1. Click "Cast Vote" button on any member card
2. Vote count updates automatically
3. Toast notification confirms vote was recorded
4. Filter by "Voted" to see members who have received votes

---

## 📁 Files Created/Modified

### New Files
- ✅ `public/index.html` - Professional login page
- ✅ `public/deshboard.html` - Enhanced deshboard with member display
- ✅ `members_100.xlsx` - 100 members with data
- ✅ `generate_members.js` - Script to generate member Excel files
- ✅ `insert_members.js` - Script to insert members to database
- ✅ `MEMBERS_SETUP.md` - Member setup instructions

### Modified Files
- ✅ `server.js` - Added voting endpoint and SR Number/Logo support

---

## 🎨 UI/UX Features

### Login Page
- Gradient purple background
- Smooth animations
- Password visibility toggle
- Real-time validation feedback
- Mobile responsive

### Dashboard
- Modern card layout grid
- Member avatars with fallback
- Color-coded vote counts
- Quick filter buttons
- Search bar with real-time filtering
- Statistics header with total counts
- Responsive design (works on phones, tablets, desktops)
- Toast notifications

---

## 🔐 Security

- Password-protected login
- Session management with page-based access
- Form validation on frontend
- Backend endpoint validation

---

## 📊 Database Structure

Each member record contains:
```javascript
{
  id: number,           // Auto-generated ID
  sr_number: number,    // Serial number (1-100)
  voter_name: string,   // Member name
  village: string,      // Village/location
  mobile: string,       // Phone number
  logo: string,         // Avatar URL
  total_votes: number   // Vote count
}
```

---

## 🔗 External APIs Used

- **UI Avatars** - For generating member avatars
  - Format: `https://ui-avatars.com/api/?name={name}&background=random`

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** Supabase (PostgreSQL)
- **Styling:** Bootstrap 5, Custom CSS
- **UI Framework:** Font Awesome Icons

---

## ⚙️ Environment Variables

Required in `.env` file:
```
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_KEY=your_public_key
```

---

## 📱 Responsive Breakpoints

- Desktop: Full grid (3+ columns)
- Tablet: 2-3 columns
- Mobile: 1-2 columns

---

## ✅ Testing Checklist

- [x] Login with password: `sardar123`
- [x] View all 100 members on deshboard
- [x] Search for members by name
- [x] Filter members (All, Voted, Not Voted)
- [x] Cast vote on any member
- [x] See vote count update in real-time
- [x] View total votes and member statistics
- [x] Logout and return to login page
- [x] Test on different screen sizes
- [x] Test error handling

---

## 🎯 Next Steps

Optional enhancements you could add:
1. Add export to Excel functionality
2. Add vote report/statistics page
3. Add candidate/position management
4. Add vote history logging
5. Add barcode/QR code scanning
6. Add live results display
7. Add email notifications

---

## 📞 Support

For issues or questions:
1. Check the console for error messages (F12)
2. Verify Supabase connection in .env file
3. Ensure port 5000 is available
4. Check that 100 members have been inserted into the database

**Server Address:** http://localhost:5000
**Password:** sardar123
