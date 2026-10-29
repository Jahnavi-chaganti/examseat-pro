import { AcademicYear, Department, ExamHall, ExamSchedule, Student } from '../types';

export const BRANCH_CODES: { dept: Department; code: string; short: string }[] = [
  { dept: 'Computer Science & Engineering', code: '05', short: 'CSE' },
  { dept: 'Electronics & Communication Engineering', code: '04', short: 'ECE' },
  { dept: 'Electrical & Electronics Engineering', code: '02', short: 'EEE' },
  { dept: 'Mechanical Engineering', code: '03', short: 'MECH' },
  { dept: 'Civil Engineering', code: '01', short: 'CIVIL' },
  { dept: 'Information Technology', code: '12', short: 'IT' },
  { dept: 'Artificial Intelligence & Machine Learning', code: '42', short: 'AIML' },
  { dept: 'Artificial Intelligence & Data Science', code: '54', short: 'AIDS' },
  { dept: 'CSE (Data Science)', code: '67', short: 'CSE-DS' },
  { dept: 'Data Science', code: '44', short: 'DS' },
];

export const SEMESTER_LABELS: Record<number, { sem: number; year: AcademicYear; label: string }> = {
  1: { sem: 1, year: 1, label: '1-1 (I B.Tech I Semester)' },
  2: { sem: 2, year: 1, label: '1-2 (I B.Tech II Semester)' },
  3: { sem: 3, year: 2, label: '2-1 (II B.Tech I Semester)' },
  4: { sem: 4, year: 2, label: '2-2 (II B.Tech II Semester)' },
  5: { sem: 5, year: 3, label: '3-1 (III B.Tech I Semester)' },
  6: { sem: 6, year: 3, label: '3-2 (III B.Tech II Semester)' },
  7: { sem: 7, year: 4, label: '4-1 (IV B.Tech I Semester)' },
  8: { sem: 8, year: 4, label: '4-2 (IV B.Tech II Semester)' },
};

