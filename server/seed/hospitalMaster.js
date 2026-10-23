// ============================================================
// CityCare Hospital - Master Data (PPP Model)
// 200-bed Public-Private Partnership hospital
// ============================================================

const hospitalProfile = {
  name: 'CityCare Hospital',
  type: 'Public-Private Partnership (50% State Govt + 50% CityCare Health Trust)',
  totalBeds: 200,
  address: 'Newtown, Kolkata, West Bengal',
  emergencyPhone: '102 / 108'
};

const shifts = {
  doctorOPD: [
    { name: 'Morning OPD', time: '09:00-13:00' },
    { name: 'Evening OPD', time: '17:00-20:00' },
    { name: 'Lunch Break', time: '13:00-14:00' }
  ],
  emergencyDoctor: [
    { name: 'Shift A', time: '07:00-15:00' },
    { name: 'Shift B', time: '15:00-23:00' },
    { name: 'Shift C (Night)', time: '23:00-07:00' }
  ],
  nurse: [
    { name: 'Morning', time: '07:00-14:00', breaks: '30-min meal + 2x15-min tea' },
    { name: 'Evening', time: '14:00-21:00', breaks: '30-min meal + 2x15-min tea' },
    { name: 'Night', time: '21:00-07:00', breaks: '45-min rest + meal' }
  ],
  receptionist: [
    { name: 'Morning', time: '07:00-14:00' },
    { name: 'Evening', time: '14:00-21:00' },
    { name: 'Night', time: '21:00-07:00' }
  ],
  generalStaff: [
    { name: 'General', time: '09:00-18:00', breaks: 'Lunch 13:00-14:00' }
  ]
};

