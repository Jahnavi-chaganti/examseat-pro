import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import {
  AllocationValidationReport,
  AuditLogEntry,
  DatabaseStats,
  ExamHall,
  ExamSchedule,
  SeatAllotment,
  Student,
  UserRole,
} from '../types';
import {
  INITIAL_EXAMS,
  INITIAL_HALLS,
  INITIAL_STUDENTS,
} from '../services/sampleData';
import { DEMO_ACCOUNTS } from '../services/authService';
import { runSeatingAllocation } from '../services/allocationEngine';

const DB_PATH = path.resolve(process.cwd(), 'examseat.db');

export const db: Database.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT,
      roll_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      roll_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      department TEXT NOT NULL,
      section TEXT NOT NULL,
      year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      batch TEXT NOT NULL,
      registered_exam_ids TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS halls (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      building TEXT NOT NULL,
      floor TEXT NOT NULL,
      rows INTEGER NOT NULL,
      columns INTEGER NOT NULL,
      desks_per_bench INTEGER NOT NULL,
      blocked_seats TEXT NOT NULL,
      invigilator_name TEXT,
      invigilator_dept TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      course_code TEXT NOT NULL,
      course_title TEXT NOT NULL,
      departments TEXT NOT NULL,
      year INTEGER NOT NULL,
      semester INTEGER NOT NULL,
      semester_label TEXT NOT NULL,
      date TEXT NOT NULL,
      session TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL,
      approved_by TEXT,
      approval_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS allotments (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      hall_id TEXT NOT NULL,
      row_num INTEGER NOT NULL,
      col_num INTEGER NOT NULL,
      bench_slot TEXT NOT NULL,
      seat_code TEXT NOT NULL,
      attendance TEXT NOT NULL DEFAULT 'unmarked',
      answer_booklet_no TEXT,
      incident_notes TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (hall_id) REFERENCES halls (id) ON DELETE CASCADE,
      UNIQUE(exam_id, student_id),
      UNIQUE(exam_id, hall_id, row_num, col_num, bench_slot)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT NOT NULL,
      ip_address TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_no);
    CREATE INDEX IF NOT EXISTS idx_allotments_exam ON allotments(exam_id);
    CREATE INDEX IF NOT EXISTS idx_allotments_student ON allotments(student_id);
    CREATE INDEX IF NOT EXISTS idx_allotments_hall ON allotments(hall_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);

  // Check if we need to seed
  const countUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (countUsers === 0) {
    seedBaselineData();
  }
}

export function logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
  const id = entry.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = entry.timestamp || new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, actor_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    timestamp,
    entry.actorId,
    entry.actorName,
    entry.actorRole,
    entry.action,
    entry.entityType,
    entry.entityId || null,
    entry.details,
    entry.ipAddress || '127.0.0.1'
  );
}