// Pragati Engineering College Campus Halls (Surampalem)
export const INITIAL_HALLS: ExamHall[] = [
  // Aryabhata Block (CSE & IT)
  {
    id: 'hall-101',
    code: 'AB-101',
    name: 'Srinivasa Ramanujan Hall',
    building: 'Aryabhata Block (Pragati Campus)',
    floor: '1st Floor',
    rows: 7,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: ['R1-C6-A'], // Door clearance
    invigilatorName: 'Dr. G. Satyanarayana',
    invigilatorDept: 'Computer Science & Engineering',
  },
  {
    id: 'hall-102',
    code: 'AB-102',
    name: 'Alan Turing Seminar Theatre',
    building: 'Aryabhata Block (Pragati Campus)',
    floor: '1st Floor',
    rows: 8,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: ['R4-C3-A'], // Pillar obstruction
    invigilatorName: 'Prof. Ch. Lakshmi',
    invigilatorDept: 'Information Technology',
  },
  {
    id: 'hall-201',
    code: 'AB-201',
    name: 'Ada Lovelace Computing Complex',
    building: 'Aryabhata Block (Pragati Campus)',
    floor: '2nd Floor',
    rows: 8,
    columns: 7,
    desksPerBench: 1,
    blockedSeats: [],
    invigilatorName: 'Dr. M. Radhika',
    invigilatorDept: 'Artificial Intelligence & Machine Learning',
  },

  // Dr. APJ Abdul Kalam Block (ECE & EEE)
  {
    id: 'hall-kalam-1',
    code: 'KB-101',
    name: 'Vikram Sarabhai Hall',
    building: 'Dr. APJ Abdul Kalam Block',
    floor: '1st Floor',
    rows: 8,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: ['R8-C6-A'],
    invigilatorName: 'Dr. K. Srinivas Rao',
    invigilatorDept: 'Electronics & Communication Engineering',
  },
  {
    id: 'hall-kalam-2',
    code: 'KB-201',
    name: 'Michael Faraday Lecture Theatre',
    building: 'Dr. APJ Abdul Kalam Block',
    floor: '2nd Floor',
    rows: 8,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: [],
    invigilatorName: 'Dr. P. V. Ramana',
    invigilatorDept: 'Electrical & Electronics Engineering',
  },
  {
    id: 'hall-kalam-3',
    code: 'KB-202',
    name: 'C. V. Raman Auditorium',
    building: 'Dr. APJ Abdul Kalam Block',
    floor: '2nd Floor',
    rows: 9,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: ['R2-C1-A'],
    invigilatorName: 'Dr. B. V. S. Murthy',
    invigilatorDept: 'Electronics & Communication Engineering',
  },

  // Sir M. Visvesvaraya Block (Mechanical & Civil)
  {
    id: 'hall-mv-1',
    code: 'VB-101',
    name: 'Sir M. Visvesvaraya Hall',
    building: 'Visvesvaraya Mechanical Block',
    floor: 'Ground Floor',
    rows: 8,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: [],
    invigilatorName: 'Dr. N. Sudhakar',
    invigilatorDept: 'Mechanical Engineering',
  },
  {
    id: 'hall-mv-2',
    code: 'VB-102',
    name: 'E. Sreedharan Structural Theatre',
    building: 'Visvesvaraya Civil Block',
    floor: '1st Floor',
    rows: 8,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: ['R8-C1-A'],
    invigilatorName: 'Dr. V. Prasad',
    invigilatorDept: 'Civil Engineering',
  },

  // Central Examination Complex
  {
    id: 'hall-central-1',
    code: 'CB-301',
    name: 'Central Examination Hall - A',
    building: 'Pragati Central Academic Complex',
    floor: '3rd Floor',
    rows: 10,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: [],
    invigilatorName: 'Prof. T. Venkatesh',
    invigilatorDept: 'Central Examination Cell',
  },
  {
    id: 'hall-central-2',
    code: 'CB-302',
    name: 'Central Examination Hall - B',
    building: 'Pragati Central Academic Complex',
    floor: '3rd Floor',
    rows: 10,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: ['R1-C1-A'],
    invigilatorName: 'Dr. S. Madhuri',
    invigilatorDept: 'CSE (Data Science)',
  },
  {
    id: 'hall-central-3',
    code: 'CB-401',
    name: 'Central Examination Hall - C',
    building: 'Pragati Central Academic Complex',
    floor: '4th Floor',
    rows: 10,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: [],
    invigilatorName: 'Dr. K. Chandrasekhar',
    invigilatorDept: 'Data Science',
  },
  {
    id: 'hall-central-4',
    code: 'CB-402',
    name: 'Central Examination Hall - D',
    building: 'Pragati Central Academic Complex',
    floor: '4th Floor',
    rows: 10,
    columns: 6,
    desksPerBench: 1,
    blockedSeats: [],
    invigilatorName: 'Dr. R. Rajesh',
    invigilatorDept: 'Artificial Intelligence & Data Science',
  },
];

// Pragati B.Tech Examination Schedules across Semesters
export const INITIAL_EXAMS: ExamSchedule[] = [
  {
    id: 'exam-2-2',
    courseCode: '20CS4T08',
    courseTitle: 'Design and Analysis of Algorithms & Complex Systems',
    departments: [
      'Computer Science & Engineering',
      'Artificial Intelligence & Machine Learning',
      'Artificial Intelligence & Data Science',
      'CSE (Data Science)',
    ],
    year: 2,
    semester: 4,
    semesterLabel: '2-2 (II B.Tech II Semester Regular/Supply)',
    date: '2026-11-04',
    session: 'FN',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    status: 'draft',
  },
  {
    id: 'exam-2-2-ece',
    courseCode: '20EC4T09',
    courseTitle: 'Electromagnetic Waves and Transmission Lines',
    departments: [
      'Electronics & Communication Engineering',
      'Electrical & Electronics Engineering',
    ],
    year: 2,
    semester: 4,
    semesterLabel: '2-2 (II B.Tech II Semester Regular/Supply)',
    date: '2026-11-04',
    session: 'FN',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    status: 'draft',
  },
  {
    id: 'exam-3-2',
    courseCode: '20CS6T01',
    courseTitle: 'Compiler Design and Automata Theory',
    departments: [
      'Computer Science & Engineering',
      'Information Technology',
    ],
    year: 3,
    semester: 6,
    semesterLabel: '3-2 (III B.Tech II Semester Regular)',
    date: '2026-11-05',
    session: 'FN',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    status: 'draft',
  },
  {
    id: 'exam-4-2',
    courseCode: '20CS8T04',
    courseTitle: 'Cloud Computing, DevOps & Microservices Architecture',
    departments: [
      'Computer Science & Engineering',
      'Information Technology',
      'Data Science',
    ],
    year: 4,
    semester: 8,
    semesterLabel: '4-2 (IV B.Tech II Semester Final End Exams)',
    date: '2026-11-06',
    session: 'FN',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    status: 'draft',
  },
  {
    id: 'exam-1-2',
    courseCode: '20BS2T03',
    courseTitle: 'Differential Equations and Vector Calculus',
    departments: [
      'Computer Science & Engineering',
      'Electronics & Communication Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
    ],
    year: 1,
    semester: 2,
    semesterLabel: '1-2 (I B.Tech II Semester)',
    date: '2026-11-07',
    session: 'AN',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    status: 'draft',
  },
];