const departments = [
  { code: 'EMG', name: 'Emergency & Trauma', floor: 'Ground Floor', opdRooms: ['E-01','E-02','E-03'],
    hod: 'Dr. Anirban Chatterjee',
    doctors: [
      { name: 'Dr. Anirban Chatterjee', designation: 'Senior CMO', qualification: 'MBBS, MD (Emergency Medicine)', email: 'anirban.chatterjee@citycare.hospital' },
      { name: 'Dr. Priya Sharma', designation: 'Medical Officer', qualification: 'MBBS', email: 'priya.sharma@citycare.hospital' },
      { name: 'Dr. Rahul Verma', designation: 'Medical Officer', qualification: 'MBBS, MEM', email: 'rahul.verma@citycare.hospital' } ],
    nurses: 6, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    sessions: ['24x7 - 3 rotational shifts'], scheduleNote: 'Doctors rotate 07:00-15:00 / 15:00-23:00 / 23:00-07:00',
    description: '24x7 emergency care, trauma resuscitation, medico-legal cases.' },
  { code: 'MED', name: 'General Medicine', floor: '1st Floor, OPD Block', opdRooms: ['101','102'],
    hod: 'Dr. Subhash Mukherjee',
    doctors: [
      { name: 'Dr. Subhash Mukherjee', designation: 'HOD, Senior Consultant', qualification: 'MBBS, MD (Medicine)', email: 'subhash.mukherjee@citycare.hospital' },
      { name: 'Dr. Kavita Rao', designation: 'Consultant', qualification: 'MBBS, MD (Medicine)', email: 'kavita.rao@citycare.hospital' },
      { name: 'Dr. Amit Das', designation: 'Junior Consultant', qualification: 'MBBS, DNB', email: 'amit.das@citycare.hospital' } ],
    nurses: 3, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['09:00-13:00','17:00-20:00'],
    description: 'Fever, infections, diabetes, hypertension and general adult care.' },
  { code: 'SUR', name: 'General Surgery', floor: '1st Floor, OPD Block', opdRooms: ['103'],
    hod: 'Dr. Vikram Singh',
    doctors: [
      { name: 'Dr. Vikram Singh', designation: 'HOD, Senior Surgeon', qualification: 'MBBS, MS (Surgery)', email: 'vikram.singh@citycare.hospital' },
      { name: 'Dr. Nandini Ghosh', designation: 'Consultant Surgeon', qualification: 'MBBS, MS (Surgery)', email: 'nandini.ghosh@citycare.hospital' } ],
    nurses: 3, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['09:00-13:00','17:00-20:00'], scheduleNote: 'OT: Tue/Thu/Fri 08:00-14:00',
    description: 'Hernia, appendix, gall bladder, minor and major general surgery.' },
  { code: 'ORT', name: 'Orthopedics', floor: '1st Floor, OPD Block', opdRooms: ['104'],
    hod: 'Dr. Rajesh Kumar',
    doctors: [
      { name: 'Dr. Rajesh Kumar', designation: 'Senior Consultant', qualification: 'MBBS, MS (Ortho)', email: 'rajesh.kumar@citycare.hospital' },
      { name: 'Dr. Sneha Patel', designation: 'Consultant', qualification: 'MBBS, DNB (Ortho)', email: 'sneha.patel@citycare.hospital' } ],
    nurses: 2, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['09:00-13:00','17:00-20:00'],
    description: 'Fractures, joint pain, arthritis, spine and sports injuries.' },
  { code: 'PED', name: 'Pediatrics (Baby & Child Care)', floor: '1st Floor, OPD Block', opdRooms: ['105','106'],
    hod: 'Dr. Meera Iyer',
    doctors: [
      { name: 'Dr. Meera Iyer', designation: 'HOD, Senior Pediatrician', qualification: 'MBBS, MD (Pediatrics)', email: 'meera.iyer@citycare.hospital' },
      { name: 'Dr. Sanjay Bose', designation: 'Consultant', qualification: 'MBBS, MD (Pediatrics)', email: 'sanjay.bose@citycare.hospital' },
      { name: 'Dr. Farhana Khan', designation: 'Junior Consultant', qualification: 'MBBS, DCH', email: 'farhana.khan@citycare.hospital' } ],
    nurses: 4, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['09:00-13:00','17:00-20:00'],
    description: 'Newborn to 14 years - vaccination, growth, infections, NICU support.' },
  { code: 'GYN', name: 'Gynecology & Obstetrics (Pregnancy Care)', floor: '1st Floor, OPD Block', opdRooms: ['107','108'],
    hod: 'Dr. Lakshmi Nair',
    doctors: [
      { name: 'Dr. Lakshmi Nair', designation: 'HOD, Senior Consultant', qualification: 'MBBS, MS (OBGY)', email: 'lakshmi.nair@citycare.hospital' },
      { name: 'Dr. Tania Ahmed', designation: 'Consultant', qualification: 'MBBS, DGO', email: 'tania.ahmed@citycare.hospital' },
      { name: 'Dr. Ritu Malhotra', designation: 'Consultant', qualification: 'MBBS, MS (OBGY)', email: 'ritu.malhotra@citycare.hospital' } ],
    nurses: 4, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['09:00-13:00','17:00-20:00'], scheduleNote: 'One doctor always on-call for deliveries (24x7 rotation)',
    description: 'Pregnancy, delivery, C-section, menstrual and hormonal care.' },
  { code: 'DER', name: 'Dermatology (Skin & Hair)', floor: '1st Floor, OPD Block', opdRooms: ['109'],
    hod: 'Dr. Arjun Mehta',
    doctors: [
      { name: 'Dr. Arjun Mehta', designation: 'Consultant Dermatologist', qualification: 'MBBS, MD (Dermatology)', email: 'arjun.mehta@citycare.hospital' },
      { name: 'Dr. Pooja Banerjee', designation: 'Consultant', qualification: 'MBBS, DVD', email: 'pooja.banerjee@citycare.hospital' } ],
    nurses: 1, opdDays: ['Monday','Wednesday','Friday','Saturday'],
    sessions: ['10:00-14:00','17:00-20:00'],
    description: 'Skin allergy, acne, eczema, hair fall, cosmetic dermatology.' },
  { code: 'OPH', name: 'Ophthalmology (Eye Care)', floor: '1st Floor, OPD Block', opdRooms: ['110'],
    hod: 'Dr. Kunal Shah',
    doctors: [
      { name: 'Dr. Kunal Shah', designation: 'Senior Consultant', qualification: 'MBBS, MS (Ophthalmology)', email: 'kunal.shah@citycare.hospital' },
      { name: 'Dr. Divya Menon', designation: 'Consultant', qualification: 'MBBS, DO', email: 'divya.menon@citycare.hospital' } ],
    nurses: 2, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['09:00-13:00','17:00-20:00'], scheduleNote: 'Cataract OT: Wed/Sat 08:00-12:00',
    description: 'Vision testing, cataract, glaucoma, diabetic retina screening.' },
  { code: 'ENTD', name: 'ENT (Ear, Nose & Throat)', floor: '1st Floor, OPD Block', opdRooms: ['111'],
    hod: 'Dr. Suresh Pillai',
    doctors: [
      { name: 'Dr. Suresh Pillai', designation: 'Senior Consultant', qualification: 'MBBS, MS (ENT)', email: 'suresh.pillai@citycare.hospital' },
      { name: 'Dr. Ananya Roy', designation: 'Consultant', qualification: 'MBBS, DLO', email: 'ananya.roy@citycare.hospital' } ],
    nurses: 1, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['Tue/Thu/Sat 10:00-14:00','Mon/Wed/Fri 17:00-20:00'],
    description: 'Hearing loss, sinusitis, tonsils, vertigo, ear infections.' },
  { code: 'CAR', name: 'Cardiology (Heart Care)', floor: '1st Floor, OPD Block', opdRooms: ['112'],
    hod: 'Dr. Manoj Tiwari',
    doctors: [
      { name: 'Dr. Manoj Tiwari', designation: 'Senior Interventional Cardiologist', qualification: 'MBBS, MD, DM (Cardio)', email: 'manoj.tiwari@citycare.hospital' },
      { name: 'Dr. Shreya Kulkarni', designation: 'Consultant', qualification: 'MBBS, MD, DNB (Cardio)', email: 'shreya.kulkarni@citycare.hospital' } ],
    nurses: 3, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['09:00-13:00','17:00-20:00'], scheduleNote: 'Cath lab on standby 24x7 for emergencies',
    description: 'Chest pain, ECG/echo, angiography, heart failure management.' },
  { code: 'NEU', name: 'Neurology (Brain & Nerve)', floor: '1st Floor, OPD Block', opdRooms: ['113'],
    hod: 'Dr. Deepak Joshi',
    doctors: [
      { name: 'Dr. Deepak Joshi', designation: 'Senior Neurologist', qualification: 'MBBS, MD, DM (Neuro)', email: 'deepak.joshi@citycare.hospital' },
      { name: 'Dr. Nisha Reddy', designation: 'Consultant', qualification: 'MBBS, MD (Neuro)', email: 'nisha.reddy@citycare.hospital' } ],
    nurses: 2, opdDays: ['Monday','Tuesday','Thursday','Friday'],
    sessions: ['10:00-14:00'],
    description: 'Stroke, epilepsy, migraine, Parkinson, nerve weakness.' },
  { code: 'NEP', name: 'Nephrology (Kidney Care)', floor: '1st Floor, OPD Block', opdRooms: ['114'],
    hod: 'Dr. Alok Saxena',
    doctors: [
      { name: 'Dr. Alok Saxena', designation: 'Consultant Nephrologist', qualification: 'MBBS, MD, DM (Nephro)', email: 'alok.saxena@citycare.hospital' } ],
    nurses: 2, opdDays: ['Monday','Wednesday','Friday'],
    sessions: ['10:00-14:00'], scheduleNote: 'Dialysis unit (10 beds) runs Mon-Sat 08:00-20:00 in 2 shifts',
    description: 'Kidney failure, dialysis, urinary and stone-related kidney issues.' },
  { code: 'GAS', name: 'Gastroenterology (Liver & Stomach)', floor: '1st Floor, OPD Block', opdRooms: ['115'],
    hod: 'Dr. Rohit Agarwal',
    doctors: [
      { name: 'Dr. Rohit Agarwal', designation: 'Consultant Gastroenterologist', qualification: 'MBBS, MD, DM (Gastro)', email: 'rohit.agarwal@citycare.hospital' } ],
    nurses: 1, opdDays: ['Tuesday','Thursday','Saturday'],
    sessions: ['10:00-14:00'], scheduleNote: 'Endoscopy: Mon/Wed/Fri 09:00-12:00',
    description: 'Liver disease, jaundice, acidity, ulcer, endoscopy.' },
  { code: 'HEM', name: 'Hematology (Blood Disorders)', floor: '1st Floor, OPD Block', opdRooms: ['116'],
    hod: 'Dr. Sunita Desai',
    doctors: [
      { name: 'Dr. Sunita Desai', designation: 'Consultant Hematologist', qualification: 'MBBS, MD, DM (Hemat)', email: 'sunita.desai@citycare.hospital' } ],
    nurses: 1, opdDays: ['Monday','Thursday'],
    sessions: ['10:00-14:00'],
    description: 'Anemia, thalassemia, bleeding/clotting disorders, blood cancers.' },
  { code: 'ANE', name: 'Anesthesiology', floor: '3rd Floor, OT Complex', opdRooms: ['117 (Pre-anesthesia clinic)'],
    hod: 'Dr. Prakash Nair',
    doctors: [
      { name: 'Dr. Prakash Nair', designation: 'HOD, Senior Anesthetist', qualification: 'MBBS, MD (Anesthesia)', email: 'prakash.nair@citycare.hospital' },
      { name: 'Dr. Geeta Rao', designation: 'Consultant', qualification: 'MBBS, DA', email: 'geeta.rao@citycare.hospital' },
      { name: 'Dr. Imran Sheikh', designation: 'Consultant', qualification: 'MBBS, MD (Anesthesia)', email: 'imran.sheikh@citycare.hospital' } ],
    nurses: 2, opdDays: ['Monday','Wednesday','Friday'],
    sessions: ['Pre-anesthesia clinic 10:00-12:00'], scheduleNote: 'OT coverage Mon-Sat 08:00-16:00 + emergency on-call 24x7',
    description: 'Surgical anesthesia, pain management, ICU support.' },
  { code: 'RAD', name: 'Radiology (X-Ray, USG, CT)', floor: 'Ground Floor', opdRooms: ['R-01','R-02'],
    hod: 'Dr. Harish Chandra',
    doctors: [
      { name: 'Dr. Harish Chandra', designation: 'Senior Radiologist', qualification: 'MBBS, MD (Radiology)', email: 'harish.chandra@citycare.hospital' },
      { name: 'Dr. Malini Das', designation: 'Consultant', qualification: 'MBBS, DMRD', email: 'malini.das@citycare.hospital' } ],
    nurses: 1, opdDays: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    sessions: ['08:00-20:00 (reporting)'], scheduleNote: 'X-ray/CT technicians cover 24x7 for emergency',
    description: 'Digital X-ray, ultrasound, CT scan, ECG reporting.' }
];

