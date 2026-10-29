import React, { useState, useEffect, useCallback } from 'react';
import {
  AllocationResult,
  AttendanceStatus,
  AuthUser,
  ExamHall,
  ExamSchedule,
  PrintableReportType,
  SeatAllotment,
  Student,
} from './types';
import {
  exportBackupJSON,
  loadInitialData,
  saveToStorage,
} from './services/storage';
import {
  clearUserSession,
  getStoredUser,
  saveUserSession,
} from './services/authService';
import {
  fetchAllStudents,
  fetchAllHalls,
  fetchAllExams,
  fetchAllotments,
  createStudent,
  deleteStudent,
  createHall,
  updateHall,
  deleteHall,
  createExam,
  deleteExam,
  approveExamApi,
  unlockExamApi,
  saveExamAllotmentsApi,
  clearExamAllotmentsApi,
  swapSeatsApi,
  updateAttendanceApi,
  resetDatabaseApi,
} from './services/apiClient';
import { LoginPage } from './components/Auth/LoginPage';
import { Header } from './components/Header';
import { RoleBanner } from './components/RoleBanner';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { OfficerAuditView } from './components/Officer/OfficerAuditView';
import { InvigilatorConsole } from './components/Invigilator/InvigilatorConsole';
import { StudentPortal } from './components/Student/StudentPortal';
import { PrintModal } from './components/PrintReports/PrintModal';
import { AuditTrailModal } from './components/Common/AuditTrailModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication session state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());

  // Core application database state
  const [students, setStudents] = useState<Student[]>([]);
  const [halls, setHalls] = useState<ExamHall[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [allotments, setAllotments] = useState<SeatAllotment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Notification feedback banner
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Audit and Database modal state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Print modal state
  const [printState, setPrintState] = useState<{
    isOpen: boolean;
    type: PrintableReportType;
    hall?: ExamHall;
    exam?: ExamSchedule;
    student?: Student;
    allotment?: SeatAllotment;
  }>({
    isOpen: false,
    type: 'none',
  });

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Synchronize state from SQLite backend with fallback to client storage
  const refreshAllData = useCallback(async () => {
    try {
      const [sData, hData, eData, aData] = await Promise.all([
        fetchAllStudents(),
        fetchAllHalls(),
        fetchAllExams(),
        fetchAllotments(),
      ]);

      setStudents(sData);
      setHalls(hData);
      setExams(eData);
      setAllotments(aData);
      saveToStorage(sData, hData, eData, aData);
      setIsLoaded(true);
    } catch (err: any) {
      console.warn('Backend SQLite sync warning (using cached fallback):', err.message);
      // Fallback to local storage if server is bootstrapping
      const cached = loadInitialData();
      setStudents(cached.students);
      setHalls(cached.halls);
      setExams(cached.exams);
      setAllotments(cached.allotments);
      setIsLoaded(true);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Re-fetch data when current user changes (e.g. login/logout for RBAC isolation)
  useEffect(() => {
    if (currentUser) {
      refreshAllData();
    }
  }, [currentUser, refreshAllData]);

  const handleLoginSuccess = (user: AuthUser) => {
    saveUserSession(user);
    setCurrentUser(user);
    showToast(`Welcome, ${user.name}! Access granted to ${user.role.toUpperCase()} portal.`);
  };

  const handleLogout = () => {
    clearUserSession();
    setCurrentUser(null);
    showToast('You have been signed out successfully.');
  };

  // Admin Handlers
  const handleSaveAllotments = async (
    examId: string,
    newAllotments: SeatAllotment[],
    result: AllocationResult
  ) => {
    try {
      await saveExamAllotmentsApi(examId, newAllotments);
      await refreshAllData();
      showToast(
        `Seating allocation saved to SQLite: ${newAllotments.length} desks allocated (${result.integrityScore}% anti-cheat separation).`
      );
    } catch (err: any) {
      showToast(`Allocation save error: ${err.message}`, true);
    }
  };

  const handleClearAllotments = async (examId: string) => {
    try {
      await clearExamAllotmentsApi(examId);
      await refreshAllData();
      showToast('Seating allotment cleared from database. Status reverted to Draft.');
    } catch (err: any) {
      showToast(`Clear error: ${err.message}`, true);
    }
  };

  const handleAddHall = async (hall: ExamHall) => {
    try {
      await createHall(hall);
      await refreshAllData();
      showToast(`Examination Hall ${hall.code} successfully registered in database.`);
    } catch (err: any) {
      showToast(`Hall registration error: ${err.message}`, true);
    }
  };

  const handleUpdateHall = async (hall: ExamHall) => {
    try {
      await updateHall(hall);
      await refreshAllData();
      showToast(`Hall ${hall.code} updated.`);
    } catch (err: any) {
      showToast(`Hall update error: ${err.message}`, true);
    }
  };

  const handleDeleteHall = async (hallId: string) => {
    try {
      await deleteHall(hallId);
      await refreshAllData();
      showToast('Hall removed from database inventory.');
    } catch (err: any) {
      showToast(`Delete hall error: ${err.message}`, true);
    }
  };

  const handleAddStudent = async (student: Student) => {
    try {
      await createStudent(student);
      await refreshAllData();
      showToast(`Candidate ${student.rollNo} (${student.name}) enrolled in database.`);
    } catch (err: any) {
      showToast(`Student enrolment error: ${err.message}`, true);
    }
  };

  const handleBulkAddStudents = async (newStudents: Student[]) => {
    try {
      for (const s of newStudents) {
        await createStudent(s);
      }
      await refreshAllData();
      showToast(`Bulk upload complete: ${newStudents.length} candidates stored in database.`);
    } catch (err: any) {
      showToast(`Bulk upload error: ${err.message}`, true);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      await refreshAllData();
      showToast('Candidate record removed from database.');
    } catch (err: any) {
      showToast(`Delete student error: ${err.message}`, true);
    }
  };

  const handleAddExam = async (exam: ExamSchedule) => {
    try {
      await createExam(exam);
      await refreshAllData();
      showToast(`Course ${exam.courseCode} scheduled on ${exam.date}.`);
    } catch (err: any) {
      showToast(`Exam schedule error: ${err.message}`, true);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await deleteExam(examId);
      await refreshAllData();
      showToast('Exam schedule and associated allotments removed from database.');
    } catch (err: any) {
      showToast(`Delete exam error: ${err.message}`, true);
    }
  };

  // Officer Handlers
  const handleApproveExam = async (examId: string, approvedBy: string) => {
    try {
      await approveExamApi(examId, approvedBy);
      await refreshAllData();
      showToast(`Seating plan formally approved and locked in database by ${approvedBy}.`);
    } catch (err: any) {
      showToast(`Approval error: ${err.message}`, true);
    }
  };

  const handleUnlockExam = async (examId: string) => {
    try {
      await unlockExamApi(examId);
      await refreshAllData();
      showToast('Seating plan unlocked for administrative adjustments.');
    } catch (err: any) {
      showToast(`Unlock error: ${err.message}`, true);
    }
  };

  // Invigilator Handlers
  const handleUpdateAttendance = async (
    allotmentId: string,
    status: AttendanceStatus,
    notes?: string,
    bookletNo?: string
  ) => {
    try {
      await updateAttendanceApi(allotmentId, status, notes, bookletNo);
      await refreshAllData();
      showToast(`Attendance updated: ${status.toUpperCase()}`);
    } catch (err: any) {
      showToast(`Attendance recording error: ${err.message}`, true);
    }
  };

  // Admin Seat Swapping & Manual Reassignment Handler
  const handleSwapSeats = async (
    sourceAllotmentId: string,
    targetRow: number,
    targetCol: number,
    targetSlot: 'A' | 'B'
  ) => {
    try {
      await swapSeatsApi(sourceAllotmentId, targetRow, targetCol, targetSlot);
      await refreshAllData();
      showToast('Desk reassignment stored in database successfully.');
    } catch (err: any) {
      showToast(`Desk swap error: ${err.message}`, true);
    }
  };

  // Reset demo data
  const handleResetData = async () => {
    if (window.confirm('Reset all examination data back to original Pragati demo baseline in SQLite?')) {
      try {
        await resetDatabaseApi();
        await refreshAllData();
        showToast('System database reset to demo university baseline.');
      } catch (err: any) {
        showToast(`Reset error: ${err.message}`, true);
      }
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const jsonStr = exportBackupJSON(students, halls, exams, allotments);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExamSeat_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Verified database backup downloaded.');
  };

  // Print Handlers
  const handleOpenPrintReport = (
    type: PrintableReportType,
    hall?: ExamHall,
    exam?: ExamSchedule
  ) => {
    setPrintState({
      isOpen: true,
      type,
      hall,
      exam,
    });
  };

  const handlePrintStudentSlip = (
    student: Student,
    hall: ExamHall,
    exam: ExamSchedule,
    allotment: SeatAllotment
  ) => {
    setPrintState({
      isOpen: true,
      type: 'student_slip',
      student,
      hall,
      exam,
      allotment,
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F8F0E8] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#A96873] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#76676A]">Connecting to ExamSeat Pro SQLite Database...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, strictly show the Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F0E8] text-[#352A2B] flex flex-col selection:bg-[#E9BFC2] selection:text-[#352A2B] relative">
      {/* Subtle warm rose ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#E9BFC2]/30 via-[#F6E0E2]/20 to-transparent pointer-events-none blur-3xl -z-10" />

      {/* Top Header with Authenticated Profile, DB badge and Logout */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
      />

      {/* Role Banner displaying authenticated responsibilities */}
      <RoleBanner currentRole={currentUser.role} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`no-print fixed bottom-5 right-5 z-50 text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border backdrop-blur-md animate-fade-in ${
            toastMessage.isError
              ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
              : 'bg-[#FFFCF8] border-[#E5D3D0] text-[#059669]'
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          )}
          <span className="text-[#352A2B] font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content Area: STRICT ROLE-BASED DASHBOARD ISOLATION */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentUser.role === 'admin' && (
          <AdminDashboard
            students={students}
            halls={halls}
            exams={exams}
            allotments={allotments}
            onSaveAllotments={handleSaveAllotments}
            onClearAllotments={handleClearAllotments}
            onSwapSeats={handleSwapSeats}
            onOpenPrintReport={handleOpenPrintReport}
            onAddHall={handleAddHall}
            onUpdateHall={handleUpdateHall}
            onDeleteHall={handleDeleteHall}
            onAddStudent={handleAddStudent}
            onBulkAddStudents={handleBulkAddStudents}
            onDeleteStudent={handleDeleteStudent}
            onAddExam={handleAddExam}
            onDeleteExam={handleDeleteExam}
          />
        )}

        {currentUser.role === 'officer' && (
          <OfficerAuditView
            exams={exams}
            halls={halls}
            students={students}
            allotments={allotments}
            onApproveExam={handleApproveExam}
            onUnlockExam={handleUnlockExam}
          />
        )}

        {currentUser.role === 'invigilator' && (
          <InvigilatorConsole
            halls={halls}
            exams={exams}
            students={students}
            allotments={allotments}
            onUpdateAttendance={handleUpdateAttendance}
            onOpenPrintReport={handleOpenPrintReport}
          />
        )}

        {currentUser.role === 'student' && (
          <StudentPortal
            students={students}
            halls={halls}
            exams={exams}
            allotments={allotments}
            initialRollNo={currentUser.rollNo}
            onPrintStudentSlip={handlePrintStudentSlip}
          />
        )}
      </main>

      {/* Audit History & Database Stats Modal */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onDataModified={refreshAllData}
        onShowToast={(msg) => showToast(msg)}
      />

      {/* Printable Report Modal */}
      {printState.isOpen && (
        <PrintModal
          reportType={printState.type}
          hall={printState.hall}
          halls={halls}
          exam={printState.exam}
          student={printState.student}
          allotment={printState.allotment}
          allotments={allotments}
          students={students}
          onClose={() => setPrintState({ isOpen: false, type: 'none' })}
        />
      )}

      {/* Institutional Footer */}
      <footer className="no-print bg-[#FFFCF8]/95 backdrop-blur-md border-t border-[#E5D3D0] mt-12 py-6 text-xs text-[#76676A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#352A2B]">ExamSeat Pro</span>
            <span aria-hidden="true" className="text-[#E5D3D0]">·</span>
            <span className="text-[#76676A]">Central Examination Seating Allotment System</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#76676A]">
            <span>Signed in as: <strong className="text-[#352A2B]">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
            <span aria-hidden="true" className="text-[#E5D3D0]">·</span>
            <span className="text-[#059669] flex items-center gap-1.5 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse inline-block" /> SQLite 3 ACID</span>
            <span aria-hidden="true" className="text-[#E5D3D0]">·</span>
            <span className="text-[#A96873] font-semibold">Anti-Cheat Mixed Mode Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