// Telugu & Indian names common in Pragati Engineering College (Surampalem / East Godavari / Andhra Pradesh)
const FIRST_NAMES = [
  'Aarav', 'Sai', 'Venkat', 'Harsha', 'Kavya', 'Srikanth', 'Ananya', 'Teja', 'Divya', 'Suresh',
  'Pooja', 'Chaitanya', 'Ramya', 'Kiran', 'Sneha', 'Mani', 'Bhavani', 'Rohit', 'Swathi', 'Gopi',
  'Sireesha', 'Praveen', 'Anusha', 'Tarun', 'Keerthi', 'Avinash', 'Sravani', 'Prasad', 'Deepika', 'Karthik',
  'Nandini', 'Naresh', 'Manasa', 'Vamsi', 'Meghana', 'Santosh', 'Lalitha', 'Akhil', 'Suhasini', 'Madhav',
  'Bhavana', 'Dinesh', 'Lavanya', 'Ajay', 'Sirisha', 'Naveen', 'Usha', 'Surya', 'Harika', 'Kalyan',
  'Yamini', 'Rajesh', 'Vennela', 'Ravi', 'Hema', 'Mahesh', 'Madhuri', 'Satish', 'Pranitha', 'Ganesh',
  'Pavani', 'Charan', 'Tejaswini', 'Phani', 'Mounika', 'Sundeep', 'Jyothi', 'Jagadeesh', 'Roopa', 'Siddhartha',
  'Sruthi', 'Hemanth', 'Gayathri', 'Lokesh', 'Priyanka', 'Chandra', 'Aparna', 'Kishore', 'Sandhya', 'Vidyadhar'
];

const LAST_NAMES = [
  'Gudimetla', 'Chaganti', 'Kollu', 'Penumarthi', 'Koppula', 'Challa', 'Vemuri', 'Alluri', 'Karri', 'Palla',
  'Gottipati', 'Muddana', 'Nadimpalli', 'Surampudi', 'Bikkina', 'Gadiraju', 'Kandula', 'Chekuri', 'Gunturu', 'Penmetsa',
  'Sagi', 'Mantena', 'Dandu', 'Kovvuri', 'Pothula', 'Manda', 'Pilla', 'Tadi', 'Medapati', 'Bhimisetti',
  'Koppisetti', 'Routhu', 'Adabala', 'Gorle', 'Kornana', 'Vanka', 'Tetali', 'Mutyala', 'Grandhi', 'Yerra',
  'Chintalapati', 'Datla', 'Kanumuri', 'Nallamilli', 'Gollapalli', 'Kothapalli', 'Padala', 'Bunga', 'Mallipudi', 'Vulli'
];

/**
 * Generate 640+ realistic Pragati Engineering College, Surampalem students
 * Across 4 academic years (1st, 2nd, 3rd, 4th Year)
 * Across 8 Semesters (1 to 8)
 * Across 10 B.Tech branches
 * Format: e.g. 25A35A0501 (Lateral Entry), 23A31A0501 (Regular), 22A31A0401, 21A31A0201
 */
