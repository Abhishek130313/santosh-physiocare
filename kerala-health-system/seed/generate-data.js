const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Kerala districts and taluks
const keralaData = {
  districts: [
    { name: 'Thiruvananthapuram', taluks: ['Thiruvananthapuram', 'Chirayinkeezhu', 'Neyyattinkara', 'Nedumangad'] },
    { name: 'Kollam', taluks: ['Kollam', 'Karunagappally', 'Kunnathur', 'Kottarakkara', 'Punalur'] },
    { name: 'Pathanamthitta', taluks: ['Adoor', 'Kozhencherry', 'Ranni', 'Mallappally', 'Thiruvalla'] },
    { name: 'Alappuzha', taluks: ['Alappuzha', 'Cherthala', 'Ambalappuzha', 'Kuttanad', 'Karthikappally', 'Chengannur'] },
    { name: 'Kottayam', taluks: ['Kottayam', 'Vaikom', 'Meenachil', 'Changanassery', 'Kanjirappally'] },
    { name: 'Idukki', taluks: ['Devikulam', 'Udumbanchola', 'Thodupuzha', 'Idukki', 'Peerumade'] },
    { name: 'Ernakulam', taluks: ['Ernakulam', 'Kanayannur', 'Aluva', 'Kunnathunad', 'Muvattupuzha', 'Kothamangalam', 'North Paravur'] },
    { name: 'Thrissur', taluks: ['Thrissur', 'Mukundapuram', 'Chalakudy', 'Thalappilly', 'Chavakkad', 'Kodungallur', 'Irinjalakuda'] },
    { name: 'Palakkad', taluks: ['Palakkad', 'Chittur', 'Alathur', 'Ottappalam', 'Mannarkkad', 'Pattambi'] },
    { name: 'Malappuram', taluks: ['Malappuram', 'Manjeri', 'Kondotty', 'Perinthalmanna', 'Ponnani', 'Tirur', 'Tirurangadi'] },
    { name: 'Kozhikode', taluks: ['Kozhikode', 'Vatakara', 'Koyilandy', 'Thamarassery'] },
    { name: 'Wayanad', taluks: ['Mananthavady', 'Sulthan Bathery', 'Vythiri'] },
    { name: 'Kannur', taluks: ['Kannur', 'Thalassery', 'Iritty', 'Taliparamba', 'Payyanur'] },
    { name: 'Kasaragod', taluks: ['Kasaragod', 'Hosdurg', 'Vellarikundu'] }
  ]
};

// Indian states for migrant origin
const indianStates = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal'
];

// Sample names in different languages
const names = {
  malayalam: {
    male: ['രാജു', 'സുരേഷ്', 'രമേഷ്', 'അനിൽ', 'വിനോദ്', 'പ്രകാശ്', 'രാജേഷ്', 'മനോജ്', 'സുനിൽ', 'രാജൻ'],
    female: ['സുനിത', 'പ്രിയ', 'രേഖ', 'ഗീത', 'ലത', 'മീര', 'രാധ', 'ഷീല', 'ഉമ', 'വിദ്യ'],
    surnames: ['കുമാർ', 'നായർ', 'മേനോൻ', 'പിള്ള', 'ദാസ്', 'വർമ്മ', 'ശർമ്മ', 'രാജ്', 'ബാബു', 'കൃഷ്ണൻ']
  },
  hindi: {
    male: ['राजू', 'सुरेश', 'रमेश', 'अनिल', 'विनोद', 'प्रकाश', 'राजेश', 'मनोज', 'सुनील', 'राजन'],
    female: ['सुनीता', 'प्रिया', 'रेखा', 'गीता', 'लता', 'मीरा', 'राधा', 'शीला', 'उमा', 'विद्या'],
    surnames: ['कुमार', 'शर्मा', 'वर्मा', 'गुप्ता', 'अग्रवाल', 'जैन', 'बंसल', 'माथुर', 'तिवारी', 'मिश्रा']
  },
  english: {
    male: ['Raju', 'Suresh', 'Ramesh', 'Anil', 'Vinod', 'Prakash', 'Rajesh', 'Manoj', 'Sunil', 'Rajan'],
    female: ['Sunita', 'Priya', 'Rekha', 'Geeta', 'Lata', 'Meera', 'Radha', 'Sheila', 'Uma', 'Vidya'],
    surnames: ['Kumar', 'Sharma', 'Verma', 'Gupta', 'Agarwal', 'Jain', 'Bansal', 'Mathur', 'Tiwari', 'Mishra']
  }
};

