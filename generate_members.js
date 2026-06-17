const XLSX = require('xlsx');
const fs = require('fs');

// Generate 100 members with SR number and logo
function generateMembers() {
  const members = [];
  
  // Sample member names
  const firstNames = ['Anil', 'Rajesh', 'Vikram', 'Deepak', 'Suresh', 'Ramesh', 'Mahesh', 'Arjun', 
                     'Ajay', 'Nitin', 'Sanjay', 'Pradeep', 'Rohit', 'Ashok', 'Kiran', 'Mohan',
                     'Pankaj', 'Ravi', 'Sandeep', 'Atul', 'Ritesh', 'Harsh', 'Varun', 'Siddharth',
                     'Anish', 'Bhavesh', 'Chintan', 'Darshan', 'Eshan', 'Farhan', 'Girish', 'Harish'];
  
  const lastNames = ['Sharma', 'Patel', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Yadav', 'Reddy',
                    'Khan', 'Desai', 'Chopra', 'Pandey', 'Saxena', 'Joshi', 'Nair', 'Iyer',
                    'Bhat', 'Bhatnagar', 'Dwivedi', 'Trivedi'];
  
  const villages = ['Ahmedabad', 'Vadodara', 'Rajkot', 'Surat', 'Bhavnagar', 'Jamnagar', 
                   'Junagadh', 'Porbandar', 'Morbi', 'Gondal'];
  
  // Generate members
  for (let i = 1; i <= 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const village = villages[Math.floor(Math.random() * villages.length)];
    
    members.push({
      'SR Number': i,
      'Name': `${firstName} ${lastName}`,
      'Village': village,
      'Mobile': '98' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
      'Logo': `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
      'Votes': 0
    });
  }
  
  return members;
}

// Create Excel file
function createExcelFile() {
  const members = generateMembers();
  
  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(members);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Members');
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // SR Number
    { wch: 25 },  // Name
    { wch: 15 },  // Village
    { wch: 15 },  // Mobile
    { wch: 50 },  // Logo
    { wch: 10 }   // Votes
  ];
  
  // Save to file
  const filename = 'members_100.xlsx';
  XLSX.writeFile(wb, filename);
  console.log(`✅ Excel file created: ${filename}`);
  console.log(`📋 Total members: 100`);
  console.log(`📍 Location: /workspaces/svit-election/${filename}`);
}

createExcelFile();