function generatePragatiStudentRoster(): Student[] {
  const students: Student[] = [];
  let studentGlobalCounter = 1;

  // Academic year configurations
  // Year 1: Sem 1 & 2 (Batch 2024-2028), Admission year '24'
  // Year 2: Sem 3 & 4 (Batch 2023-2027), Admission year '23', Lateral entry '25A35A...' / '24A35A...'
  // Year 3: Sem 5 & 6 (Batch 2022-2026), Admission year '22', Lateral entry '23A35A...'
  // Year 4: Sem 7 & 8 (Batch 2021-2025), Admission year '21', Lateral entry '22A35A...'
  const YEAR_CONFIGS: { year: AcademicYear; semester: number; batch: string; admYear: string; lateralYear: string }[] = [
    { year: 1, semester: 2, batch: '2024-2028', admYear: '24', lateralYear: '24' },
    { year: 2, semester: 4, batch: '2023-2027', admYear: '23', lateralYear: '25' }, // User requested 25A35A0501
    { year: 3, semester: 6, batch: '2022-2026', admYear: '22', lateralYear: '23' },
    { year: 4, semester: 8, batch: '2021-2025', admYear: '21', lateralYear: '22' },
  ];

  for (const yConfig of YEAR_CONFIGS) {
    for (const bInfo of BRANCH_CODES) {
      // 16 students per branch per year = 16 * 10 * 4 = 640 students total!
      const countPerBranch = 16;

      for (let i = 1; i <= countPerBranch; i++) {
        // Lateral entry in Year 2, 3, 4 (Students 1 to 4 are lateral entry '5A', others '1A')
        const isLateral = yConfig.year >= 2 && i <= 4;
        const entryCode = isLateral ? '5A' : '1A';
        const yearPrefix = isLateral ? yConfig.lateralYear : yConfig.admYear;

        // Roll number format: e.g. 25A35A0501 or 23A31A0501
        // Pragati college code is 'A3'
        const candidateSerial = String(i).padStart(2, '0');
        const rollNo = `${yearPrefix}A3${entryCode}${bInfo.code}${candidateSerial}`;

        const fName = FIRST_NAMES[(studentGlobalCounter * 7) % FIRST_NAMES.length];
        const lName = LAST_NAMES[(studentGlobalCounter * 11) % LAST_NAMES.length];
        const fullName = `${fName} ${lName}`;
        const section = i % 2 === 0 ? 'B' : 'A';

        // Assign exams matching their semester and branch
        const registeredExams: string[] = [];
        if (yConfig.semester === 4) {
          if (['Computer Science & Engineering', 'Artificial Intelligence & Machine Learning', 'Artificial Intelligence & Data Science', 'CSE (Data Science)'].includes(bInfo.dept)) {
            registeredExams.push('exam-2-2');
          } else if (['Electronics & Communication Engineering', 'Electrical & Electronics Engineering'].includes(bInfo.dept)) {
            registeredExams.push('exam-2-2-ece');
          }
        } else if (yConfig.semester === 6) {
          if (['Computer Science & Engineering', 'Information Technology'].includes(bInfo.dept)) {
            registeredExams.push('exam-3-2');
          }
        } else if (yConfig.semester === 8) {
          if (['Computer Science & Engineering', 'Information Technology', 'Data Science'].includes(bInfo.dept)) {
            registeredExams.push('exam-4-2');
          }
        } else if (yConfig.semester === 2) {
          if (['Computer Science & Engineering', 'Electronics & Communication Engineering', 'Mechanical Engineering', 'Civil Engineering'].includes(bInfo.dept)) {
            registeredExams.push('exam-1-2');
          }
        }

        students.push({
          id: `student-pragati-${studentGlobalCounter}`,
          rollNo,
          name: fullName,
          email: `${rollNo.toLowerCase()}@pragati.ac.in`,
          department: bInfo.dept,
          section,
          year: yConfig.year,
          semester: yConfig.semester,
          batch: yConfig.batch,
          registeredExamIds: registeredExams,
        });

        studentGlobalCounter++;
      }
    }
  }

  return students;
}

export const INITIAL_STUDENTS: Student[] = generatePragatiStudentRoster();