// Work sites common in Kerala
const workSites = [
  'Kochi Metro Construction Phase 2',
  'Trivandrum IT Park Development',
  'Ernakulam Smart City Project',
  'Kozhikode Port Expansion',
  'Thrissur Cultural Centre Construction',
  'Alappuzha Tourism Infrastructure',
  'Kannur Airport Expansion',
  'Palakkad Railway Station Modernization',
  'Kollam Shipyard',
  'Idukki Hydroelectric Project',
  'Wayanad Resort Construction',
  'Malappuram Industrial Park',
  'Pathanamthitta Road Development',
  'Kasaragod Fishing Harbor',
  'Private Residential Complex - Kochi',
  'Commercial Building - Trivandrum',
  'Hospital Construction - Thrissur',
  'School Building - Kozhikode',
  'Shopping Mall - Ernakulam',
  'Hotel Construction - Munnar'
];

// Medical conditions and symptoms
const medicalConditions = [
  { code: 'R50', display: 'Fever', category: 'symptom' },
  { code: 'R05', display: 'Cough', category: 'symptom' },
  { code: 'R06.2', display: 'Wheezing', category: 'symptom' },
  { code: 'R51', display: 'Headache', category: 'symptom' },
  { code: 'K59.1', display: 'Diarrhea', category: 'symptom' },
  { code: 'R11', display: 'Nausea and vomiting', category: 'symptom' },
  { code: 'M79.3', display: 'Body ache', category: 'symptom' },
  { code: 'J00', display: 'Common cold', category: 'diagnosis' },
  { code: 'A09', display: 'Gastroenteritis', category: 'diagnosis' },
  { code: 'J06.9', display: 'Upper respiratory tract infection', category: 'diagnosis' },
  { code: 'M25.50', display: 'Joint pain', category: 'symptom' },
  { code: 'R50.9', display: 'Fever unspecified', category: 'symptom' }
];

