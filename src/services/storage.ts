import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../types';
import { runSeatingAllocation } from './allocationEngine';
import { INITIAL_EXAMS, INITIAL_HALLS, INITIAL_STUDENTS } from './sampleData';

const STORAGE_KEYS = {
  STUDENTS: 'examseat_pragati_students_v4',
  HALLS: 'examseat_pragati_halls_v4',
  EXAMS: 'examseat_pragati_exams_v4',
  ALLOTMENTS: 'examseat_pragati_allotments_v4',
};

export function loadInitialData(): {
  students: Student[];
  halls: ExamHall[];
  exams: ExamSchedule[];
  allotments: SeatAllotment[];
} {
  try {
    const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const rawHalls = localStorage.getItem(STORAGE_KEYS.HALLS);
    const rawExams = localStorage.getItem(STORAGE_KEYS.EXAMS);
    const rawAllotments = localStorage.getItem(STORAGE_KEYS.ALLOTMENTS);

    if (rawStudents && rawHalls && rawExams && rawAllotments) {
      return {
        students: JSON.parse(rawStudents),
        halls: JSON.parse(rawHalls),
        exams: JSON.parse(rawExams),
        allotments: JSON.parse(rawAllotments),
      };
    }
  } catch (err) {
    console.error('Failed to parse from localStorage, falling back to defaults', err);
  }

  // Pre-seed allocations for Pragati B.Tech exams across departments and semesters
  const defaultExams = [...INITIAL_EXAMS];
  
  // 1. Allocate Exam 2-2: 20CS4T08 (CSE, AIML, AIDS, CSE-DS) in Aryabhata Block (AB-101, AB-102, AB-201)
  const res22 = runSeatingAllocation(
    defaultExams[0],
    INITIAL_STUDENTS,
    INITIAL_HALLS,
    {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: true,
      selectedHallIds: ['hall-101', 'hall-102', 'hall-201'],
    }
  );
  defaultExams[0].status = 'approved';
  defaultExams[0].approvedBy = 'Dr. S. Sambhu Prasad (Principal & Chief Superintendent)';
  defaultExams[0].approvalDate = '2026-10-25 09:00 AM';

  // 2. Allocate Exam 2-2 ECE: 20EC4T09 (ECE, EEE) in Kalam Block (KB-101, KB-201)
  const res22Ece = runSeatingAllocation(
    defaultExams[1],
    INITIAL_STUDENTS,
    INITIAL_HALLS,
    {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: true,
      selectedHallIds: ['hall-kalam-1', 'hall-kalam-2'],
    }
  );
  defaultExams[1].status = 'approved';
  defaultExams[1].approvedBy = 'Dr. S. Sambhu Prasad (Principal & Chief Superintendent)';
  defaultExams[1].approvalDate = '2026-10-25 09:15 AM';

  // 3. Allocate Exam 3-2: 20CS6T01 (CSE, IT) in Central Block (CB-301)
  const res32 = runSeatingAllocation(
    defaultExams[2],
    INITIAL_STUDENTS,
    INITIAL_HALLS,
    {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: false,
      selectedHallIds: ['hall-central-1'],
    }
  );
  defaultExams[2].status = 'approved';
  defaultExams[2].approvedBy = 'Dr. G. Raghuram (Controller of Examinations)';
  defaultExams[2].approvalDate = '2026-10-25 09:30 AM';

  // 4. Allocate Exam 4-2: 20CS8T04 (CSE, IT, DS) in Central Block (CB-302)
  const res42 = runSeatingAllocation(
    defaultExams[3],
    INITIAL_STUDENTS,
    INITIAL_HALLS,
    {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: false,
      selectedHallIds: ['hall-central-2'],
    }
  );
  defaultExams[3].status = 'approved';
  defaultExams[3].approvedBy = 'Dr. G. Raghuram (Controller of Examinations)';
  defaultExams[3].approvalDate = '2026-10-25 09:45 AM';

  // 5. Allocate Exam 1-2: 20BS2T03 (CSE, ECE, MECH, CIVIL) in Visvesvaraya Block (VB-101, VB-102)
  const res12 = runSeatingAllocation(
    defaultExams[4],
    INITIAL_STUDENTS,
    INITIAL_HALLS,
    {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: true,
      selectedHallIds: ['hall-mv-1', 'hall-mv-2'],
    }
  );
  defaultExams[4].status = 'approved';
  defaultExams[4].approvedBy = 'Dr. G. Raghuram (Controller of Examinations)';
  defaultExams[4].approvalDate = '2026-10-25 10:00 AM';

  const allInitialAllotments = [
    ...res22.allotments,
    ...res22Ece.allotments,
    ...res32.allotments,
    ...res42.allotments,
    ...res12.allotments,
  ];

  saveToStorage(INITIAL_STUDENTS, INITIAL_HALLS, defaultExams, allInitialAllotments);

  return {
    students: INITIAL_STUDENTS,
    halls: INITIAL_HALLS,
    exams: defaultExams,
    allotments: allInitialAllotments,
  };
}

export function saveToStorage(
  students: Student[],
  halls: ExamHall[],
  exams: ExamSchedule[],
  allotments: SeatAllotment[]
) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.HALLS, JSON.stringify(halls));
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    localStorage.setItem(STORAGE_KEYS.ALLOTMENTS, JSON.stringify(allotments));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function resetToDemoData(): {
  students: Student[];
  halls: ExamHall[];
  exams: ExamSchedule[];
  allotments: SeatAllotment[];
} {
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.HALLS);
  localStorage.removeItem(STORAGE_KEYS.EXAMS);
  localStorage.removeItem(STORAGE_KEYS.ALLOTMENTS);
  return loadInitialData();
}

export function exportBackupJSON(
  students: Student[],
  halls: ExamHall[],
  exams: ExamSchedule[],
  allotments: SeatAllotment[]
): string {
  const payload = {
    institution: 'Pragati Engineering College (Autonomous), Surampalem',
    exportedAt: new Date().toISOString(),
    system: 'ExamSeat Pro v4.0 (B.Tech 4-Year 8-Semester Edition)',
    students,
    halls,
    exams,
    allotments,
  };
  return JSON.stringify(payload, null, 2);
}
