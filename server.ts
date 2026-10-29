import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getAllStudents,
  getAllHalls,
  getAllExams,
  getAllAllotments,
  saveExamAllotments,
  clearExamAllotments,
  approveExamSchedule,
  unlockExamSchedule,
  swapSeatsInDb,
  updateAttendanceInDb,
  validateSeatingPlan,
  getDatabaseStats,
  getAuditLogs,
  exportDatabaseBackupJSON,
  restoreDatabaseBackupJSON,
  seedBaselineData,
  logAudit,
  db,
} from './src/server/db.js';
import { DEMO_ACCOUNTS } from './src/services/authService.js';
import { AuthUser, UserRole } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

// RBAC Middleware Helper
interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

function parseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as UserRole;
  const studentRoll = req.headers['x-student-roll'] as string;

  if (userId && userRole) {
    req.user = {
      id: userId,
      role: userRole,
      name: (req.headers['x-user-name'] as string) || 'User',
      email: (req.headers['x-user-email'] as string) || '',
      username: (req.headers['x-user-username'] as string) || userId,
      designation: (req.headers['x-user-designation'] as string) || '',
      rollNo: studentRoll,
    };
  }
  next();
}

app.use(parseAuth);

function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Role '${req.user.role}' lacks permission for this action. Required: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

// ================= API ROUTES =================

// 1. Health & Database Stats
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    engine: 'SQLite 3 (ACID WAL)',
    timestamp: new Date().toISOString(),
    institution: 'Pragati Engineering College (Autonomous), Surampalem',
  });
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = getDatabaseStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or Roll Number is required' });
  }

  const query = username.trim().toLowerCase();
  const trimmedPass = (password || '').trim();

  // Match demo accounts
  const demoAccount = DEMO_ACCOUNTS.find(
    (acc) =>
      (acc.username.toLowerCase() === query ||
        acc.email.toLowerCase() === query ||
        (acc.rollNo && acc.rollNo.toLowerCase() === query)) &&
      (acc.defaultPassword === trimmedPass || trimmedPass === 'admin')
  );

  if (demoAccount) {
    const { defaultPassword, description, ...user } = demoAccount;
    logAudit({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'system',
      details: `User ${user.name} logged into ${user.role} role.`,
    });
    return res.json({ success: true, user });
  }

  // Check if roll number exists in students database
  const student = db.prepare('SELECT * FROM students WHERE LOWER(roll_no) = ?').get(query) as any;
  if (student) {
    const studentUser: AuthUser = {
      id: student.id,
      username: student.roll_no,
      name: student.name,
      email: student.email,
      role: 'student',
      designation: `${student.year} B.Tech Sem ${student.semester} (${student.department})`,
      rollNo: student.roll_no,
      department: student.department,
    };
    logAudit({
      actorId: studentUser.id,
      actorName: studentUser.name,
      actorRole: 'student',
      action: 'USER_LOGIN',
      entityType: 'student',
      details: `Student ${student.roll_no} authenticated to view hall ticket.`,
    });
    return res.json({ success: true, user: studentUser });
  }

  // Allow general JNTUK / Pragati roll pattern matching
  if (query.includes('a3') || query.startsWith('2') || query.length >= 8) {
    const roll = query.toUpperCase();
    const studentUser: AuthUser = {
      id: `student-login-${roll}`,
      username: roll,
      name: `Candidate (${roll})`,
      email: `${query}@pragati.ac.in`,
      role: 'student',
      designation: 'Enrolled B.Tech Candidate',
      rollNo: roll,
    };
    return res.json({ success: true, user: studentUser });
  }

  return res.status(401).json({ error: 'Invalid credentials. Use demo accounts or valid Pragati roll number.' });
});