// Vaccination data
const vaccines = [
  { code: '03', name: 'MMR', manufacturer: 'Serum Institute' },
  { code: '08', name: 'Hepatitis B', manufacturer: 'Bharat Biotech' },
  { code: '20', name: 'DPT', manufacturer: 'Serum Institute' },
  { code: '21', name: 'Varicella', manufacturer: 'GSK' },
  { code: '113', name: 'Td', manufacturer: 'Serum Institute' },
  { code: '207', name: 'COVID-19 Covishield', manufacturer: 'Serum Institute' },
  { code: '208', name: 'COVID-19 Covaxin', manufacturer: 'Bharat Biotech' },
  { code: '212', name: 'COVID-19 Sputnik V', manufacturer: 'Dr. Reddys' }
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhoneNumber() {
  const prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89'];
  const prefix = randomChoice(prefixes);
  const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `+91${prefix}${number}`;
}

function generateABHAId() {
  const part1 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${part1}-${part2}-${part3}-${part4}`;
}

function generateStateId(district) {
  const districtCode = district.substring(0, 2).toUpperCase();
  const number = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return `KL${districtCode}${number}`;
}

function generateQRCode() {
  return `KH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// Generate patients
function generatePatients(count) {
  const patients = [];
  const usedPhones = new Set();
  const usedABHAIds = new Set();
  
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.6 ? 'MALE' : 'FEMALE';
    const language = randomChoice(['malayalam', 'hindi', 'english']);
    const nameSet = names[language];
    
    const firstName = randomChoice(gender === 'MALE' ? nameSet.male : nameSet.female);
    const lastName = randomChoice(nameSet.surnames);
    
    const district = randomChoice(keralaData.districts);
    const taluk = randomChoice(district.taluks);
    const originState = randomChoice(indianStates);
    
    // Generate unique phone and ABHA ID
    let phone, abhaId;
    do {
      phone = generatePhoneNumber();
    } while (usedPhones.has(phone));
    usedPhones.add(phone);
    
    // 80% of patients have ABHA ID
    if (Math.random() > 0.2) {
      do {
        abhaId = generateABHAId();
      } while (usedABHAIds.has(abhaId));
      usedABHAIds.add(abhaId);
    }
    
    const birthDate = randomDate(new Date(1970, 0, 1), new Date(2005, 11, 31));
    const age = new Date().getFullYear() - birthDate.getFullYear();
    
    const patient = {
      id: crypto.randomUUID(),
      firstName,
      lastName,
      gender,
      birthDate: birthDate.toISOString().split('T')[0],
      phone,
      email: Math.random() > 0.7 ? `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}@gmail.com` : null,
      abhaId,
      stateId: generateStateId(district.name),
      addressLine1: `House ${Math.floor(Math.random() * 999) + 1}`,
      addressLine2: `${randomChoice(['Main Road', 'Temple Road', 'Market Street', 'Station Road', 'Beach Road'])}`,
      district: district.name,
      taluk,
      village: `${taluk} ${randomChoice(['East', 'West', 'North', 'South', 'Central'])}`,
      pincode: Math.floor(Math.random() * 900000 + 600000).toString(),
      state: 'Kerala',
      country: 'India',
      originState,
      originDistrict: `${originState} District ${Math.floor(Math.random() * 10) + 1}`,
      workSite: randomChoice(workSites),
      employerName: `${randomChoice(['M/s', 'Sri', 'Smt'])} ${randomChoice(['Constructions', 'Builders', 'Contractors', 'Engineers', 'Developers'])} ${randomChoice(['Pvt Ltd', 'Co', 'Associates', 'Group'])}`,
      employerContact: generatePhoneNumber(),
      preferredLanguage: language === 'malayalam' ? 'ml' : language === 'hindi' ? 'hi' : 'en',
      emergencyName: Math.random() > 0.3 ? `${randomChoice(nameSet.male)} ${randomChoice(nameSet.surnames)}` : null,
      emergencyPhone: Math.random() > 0.3 ? generatePhoneNumber() : null,
      emergencyRelation: Math.random() > 0.3 ? randomChoice(['Brother', 'Father', 'Mother', 'Sister', 'Friend', 'Colleague']) : null,
      qrCode: generateQRCode(),
      cardIssued: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
      cardExpiry: new Date(Date.now() + (365 * 2 * 24 * 60 * 60 * 1000)).toISOString(), // 2 years from now
      createdAt: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    patients.push(patient);
  }
  
  return patients;
}

// Generate encounters
function generateEncounters(patients, count) {
  const encounters = [];
  
  for (let i = 0; i < count; i++) {
    const patient = randomChoice(patients);
    const startTime = randomDate(new Date(2023, 0, 1), new Date());
    const endTime = new Date(startTime.getTime() + (Math.random() * 2 + 0.5) * 60 * 60 * 1000); // 30min to 2.5 hours
    
    const condition = randomChoice(medicalConditions);
    
    const encounter = {
      id: crypto.randomUUID(),
      status: randomChoice(['FINISHED', 'FINISHED', 'FINISHED', 'IN_PROGRESS', 'CANCELLED']),
      class: randomChoice(['OUTPATIENT', 'OUTPATIENT', 'OUTPATIENT', 'EMERGENCY', 'HOME_HEALTH']),
      type: randomChoice(['General Consultation', 'Follow-up', 'Health Checkup', 'Emergency Visit']),
      priority: randomChoice(['routine', 'routine', 'urgent', 'emergency']),
      chiefComplaint: condition.display,
      diagnosis: condition.category === 'diagnosis' ? condition.display : `Suspected ${condition.display}`,
      treatment: `Treatment provided for ${condition.display}`,
      notes: `Patient presented with ${condition.display}. Vital signs stable. Advised rest and medication.`,
      facility: `${randomChoice(['Primary Health Centre', 'Community Health Centre', 'District Hospital', 'Medical College'])} - ${patient.district}`,
      department: randomChoice(['General Medicine', 'Emergency', 'Outpatient', 'Family Medicine']),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      patientId: patient.id,
      clinicianId: null, // Will be filled with actual user IDs later
      createdAt: startTime.toISOString(),
      updatedAt: startTime.toISOString()
    };
    
    encounters.push(encounter);
  }
  
  return encounters;
}

// Generate observations
function generateObservations(encounters) {
  const observations = [];
  
  encounters.forEach(encounter => {
    // Generate 2-5 observations per encounter
    const obsCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < obsCount; i++) {
      const obsType = randomChoice([
        { code: '8310-5', display: 'Body temperature', unit: 'Cel', min: 36, max: 42 },
        { code: '8462-4', display: 'Diastolic blood pressure', unit: 'mmHg', min: 60, max: 100 },
        { code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg', min: 90, max: 180 },
        { code: '8867-4', display: 'Heart rate', unit: '/min', min: 60, max: 120 },
        { code: '9279-1', display: 'Respiratory rate', unit: '/min', min: 12, max: 30 },
        { code: '29463-7', display: 'Body weight', unit: 'kg', min: 40, max: 120 },
        { code: '8302-2', display: 'Body height', unit: 'cm', min: 140, max: 190 }
      ]);
      
      const observation = {
        id: crypto.randomUUID(),
        status: 'FINAL',
        category: 'vital-signs',
        code: obsType.code,
        display: obsType.display,
        valueNumber: Math.round((Math.random() * (obsType.max - obsType.min) + obsType.min) * 10) / 10,
        unit: obsType.unit,
        referenceRangeHigh: obsType.max,
        referenceRangeLow: obsType.min,
        interpretation: null,
        notes: null,
        effectiveDateTime: encounter.startTime,
        encounterId: encounter.id,
        createdAt: encounter.startTime,
        updatedAt: encounter.startTime
      };
      
      observations.push(observation);
    }
  });
  
  return observations;
}

// Generate immunizations
function generateImmunizations(patients, count) {
  const immunizations = [];
  
  for (let i = 0; i < count; i++) {
    const patient = randomChoice(patients);
    const vaccine = randomChoice(vaccines);
    const occurrenceDate = randomDate(new Date(2020, 0, 1), new Date());
    
    const immunization = {
      id: crypto.randomUUID(),
      status: 'COMPLETED',
      vaccineCode: vaccine.code,
      vaccineName: vaccine.name,
      manufacturer: vaccine.manufacturer,
      lotNumber: `LOT${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      expirationDate: new Date(occurrenceDate.getTime() + (365 * 2 * 24 * 60 * 60 * 1000)).toISOString(),
      doseNumber: Math.floor(Math.random() * 3) + 1,
      seriesDoses: vaccine.name.includes('COVID') ? 2 : Math.floor(Math.random() * 3) + 1,
      site: randomChoice(['Left arm', 'Right arm', 'Left thigh', 'Right thigh']),
      route: randomChoice(['Intramuscular', 'Subcutaneous', 'Oral']),
      occurrenceDateTime: occurrenceDate.toISOString(),
      performer: `Dr. ${randomChoice(names.english.male)} ${randomChoice(names.english.surnames)}`,
      facility: `Vaccination Centre - ${patient.district}`,
      patientId: patient.id,
      createdAt: occurrenceDate.toISOString(),
      updatedAt: occurrenceDate.toISOString()
    };
    
    immunizations.push(immunization);
  }
  
  return immunizations;
}

// Generate users (clinicians, admin, etc.)
function generateUsers() {
  const bcrypt = require('bcryptjs');
  const users = [];
  
  // Admin user
  users.push({
    id: crypto.randomUUID(),
    email: 'admin@kerala.gov.in',
    password: bcrypt.hashSync('Admin@123', 12),
    role: 'ADMIN',
    firstName: 'System',
    lastName: 'Administrator',
    licenseNumber: null,
    facility: 'Kerala Health Department',
    department: 'Administration',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: null
  });
  
  // Generate clinicians for each district
  keralaData.districts.forEach(district => {
    const clinician = {
      id: crypto.randomUUID(),
      email: `doctor.${district.name.toLowerCase().replace(/\s+/g, '')}@kerala.gov.in`,
      password: bcrypt.hashSync('Doctor@123', 12),
      role: 'CLINICIAN',
      firstName: `Dr. ${randomChoice(names.english.male)}`,
      lastName: randomChoice(names.english.surnames),
      licenseNumber: `KMC${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
      facility: `District Hospital - ${district.name}`,
      department: 'General Medicine',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null
    };
    
    users.push(clinician);
  });
  
  // Public health officer
  users.push({
    id: crypto.randomUUID(),
    email: 'publichealth@kerala.gov.in',
    password: bcrypt.hashSync('Health@123', 12),
    role: 'PUBLIC_HEALTH',
    firstName: 'Public Health',
    lastName: 'Officer',
    licenseNumber: null,
    facility: 'Kerala Health Department',
    department: 'Public Health',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: null
  });
  
  // Kiosk users
  for (let i = 0; i < 5; i++) {
    users.push({
      id: crypto.randomUUID(),
      email: `kiosk${i + 1}@kerala.gov.in`,
      password: bcrypt.hashSync('Kiosk@123', 12),
      role: 'KIOSK',
      firstName: `Kiosk`,
      lastName: `Operator ${i + 1}`,
      licenseNumber: null,
      facility: `Health Kiosk ${i + 1}`,
      department: 'Registration',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null
    });
  }
  
  return users;
}

// Main generation function
function generateAllData() {
  console.log('Generating sample data for Kerala Health System...');
  
  const patients = generatePatients(2500);
  console.log(`Generated ${patients.length} patients`);
  
  const encounters = generateEncounters(patients, 3500);
  console.log(`Generated ${encounters.length} encounters`);
  
  const observations = generateObservations(encounters);
  console.log(`Generated ${observations.length} observations`);
  
  const immunizations = generateImmunizations(patients, 1800);
  console.log(`Generated ${immunizations.length} immunizations`);
  
  const users = generateUsers();
  console.log(`Generated ${users.length} users`);
  
  // Create output directory
  const outputDir = path.join(__dirname, 'generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write data files
  fs.writeFileSync(
    path.join(outputDir, 'patients.json'),
    JSON.stringify(patients, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'encounters.json'),
    JSON.stringify(encounters, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'observations.json'),
    JSON.stringify(observations, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'immunizations.json'),
    JSON.stringify(immunizations, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'users.json'),
    JSON.stringify(users, null, 2)
  );
  
  // Generate summary
  const summary = {
    generatedAt: new Date().toISOString(),
    totalPatients: patients.length,
    totalEncounters: encounters.length,
    totalObservations: observations.length,
    totalImmunizations: immunizations.length,
    totalUsers: users.length,
    districts: keralaData.districts.length,
    patientsByDistrict: {},
    patientsByGender: {},
    patientsByOriginState: {},
    encountersByStatus: {},
    vaccinationsByType: {}
  };
  
  // Calculate statistics
  patients.forEach(patient => {
    summary.patientsByDistrict[patient.district] = (summary.patientsByDistrict[patient.district] || 0) + 1;
    summary.patientsByGender[patient.gender] = (summary.patientsByGender[patient.gender] || 0) + 1;
    summary.patientsByOriginState[patient.originState] = (summary.patientsByOriginState[patient.originState] || 0) + 1;
  });
  
  encounters.forEach(encounter => {
    summary.encountersByStatus[encounter.status] = (summary.encountersByStatus[encounter.status] || 0) + 1;
  });
  
  immunizations.forEach(immunization => {
    summary.vaccinationsByType[immunization.vaccineName] = (summary.vaccinationsByType[immunization.vaccineName] || 0) + 1;
  });
  
  fs.writeFileSync(
    path.join(outputDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\nData generation complete!');
  console.log(`Files saved to: ${outputDir}`);
  console.log('\nSummary:');
  console.log(`- Patients: ${summary.totalPatients}`);
  console.log(`- Encounters: ${summary.totalEncounters}`);
  console.log(`- Observations: ${summary.totalObservations}`);
  console.log(`- Immunizations: ${summary.totalImmunizations}`);
  console.log(`- Users: ${summary.totalUsers}`);
  console.log(`- Districts covered: ${Object.keys(summary.patientsByDistrict).length}`);
  
  return summary;
}

// Run if called directly
if (require.main === module) {
  generateAllData();
}

module.exports = {
  generateAllData,
  generatePatients,
  generateEncounters,
  generateObservations,
  generateImmunizations,
  generateUsers
};