const receptionists = [
  { name: 'Rina Das', email: 'rina.das@citycare.hospital', shift: 'Morning (07:00-14:00)' },
  { name: 'Suman Ghosh', email: 'suman.ghosh@citycare.hospital', shift: 'Morning (07:00-14:00)' },
  { name: 'Priya Nair', email: 'priya.nair@citycare.hospital', shift: 'Evening (14:00-21:00)' },
  { name: 'Amit Kumar', email: 'amit.kumar@citycare.hospital', shift: 'Evening (14:00-21:00)' },
  { name: 'Sunita Yadav', email: 'sunita.yadav@citycare.hospital', shift: 'Night (21:00-07:00)' },
  { name: '【entity-Karan Singh¦canonical_name=Karan Singh】', email: 'karan.singh@citycare.hospital', shift: 'Night (21:00-07:00)' }
];

const nurseFirstNames = ['Anita','Sunita','Rekha','Meena','Lakshmi','Divya','Kavitha','Shanti','Mala','Usha','Rani','Gita','Radha','Kamala','Asha','Mamta','Poonam','Kiran','Jyoti','Nirmala','Savita','Pushpa','Leela','Maya','Rita','Soma','Srabani','Papiya','Dolly','Chhabi','Bani','Arati','Kalpana','Madhuri','Seema','Babita','Rumi','Mou','Piyali','Sutapa','Anjana','Manika','Debjani','Shipra','Tanusree','Moumita','Sangita','Keya','Rumpa','Dipa'];
const nurseLastNames = ['Das','Ghosh','Banerjee','Mukherjee','Chatterjee','Roy','Sen','Dutta','Nair','Iyer','Sharma','Verma','Yadav','Singh','Patel','Reddy','Khan','Ahmed','Bose','Pal'];