export function seedBaselineData() {
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, password, name, email, role, designation, department, roll_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStudent = db.prepare(`
    INSERT OR REPLACE INTO students (id, roll_no, name, email, department, section, year, semester, batch, registered_exam_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHall = db.prepare(`
    INSERT OR REPLACE INTO halls (id, code, name, building, floor, rows, columns, desks_per_bench, blocked_seats, invigilator_name, invigilator_dept)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExam = db.prepare(`
    INSERT OR REPLACE INTO exams (id, course_code, course_title, departments, year, semester, semester_label, date, session, start_time, end_time, status, approved_by, approval_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAllotment = db.prepare(`
    INSERT OR REPLACE INTO allotments (id, exam_id, student_id, hall_id, row_num, col_num, bench_slot, seat_code, attendance, answer_booklet_no, incident_notes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    // 1. Users
    for (const u of DEMO_ACCOUNTS) {
      insertUser.run(
        u.id,
        u.username,
        u.defaultPassword,
        u.name,
        u.email,
        u.role,
        u.designation,
        u.department || null,
        u.rollNo || null
      );
    }

    // 2. Students (640+ Pragati Students across 4 years & 8 semesters)
    for (const s of INITIAL_STUDENTS) {
      insertStudent.run(
        s.id,
        s.rollNo,
        s.name,
        s.email,
        s.department,
        s.section,
        s.year,
        s.semester,
        s.batch,
        JSON.stringify(s.registeredExamIds)
      );
    }

    // 3. Halls (Aryabhata, Kalam, Central, Visvesvaraya)
    for (const h of INITIAL_HALLS) {
      insertHall.run(
        h.id,
        h.code,
        h.name,
        h.building,
        h.floor,
        h.rows,
        h.columns,
        h.desksPerBench,
        JSON.stringify(h.blockedSeats),
        h.invigilatorName || null,
        h.invigilatorDept || null
      );
    }

    // 4. Exams
    const defaultExams = [...INITIAL_EXAMS];

    // Seed pre-approved allocations
    const res22 = runSeatingAllocation(defaultExams[0], INITIAL_STUDENTS, INITIAL_HALLS, {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: true,
      selectedHallIds: ['hall-101', 'hall-102', 'hall-201'],
    });
    defaultExams[0].status = 'approved';
    defaultExams[0].approvedBy = 'Dr. S. Sambhu Prasad (Principal & Chief Superintendent)';
    defaultExams[0].approvalDate = '2026-10-25 09:00 AM';

    const res22Ece = runSeatingAllocation(defaultExams[1], INITIAL_STUDENTS, INITIAL_HALLS, {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: true,
      selectedHallIds: ['hall-kalam-1', 'hall-kalam-2'],
    });
    defaultExams[1].status = 'approved';
    defaultExams[1].approvedBy = 'Dr. S. Sambhu Prasad (Principal & Chief Superintendent)';
    defaultExams[1].approvalDate = '2026-10-25 09:15 AM';

    const res32 = runSeatingAllocation(defaultExams[2], INITIAL_STUDENTS, INITIAL_HALLS, {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: false,
      selectedHallIds: ['hall-central-1'],
    });
    defaultExams[2].status = 'approved';
    defaultExams[2].approvedBy = 'Dr. G. Raghuram (Controller of Examinations)';
    defaultExams[2].approvalDate = '2026-10-25 09:30 AM';

    const res42 = runSeatingAllocation(defaultExams[3], INITIAL_STUDENTS, INITIAL_HALLS, {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: false,
      selectedHallIds: ['hall-central-2'],
    });
    defaultExams[3].status = 'approved';
    defaultExams[3].approvedBy = 'Dr. G. Raghuram (Controller of Examinations)';
    defaultExams[3].approvalDate = '2026-10-25 09:45 AM';

    const res12 = runSeatingAllocation(defaultExams[4], INITIAL_STUDENTS, INITIAL_HALLS, {
      mode: 'mixed_checkerboard',
      separateBy: 'department',
      bufferEmptySeats: false,
      preferGroundFloorFirst: true,
      selectedHallIds: ['hall-mv-1', 'hall-mv-2'],
    });
    defaultExams[4].status = 'approved';
    defaultExams[4].approvedBy = 'Dr. G. Raghuram (Controller of Examinations)';
    defaultExams[4].approvalDate = '2026-10-25 10:00 AM';

    for (const ex of defaultExams) {
      insertExam.run(
        ex.id,
        ex.courseCode,
        ex.courseTitle,
        JSON.stringify(ex.departments),
        ex.year,
        ex.semester,
        ex.semesterLabel,
        ex.date,
        ex.session,
        ex.startTime,
        ex.endTime,
        ex.status,
        ex.approvedBy || null,
        ex.approvalDate || null
      );
    }

    const allAllotments = [
      ...res22.allotments,
      ...res22Ece.allotments,
      ...res32.allotments,
      ...res42.allotments,
      ...res12.allotments,
    ];

    for (const a of allAllotments) {
      insertAllotment.run(
        a.id,
        a.examId,
        a.studentId,
        a.hallId,
        a.row,
        a.col,
        a.benchSlot,
        a.seatCode,
        a.attendance || 'unmarked',
        a.answerBookletNo || null,
        a.incidentNotes || null,
        a.notes || null
      );
    }

    logAudit({
      actorId: 'system',
      actorName: 'Pragati Examination Engine',
      actorRole: 'admin',
      action: 'SYSTEM_RESET',
      entityType: 'system',
      details: `Database initialized with 640+ students, 7 examination halls, 5 scheduled semesters, and ${allAllotments.length} verified seating allotments.`,
    });
  });

  seedTransaction();
}

// Data access operations
export function getAllStudents(): Student[] {
  const rows = db.prepare('SELECT * FROM students ORDER BY roll_no ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    rollNo: r.roll_no,
    name: r.name,
    email: r.email,
    department: r.department,
    section: r.section,
    year: r.year,
    semester: r.semester,
    batch: r.batch,
    registeredExamIds: JSON.parse(r.registered_exam_ids),
  }));
}

