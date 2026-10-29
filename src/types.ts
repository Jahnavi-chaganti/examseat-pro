export type Department = 
  | 'Computer Science & Engineering'
  | 'Electronics & Communication Engineering'
  | 'Electrical & Electronics Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Information Technology'
  | 'Artificial Intelligence & Machine Learning'
  | 'Artificial Intelligence & Data Science'
  | 'CSE (Data Science)'
  | 'Data Science';

export type AcademicYear = 1 | 2 | 3 | 4; // 1st, 2nd, 3rd, 4th Year B.Tech

export type ExamSession = 'FN' | 'AN'; // Forenoon (09:30 - 12:30), Afternoon (14:00 - 17:00)

export type ExamStatus = 'draft' | 'allocated' | 'approved' | 'in_progress' | 'completed';

export type UserRole = 'admin' | 'officer' | 'invigilator' | 'student';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department?: string;
  rollNo?: string;
}

export type AttendanceStatus = 'unmarked' | 'present' | 'absent' | 'malpractice';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  department: Department;
  section: string;
  year: AcademicYear;
  semester: number; // 1 to 8 (1-1, 1-2, 2-1, 2-2, 3-1, 3-2, 4-1, 4-2)
  batch: string; // e.g. "2022-2026"
  registeredExamIds: string[];
}

export interface ExamHall {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  rows: number;
  columns: number;
  desksPerBench: 1 | 2; // 1 = Single Desk, 2 = Dual-seating bench
  blockedSeats: string[]; // e.g. "R2-C3-A" (seats with broken furniture, pillars, etc.)
  invigilatorName?: string;
  invigilatorDept?: string;
}

export interface ExamSchedule {
  id: string;
  courseCode: string;
  courseTitle: string;
  departments: Department[];
  year: AcademicYear;
  semester: number; // 1 to 8
  semesterLabel: string; // e.g. "2-2 (II B.Tech II Sem)"
  date: string; // YYYY-MM-DD
  session: ExamSession;
  startTime: string;
  endTime: string;
  status: ExamStatus;
  approvedBy?: string;
  approvalDate?: string;
}

export interface SeatAllotment {
  id: string;
  examId: string;
  studentId: string;
  hallId: string;
  row: number; // 1-based
  col: number; // 1-based
  benchSlot: 'A' | 'B';
  seatCode: string; // e.g. "LH101-R01-C02-A"
  attendance: AttendanceStatus;
  answerBookletNo?: string;
  incidentNotes?: string;
  notes?: string;
}

export type AllocationMode = 
  | 'mixed_checkerboard'    // Alternates departments to avoid cheating (recommended)
  | 'greedy_sequential'     // Fills halls sequentially by department
  | 'balanced_density'      // Spreads students evenly across all available halls
  | 'staggered_buffer';     // Leaves alternate seats empty (50% density / high security)

export interface AllocationRuleConfig {
  mode: AllocationMode;
  separateBy: 'department' | 'section' | 'subject' | 'semester';
  bufferEmptySeats: boolean; // Leave alternate seats empty
  preferGroundFloorFirst: boolean;
  selectedHallIds: string[];
}

export interface AllocationResult {
  examId: string;
  timestamp: string;
  mode: AllocationMode;
  totalStudents: number;
  allocatedCount: number;
  unallocatedCount: number;
  unallocatedStudentIds: string[];
  integrityScore: number; // 0-100% of seats where adjacent neighbors differ in department
  adjacentCollisionsCount: number;
  hallSummaries: {
    hallId: string;
    hallName: string;
    hallCode: string;
    totalSeats: number;
    allocatedSeats: number;
    occupancyRate: number;
    departmentBreakdown: Record<string, number>;
  }[];
  allotments: SeatAllotment[];
  warnings: string[];
}

export type PrintableReportType = 
  | 'none'
  | 'door_chart'
  | 'attendance_sheet'
  | 'desk_slips'
  | 'student_slip'
  | 'master_roster';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'USER_LOGIN'
    | 'ALLOCATE_EXAM'
    | 'CLEAR_ALLOTMENTS'
    | 'APPROVE_EXAM'
    | 'UNLOCK_EXAM'
    | 'SWAP_SEATS'
    | 'MARK_ATTENDANCE'
    | 'CREATE_STUDENT'
    | 'DELETE_STUDENT'
    | 'CREATE_HALL'
    | 'DELETE_HALL'
    | 'CREATE_EXAM'
    | 'DELETE_EXAM'
    | 'RESTORE_BACKUP'
    | 'SYSTEM_RESET';
  entityType: 'exam' | 'hall' | 'student' | 'allotment' | 'system';
  entityId?: string;
  details: string;
  ipAddress?: string;
}

export interface DatabaseStats {
  engine: string;
  dbFile: string;
  connected: boolean;
  counts: {
    students: number;
    halls: number;
    exams: number;
    allotments: number;
    auditLogs: number;
    users: number;
  };
  storageSizeBytes?: number;
  lastBackupAt?: string;
}

export interface AllocationValidationReport {
  examId: string;
  isValid: boolean;
  totalAllotments: number;
  duplicateStudentErrors: string[];
  duplicateSeatErrors: string[];
  blockedSeatErrors: string[];
  capacityExceededErrors: string[];
  departmentNeighborCollisions: {
    hallCode: string;
    seatCodeA: string;
    studentA: string;
    deptA: string;
    seatCodeB: string;
    studentB: string;
    deptB: string;
  }[];
  integrityScore: number;
  summary: string;
}