const supportStaff = [
  { role: 'Pharmacist', count: 4, shift: '2 shifts (08:00-20:00)' },
  { role: 'Lab Technician', count: 6, shift: '3 shifts (24x7 lab)' },
  { role: 'Radiology/X-ray Technician', count: 4, shift: '3 shifts (24x7)' },
  { role: 'Ambulance Driver', count: 8, shift: '3 shifts (24x7)' },
  { role: 'Ward Boy / Aya', count: 20, shift: '3 shifts' },
  { role: 'Housekeeping', count: 15, shift: '2 shifts' },
  { role: 'Security Guard', count: 10, shift: '3 shifts (24x7)' },
  { role: 'Admin / HR / Accounts', count: 8, shift: 'General (09:00-18:00)' },
  { role: 'Kitchen / Dietary', count: 6, shift: '2 shifts' },
  { role: 'Maintenance / Electrician / Plumber', count: 4, shift: 'General + on-call' }
];

const ambulances = [
  { vehicleNo: 'WB-11C-1001', type: 'basic', driverName: 'Mohan Das', driverPhone: '9800110001', currentLocation: 'Hospital Main Gate' },
  { vehicleNo: 'WB-11C-1002', type: 'basic', driverName: 'Salim Khan', driverPhone: '9800110002', currentLocation: 'Hospital Main Gate' },
  { vehicleNo: 'WB-11C-1003', type: 'advanced', driverName: 'Raju Yadav', driverPhone: '9800110003', currentLocation: 'Emergency Bay' },
  { vehicleNo: 'WB-11C-1004', type: 'advanced', driverName: 'Bikash Roy', driverPhone: '9800110004', currentLocation: 'Emergency Bay' },
  { vehicleNo: 'WB-11C-1005', type: 'advanced', driverName: 'Tapan Ghosh', driverPhone: '9800110005', currentLocation: 'Hospital Main Gate' },
  { vehicleNo: 'WB-11C-1006', type: 'icu', driverName: 'Nasir Ahmed', driverPhone: '9800110006', currentLocation: 'Emergency Bay (ICU ambulance)' }
];