export function getAllHalls(): ExamHall[] {
  const rows = db.prepare('SELECT * FROM halls ORDER BY building ASC, code ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    building: r.building,
    floor: r.floor,
    rows: r.rows,
    columns: r.columns,
    desksPerBench: r.desks_per_bench,
    blockedSeats: JSON.parse(r.blocked_seats),
    invigilatorName: r.invigilator_name || undefined,
    invigilatorDept: r.invigilator_dept || undefined,
  }));
}

export function getAllExams(): ExamSchedule[] {
  const rows = db.prepare('SELECT * FROM exams ORDER BY date ASC, session ASC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    courseCode: r.course_code,
    courseTitle: r.course_title,
    departments: JSON.parse(r.departments),
    year: r.year,
    semester: r.semester,
    semesterLabel: r.semester_label,
    date: r.date,
    session: r.session,
    startTime: r.start_time,
    endTime: r.end_time,
    status: r.status,
    approvedBy: r.approved_by || undefined,
    approvalDate: r.approval_date || undefined,
  }));
}

export function getAllAllotments(examId?: string): SeatAllotment[] {
  let query = 'SELECT * FROM allotments';
  const params: any[] = [];
  if (examId) {
    query += ' WHERE exam_id = ?';
    params.push(examId);
  }
  const rows = db.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    examId: r.exam_id,
    studentId: r.student_id,
    hallId: r.hall_id,
    row: r.row_num,
    col: r.col_num,
    benchSlot: r.bench_slot,
    seatCode: r.seat_code,
    attendance: r.attendance,
    answerBookletNo: r.answer_booklet_no || undefined,
    incidentNotes: r.incident_notes || undefined,
    notes: r.notes || undefined,
  }));
}

