import {
  AllocationResult,
  AllocationValidationReport,
  AttendanceStatus,
  AuditLogEntry,
  AuthUser,
  DatabaseStats,
  ExamHall,
  ExamSchedule,
  SeatAllotment,
  Student,
} from '../types';
import { getStoredUser } from './authService';

function getAuthHeaders(): HeadersInit {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role;
    headers['x-user-name'] = encodeURIComponent(user.name);
    headers['x-user-email'] = user.email || '';
    if (user.rollNo) {
      headers['x-student-roll'] = user.rollNo;
    }
  }
  return headers;
}

export async function fetchHealth(): Promise<{ status: string; engine: string }> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Backend offline');
  return res.json();
}

export async function fetchDatabaseStats(): Promise<DatabaseStats> {
  const res = await fetch('/api/stats', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load database stats');
  return res.json();
}

export async function loginWithApi(username: string, password?: string): Promise<{ success: boolean; user: AuthUser }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function fetchAllStudents(): Promise<Student[]> {
  const res = await fetch('/api/students', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch student records');
  return res.json();
}

export async function createStudent(student: Student): Promise<Student> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(student),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create student');
  return student;
}

export async function deleteStudent(studentId: string): Promise<void> {
  const res = await fetch(`/api/students/${studentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete student');
}

export async function fetchAllHalls(): Promise<ExamHall[]> {
  const res = await fetch('/api/halls', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch examination halls');
  return res.json();
}

export async function createHall(hall: ExamHall): Promise<ExamHall> {
  const res = await fetch('/api/halls', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(hall),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create hall');
  return hall;
}

export async function updateHall(hall: ExamHall): Promise<ExamHall> {
  const res = await fetch(`/api/halls/${hall.id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(hall),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update hall');
  return hall;
}

export async function deleteHall(hallId: string): Promise<void> {
  const res = await fetch(`/api/halls/${hallId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete examination hall');
}

export async function fetchAllExams(): Promise<ExamSchedule[]> {
  const res = await fetch('/api/exams', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch examination schedules');
  return res.json();
}

export async function createExam(exam: ExamSchedule): Promise<ExamSchedule> {
  const res = await fetch('/api/exams', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(exam),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create exam');
  return exam;
}

export async function deleteExam(examId: string): Promise<void> {
  const res = await fetch(`/api/exams/${examId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete exam');
}

export async function approveExamApi(examId: string, approvedBy: string): Promise<void> {
  const res = await fetch(`/api/exams/${examId}/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ approvedBy }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve exam');
}

export async function unlockExamApi(examId: string): Promise<void> {
  const res = await fetch(`/api/exams/${examId}/unlock`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to unlock exam');
}

export async function fetchAllotments(examId?: string): Promise<SeatAllotment[]> {
  const url = examId ? `/api/allotments?examId=${encodeURIComponent(examId)}` : '/api/allotments';
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch seating allotments');
  return res.json();
}

export async function saveExamAllotmentsApi(examId: string, allotments: SeatAllotment[]): Promise<void> {
  const res = await fetch('/api/allotments', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ examId, allotments }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save allotments to database');
}

export async function clearExamAllotmentsApi(examId: string): Promise<void> {
  const res = await fetch(`/api/allotments/exam/${examId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to clear allotments');
}

export async function swapSeatsApi(
  sourceAllotmentId: string,
  targetRow: number,
  targetCol: number,
  targetSlot: 'A' | 'B'
): Promise<void> {
  const res = await fetch('/api/allotments/swap', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sourceAllotmentId, targetRow, targetCol, targetSlot }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to execute desk swap');
}

export async function updateAttendanceApi(
  allotmentId: string,
  attendance: AttendanceStatus,
  incidentNotes?: string,
  bookletNo?: string
): Promise<void> {
  const res = await fetch(`/api/allotments/${allotmentId}/attendance`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ attendance, incidentNotes, bookletNo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record attendance');
}

export async function validateSeatingPlanApi(examId: string): Promise<AllocationValidationReport> {
  const res = await fetch(`/api/allocations/validate/${examId}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to validate plan');
  return data;
}

export async function fetchAuditLogs(limit = 100, action?: string): Promise<AuditLogEntry[]> {
  const url = action ? `/api/audit-logs?limit=${limit}&action=${encodeURIComponent(action)}` : `/api/audit-logs?limit=${limit}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to retrieve audit log trail');
  return res.json();
}

export async function restoreBackupApi(backupPayload: any): Promise<void> {
  const res = await fetch('/api/backup/restore', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ backupData: backupPayload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Restore validation error');
}

export async function resetDatabaseApi(): Promise<void> {
  const res = await fetch('/api/system/reset', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Reset failed');
}
