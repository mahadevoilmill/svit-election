# 100 Members Setup - Instructions

## What's been created:

### 1. **members_100.xlsx** - Excel File with 100 Members
   - Contains 100 members with complete data
   - Columns: SR Number, Name, Village, Mobile, Logo URL, Votes
   - Each member has a unique serial number (1-100)
   - Each member has a unique avatar logo URL

### 2. **generate_members.js** - Generate Excel File Script
   - Creates a new Excel file with 100 members
   - Usage: `node generate_members.js`

### 3. **insert_members.js** - Direct Database Insert Script
   - Directly inserts 100 members into Supabase database
   - Usage: `node insert_members.js`

### 4. **Updated server.js**
   - Now handles SR Number and Logo fields
   - Automatically stores these fields when Excel is uploaded

---

## How to Add 100 Members:

### Option 1: Upload via Excel (Recommended for Web UI)
 1. Start the server: `npm start`
 2. Open deshboard: Go to http://localhost:5000
 3. Upload the file: `members_100.xlsx`
4. All 100 members will be added to the database

### Option 2: Direct Database Insert (Fastest)
1. Run: `node insert_members.js`
2. Wait for confirmation message
3. All 100 members will be directly inserted into Supabase

---

## Member Details:

- **SR Number**: 1 to 100 (unique identifier)
- **Name**: Random member names (first name + last name)
- **Village**: Gujarati village names
- **Mobile**: Generated phone numbers
- **Logo**: Avatar URLs from UI Avatars API (https://ui-avatars.com)
- **Votes**: Initially set to 0

---

## File Locations:
- Excel: `/workspaces/svit-election/members_100.xlsx`
- Generate Script: `/workspaces/svit-election/generate_members.js`
- Insert Script: `/workspaces/svit-election/insert_members.js`
- Server: `/workspaces/svit-election/server.js` (updated)

---

## Next Steps:
✅ Members are ready to use
✅ You can now start voting with these 100 members
✅ Each member has a unique logo for identification