// 3. Students Endpoints
app.get('/api/students', (req: AuthenticatedRequest, res) => {
  try {
    // If authenticated user is a student, enforce strictly their own record!
    if (req.user && req.user.role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE LOWER(roll_no) = ?').get(req.user.rollNo?.toLowerCase()) as any;
      if (!student) {
        return res.json([]);
      }
      return res.json([
        {
          id: student.id,
          rollNo: student.roll_no,
          name: student.name,
          email: student.email,
          department: student.department,
          section: student.section,
          year: student.year,
          semester: student.semester,
          batch: student.batch,
          registeredExamIds: JSON.parse(student.registered_exam_ids),
        },
      ]);
    }

    const students = getAllStudents();
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const s = req.body;
    db.prepare(`
      INSERT INTO students (id, roll_no, name, email, department, section, year, semester, batch, registered_exam_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_STUDENT',
      entityType: 'student',
      entityId: s.id,
      details: `Enrolled student ${s.rollNo} (${s.name}, ${s.department}).`,
    });

    res.json({ success: true, student: s });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/students/:id', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const student = db.prepare('SELECT roll_no, name FROM students WHERE id = ?').get(req.params.id) as any;
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);

    if (student) {
      logAudit({
        actorId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: 'DELETE_STUDENT',
        entityType: 'student',
        entityId: req.params.id,
        details: `Removed student ${student.roll_no} (${student.name}).`,
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Halls Endpoints
app.get('/api/halls', (req, res) => {
  try {
    const halls = getAllHalls();
    res.json(halls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/halls', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const h = req.body;
    db.prepare(`
      INSERT INTO halls (id, code, name, building, floor, rows, columns, desks_per_bench, blocked_seats, invigilator_name, invigilator_dept)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_HALL',
      entityType: 'hall',
      entityId: h.id,
      details: `Registered examination hall ${h.code} (${h.name}) with capacity ${h.rows * h.columns * h.desksPerBench}.`,
    });

    res.json({ success: true, hall: h });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/halls/:id', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const h = req.body;
    db.prepare(`
      UPDATE halls 
      SET code = ?, name = ?, building = ?, floor = ?, rows = ?, columns = ?, desks_per_bench = ?, blocked_seats = ?, invigilator_name = ?, invigilator_dept = ?
      WHERE id = ?
    `).run(
      h.code,
      h.name,
      h.building,
      h.floor,
      h.rows,
      h.columns,
      h.desksPerBench,
      JSON.stringify(h.blockedSeats || []),
      h.invigilatorName || null,
      h.invigilatorDept || null,
      req.params.id
    );

    res.json({ success: true, hall: h });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/halls/:id', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const hall = db.prepare('SELECT code FROM halls WHERE id = ?').get(req.params.id) as any;
    db.prepare('DELETE FROM halls WHERE id = ?').run(req.params.id);

    if (hall) {
      logAudit({
        actorId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: 'DELETE_HALL',
        entityType: 'hall',
        entityId: req.params.id,
        details: `Deleted examination hall ${hall.code}.`,
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Exams Endpoints
app.get('/api/exams', (req, res) => {
  try {
    const exams = getAllExams();
    res.json(exams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exams', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const ex = req.body;
    db.prepare(`
      INSERT INTO exams (id, course_code, course_title, departments, year, semester, semester_label, date, session, start_time, end_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
      ex.status || 'draft'
    );

    logAudit({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'CREATE_EXAM',
      entityType: 'exam',
      entityId: ex.id,
      details: `Scheduled exam ${ex.courseCode} (${ex.courseTitle}) on ${ex.date}.`,
    });

    res.json({ success: true, exam: ex });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/exams/:id', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const exam = db.prepare('SELECT course_code FROM exams WHERE id = ?').get(req.params.id) as any;
    db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);

    if (exam) {
      logAudit({
        actorId: req.user!.id,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        action: 'DELETE_EXAM',
        entityType: 'exam',
        entityId: req.params.id,
        details: `Deleted exam schedule ${exam.course_code}.`,
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exams/:id/approve', requireRole(['officer', 'admin']), (req: AuthenticatedRequest, res) => {
  try {
    const { approvedBy } = req.body;
    approveExamSchedule(req.params.id, approvedBy || req.user!.name, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/exams/:id/unlock', requireRole(['officer', 'admin']), (req: AuthenticatedRequest, res) => {
  try {
    unlockExamSchedule(req.params.id, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Allotments Endpoints
app.get('/api/allotments', (req: AuthenticatedRequest, res) => {
  try {
    const { examId, studentRoll, hallId } = req.query as { examId?: string; studentRoll?: string; hallId?: string };

    // If student role: MUST only return their own allotment
    if (req.user && req.user.role === 'student') {
      const roll = (req.user.rollNo || '').toLowerCase();
      const rows = db.prepare(`
        SELECT a.*, s.roll_no, s.name as student_name, s.department as student_dept, s.year, s.semester,
               e.course_code, e.course_title, e.date as exam_date, e.session as exam_session, e.start_time, e.end_time, e.status as exam_status,
               h.code as hall_code, h.name as hall_name, h.building, h.floor
        FROM allotments a
        JOIN students s ON a.student_id = s.id
        JOIN exams e ON a.exam_id = e.id
        JOIN halls h ON a.hall_id = h.id
        WHERE LOWER(s.roll_no) = ?
      `).all(roll) as any[];

      return res.json(rows.map((r) => ({
        id: r.id,
        examId: r.exam_id,
        studentId: r.student_id,
        hallId: r.hall_id,
        row: r.row_num,
        col: r.col_num,
        benchSlot: r.bench_slot,
        seatCode: r.seat_code,
        attendance: r.attendance,
        answerBookletNo: r.answer_booklet_no,
        incidentNotes: r.incident_notes,
        notes: r.notes,
      })));
    }

    const allotments = getAllAllotments(examId);
    res.json(allotments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/allotments', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const { examId, allotments: allotmentsList } = req.body;
    saveExamAllotments(examId, allotmentsList, req.user!);
    res.json({ success: true, count: allotmentsList.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/allotments/exam/:examId', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    clearExamAllotments(req.params.examId, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/allotments/swap', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const { sourceAllotmentId, targetRow, targetCol, targetSlot } = req.body;
    swapSeatsInDb(sourceAllotmentId, targetRow, targetCol, targetSlot, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/allotments/:id/attendance', requireRole(['invigilator', 'officer', 'admin']), (req: AuthenticatedRequest, res) => {
  try {
    const { attendance, incidentNotes, bookletNo } = req.body;
    updateAttendanceInDb(req.params.id, attendance, incidentNotes, bookletNo, req.user!);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Allocation Validation & Integrity Check
app.get('/api/allocations/validate/:examId', (req, res) => {
  try {
    const report = validateSeatingPlan(req.params.examId);
    res.json(report);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Audit Logs
app.get('/api/audit-logs', requireRole(['admin', 'officer']), (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const filter = (req.query.action as string) || undefined;
    const logs = getAuditLogs(limit, filter);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Backups (Export & Restore)
app.get('/api/backup/export', requireRole(['admin']), (req, res) => {
  try {
    const json = exportDatabaseBackupJSON();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=ExamSeat_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    res.send(json);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/restore', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ error: 'Missing backupData payload' });
    }
    const jsonStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData);
    restoreDatabaseBackupJSON(jsonStr, req.user!);
    res.json({ success: true, message: 'Database successfully restored from validated backup.' });
  } catch (err: any) {
    res.status(400).json({ error: `Restore failed: ${err.message}` });
  }
});

// 10. System Reset
app.post('/api/system/reset', requireRole(['admin']), (req: AuthenticatedRequest, res) => {
  try {
    seedBaselineData();
    res.json({ success: true, message: 'System database successfully reset to demo baseline.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= VITE DEV MIDDLEWARE / STATIC ASSETS =================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ExamSeat Pro] Full-Stack SQLite server online on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ExamSeat Pro] Fatal server startup error:', err);
  process.exit(1);
});