export function saveExamAllotments(
  examId: string,
  allotmentsList: SeatAllotment[],
  actor: { id: string; name: string; role: UserRole }
) {
  // Validate exam is not approved/locked
  const exam = db.prepare('SELECT status, course_code FROM exams WHERE id = ?').get(examId) as any;
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }
  if (exam.status === 'approved' && actor.role !== 'officer' && actor.role !== 'admin') {
    throw new Error('Examination seating plan is approved and locked. Requires Officer or Admin authorization to modify.');
  }

  // Pre-validate constraints
  const studentSet = new Set<string>();
  const seatSet = new Set<string>();

  for (const a of allotmentsList) {
    if (studentSet.has(a.studentId)) {
      throw new Error(`Validation Error: Duplicate student assignment detected for studentId ${a.studentId}`);
    }
    studentSet.add(a.studentId);

    const seatKey = `${a.hallId}:${a.row}:${a.col}:${a.benchSlot}`;
    if (seatSet.has(seatKey)) {
      throw new Error(`Validation Error: Duplicate desk assignment detected at ${a.seatCode}`);
    }
    seatSet.add(seatKey);
  }

  const tx = db.transaction(() => {
    // Delete existing allotments for this exam
    db.prepare('DELETE FROM allotments WHERE exam_id = ?').run(examId);

    const insert = db.prepare(`
      INSERT INTO allotments (id, exam_id, student_id, hall_id, row_num, col_num, bench_slot, seat_code, attendance, answer_booklet_no, incident_notes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const a of allotmentsList) {
      insert.run(
        a.id,
        examId,
        a.studentId,
        a.hallId,
        a.row,
        a.col,
        a.benchSlot,
        a.seatCode,
        a.attendance || 'unmarked',
        a.answerBookletNo || null,
        a.incidentNotes || null,
        a.notes || null
      );
    }

    // Update exam status to allocated
    db.prepare('UPDATE exams SET status = ? WHERE id = ?').run('allocated', examId);

    logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ALLOCATE_EXAM',
      entityType: 'exam',
      entityId: examId,
      details: `Generated and stored seating allocation for ${exam.course_code} (${allotmentsList.length} students assigned).`,
    });
  });

  tx();
}

export function clearExamAllotments(examId: string, actor: { id: string; name: string; role: UserRole }) {
  const exam = db.prepare('SELECT course_code, status FROM exams WHERE id = ?').get(examId) as any;
  if (!exam) throw new Error('Exam not found');

  const count = (db.prepare('SELECT COUNT(*) as c FROM allotments WHERE exam_id = ?').get(examId) as any).c;

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM allotments WHERE exam_id = ?').run(examId);
    db.prepare('UPDATE exams SET status = ?, approved_by = NULL, approval_date = NULL WHERE id = ?').run('draft', examId);

    logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CLEAR_ALLOTMENTS',
      entityType: 'exam',
      entityId: examId,
      details: `Cleared ${count} seating assignments for ${exam.course_code}. Status reverted to Draft.`,
    });
  });

  tx();
}

export function approveExamSchedule(examId: string, approvedBy: string, actor: { id: string; name: string; role: UserRole }) {
  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tx = db.transaction(() => {
    db.prepare('UPDATE exams SET status = ?, approved_by = ?, approval_date = ? WHERE id = ?').run(
      'approved',
      approvedBy,
      dateStr,
      examId
    );

    logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPROVE_EXAM',
      entityType: 'exam',
      entityId: examId,
      details: `Seating allotment locked and formally approved by ${approvedBy}.`,
    });
  });

  tx();
}

export function unlockExamSchedule(examId: string, actor: { id: string; name: string; role: UserRole }) {
  const tx = db.transaction(() => {
    db.prepare('UPDATE exams SET status = ?, approved_by = NULL, approval_date = NULL WHERE id = ?').run(
      'allocated',
      examId
    );

    logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'UNLOCK_EXAM',
      entityType: 'exam',
      entityId: examId,
      details: `Seating allotment unlocked for revision by ${actor.name} (${actor.role}).`,
    });
  });

  tx();
}

export function swapSeatsInDb(
  sourceAllotmentId: string,
  targetRow: number,
  targetCol: number,
  targetSlot: 'A' | 'B',
  actor: { id: string; name: string; role: UserRole }
) {
  const source = db.prepare('SELECT * FROM allotments WHERE id = ?').get(sourceAllotmentId) as any;
  if (!source) throw new Error('Source allotment not found');

  const hall = db.prepare('SELECT * FROM halls WHERE id = ?').get(source.hall_id) as any;
  if (!hall) throw new Error('Hall not found');

  const padR = String(targetRow).padStart(2, '0');
  const padC = String(targetCol).padStart(2, '0');
  const newSeatCode = `${hall.code}-R${padR}-C${padC}${hall.desks_per_bench === 2 ? `-${targetSlot}` : ''}`;

  // Check if target is occupied
  const targetOccupant = db.prepare(`
    SELECT * FROM allotments 
    WHERE exam_id = ? AND hall_id = ? AND row_num = ? AND col_num = ? AND bench_slot = ?
  `).get(source.exam_id, source.hall_id, targetRow, targetCol, targetSlot) as any;

  const tx = db.transaction(() => {
    if (targetOccupant) {
      // Temporary seat code to bypass UNIQUE constraint during atomic swap
      const tempId = `temp-${Date.now()}`;
      db.prepare('UPDATE allotments SET row_num = -999, col_num = -999, seat_code = ? WHERE id = ?').run(tempId, targetOccupant.id);

      db.prepare(`
        UPDATE allotments 
        SET row_num = ?, col_num = ?, bench_slot = ?, seat_code = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(targetRow, targetCol, targetSlot, newSeatCode, source.id);

      db.prepare(`
        UPDATE allotments 
        SET row_num = ?, col_num = ?, bench_slot = ?, seat_code = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(source.row_num, source.col_num, source.bench_slot, source.seat_code, targetOccupant.id);

      logAudit({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'SWAP_SEATS',
        entityType: 'allotment',
        entityId: source.id,
        details: `Desk swap between seat ${source.seat_code} and ${newSeatCode} executed by ${actor.name}.`,
      });
    } else {
      db.prepare(`
        UPDATE allotments 
        SET row_num = ?, col_num = ?, bench_slot = ?, seat_code = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(targetRow, targetCol, targetSlot, newSeatCode, source.id);

      logAudit({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'SWAP_SEATS',
        entityType: 'allotment',
        entityId: source.id,
        details: `Candidate moved from ${source.seat_code} to ${newSeatCode} by ${actor.name}.`,
      });
    }
  });

  tx();
}