const facilities = {
  patientToilets: 'Every ward: 2 patient toilets + 1 accessible toilet; OPD block: male/female/disabled toilets on each floor',
  staffToilets: 'Separate staff-only toilets near duty rooms, OT complex and emergency',
  attendantRest: 'Attendant waiting halls on Ground + 2nd + 3rd floor with seating, drinking water and toilets',
  doctorRestRooms: '2 doctors duty rooms (with beds) near Emergency and OT complex',
  nurseRestRooms: '3 nurse rest rooms (Ground, 2nd, 3rd floor)',
  canteen: 'Staff + attendant canteen on Ground Floor (07:00-22:00)',
  pharmacy: '24x7 in-house pharmacy at Ground Floor',
  other: 'Prayer room, medical store, CSSD, laundry, mortuary, parking (100+ cars)'
};

function genBeds() {
  const beds = [];
  const add = (ward, type, rooms, perRoom) => {
    rooms.forEach(rm => {
      for (let i = 1; i <= perRoom; i++) {
        beds.push({ ward, bedNo: rm + '-' + String(i).padStart(2, '0'), type, status: 'available' });
      }
    });
  };
  add('General Male', 'general', ['201','202','203','204','205','206'], 10);
  add('General Female', 'general', ['207','208','209','210','211','212'], 10);
  add('ICU', 'icu', ['301','302'], 10);
  for (let i = 1; i <= 15; i++) beds.push({ ward: 'Emergency', bedNo: 'E-' + String(i).padStart(2,'0'), type: 'general', status: 'available' });
  add('Maternity', 'general', ['311','312','313','314','315'], 5);
  add('Pediatric', 'general', ['321','322','323','324'], 5);
  return beds;
}

module.exports = { hospitalProfile, shifts, departments, receptionists, nurseFirstNames, nurseLastNames, supportStaff, ambulances, facilities, genBeds };