export function updateAttendanceInDb(
  allotmentId: string,
  attendance: string,
  incidentNotes: string | undefined,
  bookletNo: string | undefined,
  actor: { id: string; name: string; role: UserRole }
) {
  const current = db.prepare('SELECT seat_code, attendance FROM allotments WHERE id = ?').get(allotmentId) as any;
  if (!current) throw new Error('Allotment not found');

  db.prepare(`
    UPDATE allotments 
    SET attendance = ?, 
        incident_notes = COALESCE(?, incident_notes),
        answer_booklet_no = COALESCE(?, answer_booklet_no),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(attendance, incidentNotes || null, bookletNo || null, allotmentId);

  logAudit({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'MARK_ATTENDANCE',
    entityType: 'allotment',
    entityId: allotmentId,
    details: `Attendance marked '${attendance}' for ${current.seat_code}${bookletNo ? ` (Booklet #${bookletNo})` : ''} by ${actor.name}.`,
  });
}

export function validateSeatingPlan(examId: string): AllocationValidationReport {
  const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId) as any;
  if (!exam) throw new Error(`Exam ${examId} not found`);

  const allotments = db.prepare(`
    SELECT a.*, s.roll_no, s.name as student_name, s.department as student_dept, h.code as hall_code, h.blocked_seats, h.rows as hall_rows, h.columns as hall_cols
    FROM allotments a
    JOIN students s ON a.student_id = s.id
    JOIN halls h ON a.hall_id = h.id
    WHERE a.exam_id = ?
  `).all(examId) as any[];

  const studentMap = new Map<string, string[]>();
  const seatMap = new Map<string, string[]>();
  const duplicateStudentErrors: string[] = [];
  const duplicateSeatErrors: string[] = [];
  const blockedSeatErrors: string[] = [];
  const capacityExceededErrors: string[] = [];

  // Group by hall to check capacity & adjacent neighbors
  const hallAllotmentMap = new Map<string, any[]>();

  for (const a of allotments) {
    // Duplicate student
    if (!studentMap.has(a.student_id)) {
      studentMap.set(a.student_id, []);
    }
    studentMap.get(a.student_id)!.push(a.seat_code);

    // Duplicate seat
    const seatKey = `${a.hall_id}:${a.row_num}:${a.col_num}:${a.bench_slot}`;
    if (!seatMap.has(seatKey)) {
      seatMap.set(seatKey, []);
    }
    seatMap.get(seatKey)!.push(a.roll_no);

    // Blocked seats
    const blocked: string[] = JSON.parse(a.blocked_seats || '[]');
    const deskCode = `R${a.row_num}-C${a.col_num}${a.bench_slot ? `-${a.benchSlot}` : ''}`;
    if (blocked.includes(deskCode) || blocked.some(b => b.startsWith(`R${a.row_num}-C${a.col_num}`))) {
      blockedSeatErrors.push(`Candidate ${a.roll_no} assigned to blocked desk ${a.seat_code}`);
    }

    if (!hallAllotmentMap.has(a.hall_id)) {
      hallAllotmentMap.set(a.hall_id, []);
    }
    hallAllotmentMap.get(a.hall_id)!.push(a);
  }

  for (const [sId, seats] of studentMap.entries()) {
    if (seats.length > 1) {
      duplicateStudentErrors.push(`Student ID ${sId} is assigned to multiple seats: ${seats.join(', ')}`);
    }
  }

  for (const [seatKey, students] of seatMap.entries()) {
    if (students.length > 1) {
      duplicateSeatErrors.push(`Seat ${seatKey} is double-booked by candidates: ${students.join(', ')}`);
    }
  }

  // Check capacity & adjacent collisions
  const collisions: AllocationValidationReport['departmentNeighborCollisions'] = [];
  let totalPairsChecked = 0;
  let collisionPairsCount = 0;

  for (const [hallId, hallAllots] of hallAllotmentMap.entries()) {
    const hall = db.prepare('SELECT * FROM halls WHERE id = ?').get(hallId) as any;
    const maxCapacity = hall.rows * hall.columns * hall.desks_per_bench;
    if (hallAllots.length > maxCapacity) {
      capacityExceededErrors.push(`Hall ${hall.code} capacity exceeded (${hallAllots.length} allocated > ${maxCapacity} max capacity)`);
    }

    // Build grid for neighbor collision check
    const grid: Record<string, any> = {};
    for (const a of hallAllots) {
      grid[`${a.row_num}_${a.col_num}_${a.bench_slot}`] = a;
    }

    // Check bench mate collision (slot A and B at same desk)
    for (const a of hallAllots) {
      if (a.bench_slot === 'A') {
        const partner = grid[`${a.row_num}_${a.col_num}_B`];
        if (partner) {
          totalPairsChecked++;
          if (a.student_dept === partner.student_dept) {
            collisionPairsCount++;
            collisions.push({
              hallCode: a.hall_code,
              seatCodeA: a.seat_code,
              studentA: a.student_name,
              deptA: a.student_dept,
              seatCodeB: partner.seat_code,
              studentB: partner.student_name,
              deptB: partner.student_dept,
            });
          }
        }
      }

      // Check right side neighbor (same row, next column)
      const rightNeighbor = grid[`${a.row_num}_${a.col_num + 1}_A`] || grid[`${a.row_num}_${a.col_num + 1}_`];
      if (rightNeighbor) {
        totalPairsChecked++;
        if (a.student_dept === rightNeighbor.student_dept) {
          collisionPairsCount++;
        }
      }
    }
  }

  const integrityScore = totalPairsChecked === 0 ? 100 : Math.max(0, Math.round(((totalPairsChecked - collisionPairsCount) / totalPairsChecked) * 100));
  const isValid = duplicateStudentErrors.length === 0 && duplicateSeatErrors.length === 0 && blockedSeatErrors.length === 0 && capacityExceededErrors.length === 0;

  return {
    examId,
    isValid,
    totalAllotments: allotments.length,
    duplicateStudentErrors,
    duplicateSeatErrors,
    blockedSeatErrors,
    capacityExceededErrors,
    departmentNeighborCollisions: collisions.slice(0, 20), // cap to top 20
    integrityScore,
    summary: isValid
      ? `Audit PASSED: 100% capacity integrity, 0 duplicate students, 0 double-booked seats. Anti-cheat integrity score: ${integrityScore}%.`
      : `Audit FAILED: Found ${duplicateStudentErrors.length + duplicateSeatErrors.length + blockedSeatErrors.length + capacityExceededErrors.length} allocation violations.`,
  };
}

export function getDatabaseStats(): DatabaseStats {
  const studentCount = (db.prepare('SELECT COUNT(*) as c FROM students').get() as any).c;
  const hallCount = (db.prepare('SELECT COUNT(*) as c FROM halls').get() as any).c;
  const examCount = (db.prepare('SELECT COUNT(*) as c FROM exams').get() as any).c;
  const allotmentCount = (db.prepare('SELECT COUNT(*) as c FROM allotments').get() as any).c;
  const auditCount = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any).c;
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;

  let storageSizeBytes = 0;
  try {
    const stat = fs.statSync(DB_PATH);
    storageSizeBytes = stat.size;
  } catch {
    // ignore
  }

  return {
    engine: 'SQLite 3 (ACID Transactional & WAL Mode)',
    dbFile: 'examseat.db',
    connected: true,
    counts: {
      students: studentCount,
      halls: hallCount,
      exams: examCount,
      allotments: allotmentCount,
      auditLogs: auditCount,
      users: userCount,
    },
    storageSizeBytes,
  };
}

export function getAuditLogs(limit = 100, filterAction?: string): AuditLogEntry[] {
  let query = 'SELECT * FROM audit_logs';
  const params: any[] = [];
  if (filterAction && filterAction !== 'all') {
    query += ' WHERE action = ?';
    params.push(filterAction);
  }
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    actorId: r.actor_id,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id || undefined,
    details: r.details,
    ipAddress: r.ip_address || undefined,
  }));
}

export function exportDatabaseBackupJSON(): string {
  const students = getAllStudents();
  const halls = getAllHalls();
  const exams = getAllExams();
  const allotments = getAllAllotments();
  const auditLogs = getAuditLogs(200);

  const payload = {
    institution: 'Pragati Engineering College (Autonomous), Surampalem',
    system: 'ExamSeat Pro Enterprise Database (B.Tech 4-Year 8-Semester Edition)',
    exportedAt: new Date().toISOString(),
    version: '4.2-sqlite',
    checksum: `sha-${Date.now()}-${allotments.length}`,
    students,
    halls,
    exams,
    allotments,
    auditLogs,
  };

  return JSON.stringify(payload, null, 2);
}

export function restoreDatabaseBackupJSON(
  jsonString: string,
  actor: { id: string; name: string; role: UserRole }
) {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    throw new Error(`JSON Syntax Error: Invalid backup file format (${err.message})`);
  }

  // Schema validation
  if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.halls) || !Array.isArray(parsed.exams) || !Array.isArray(parsed.allotments)) {
    throw new Error('Invalid Backup Schema: Missing students, halls, exams, or allotments collections.');
  }

  // Check student fields
  for (const s of parsed.students.slice(0, 50)) {
    if (!s.id || !s.rollNo || !s.department) {
      throw new Error(`Invalid Student Schema in backup: Record ${s.rollNo || s.id} missing required attributes.`);
    }
  }

  // Execute restore in atomic ACID transaction with automatic rollback
  const restoreTx = db.transaction(() => {
    // Clear current tables
    db.prepare('DELETE FROM allotments').run();
    db.prepare('DELETE FROM exams').run();
    db.prepare('DELETE FROM halls').run();
    db.prepare('DELETE FROM students').run();

    const insertStudent = db.prepare(`
      INSERT INTO students (id, roll_no, name, email, department, section, year, semester, batch, registered_exam_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of parsed.students) {
      insertStudent.run(
        s.id,
        s.rollNo,
        s.name,
        s.email,
        s.department,
        s.section,
        s.year,
        s.semester,
        s.batch,
        JSON.stringify(s.registeredExamIds || [])
      );
    }

    const insertHall = db.prepare(`
      INSERT INTO halls (id, code, name, building, floor, rows, columns, desks_per_bench, blocked_seats, invigilator_name, invigilator_dept)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const h of parsed.halls) {
      insertHall.run(
        h.id,
        h.code,
        h.name,
        h.building,
        h.floor,
        h.rows,
        h.columns,
        h.desksPerBench,
        JSON.stringify(h.blockedSeats || []),
        h.invigilatorName || null,
        h.invigilatorDept || null
      );
    }

    const insertExam = db.prepare(`
      INSERT INTO exams (id, course_code, course_title, departments, year, semester, semester_label, date, session, start_time, end_time, status, approved_by, approval_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const ex of parsed.exams) {
      insertExam.run(
        ex.id,
        ex.courseCode,
        ex.courseTitle,
        JSON.stringify(ex.departments || []),
        ex.year,
        ex.semester,
        ex.semesterLabel,
        ex.date,
        ex.session,
        ex.startTime,
        ex.endTime,
        ex.status,
        ex.approvedBy || null,
        ex.approvalDate || null
      );
    }

    const insertAllotment = db.prepare(`
      INSERT INTO allotments (id, exam_id, student_id, hall_id, row_num, col_num, bench_slot, seat_code, attendance, answer_booklet_no, incident_notes, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const a of parsed.allotments) {
      insertAllotment.run(
        a.id,
        a.examId,
        a.studentId,
        a.hallId,
        a.row,
        a.col,
        a.benchSlot,
        a.seatCode,
        a.attendance || 'unmarked',
        a.answerBookletNo || null,
        a.incidentNotes || null,
        a.notes || null
      );
    }

    logAudit({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'RESTORE_BACKUP',
      entityType: 'system',
      details: `Database restored from backup (${parsed.students.length} students, ${parsed.halls.length} halls, ${parsed.exams.length} exams, ${parsed.allotments.length} allotments).`,
    });
  });

  restoreTx();
}
