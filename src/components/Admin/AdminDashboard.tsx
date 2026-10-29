import React, { useState } from 'react';
import {
  AllocationResult,
  ExamHall,
  ExamSchedule,
  PrintableReportType,
  SeatAllotment,
  Student,
} from '../../types';
import { AllocationWizard } from './AllocationWizard';
import { HallManager } from './HallManager';
import { StudentManager } from './StudentManager';
import { ExamManager } from './ExamManager';
import {
  Zap,
  Building,
  Users,
  BookOpen,
  TableProperties,
  Download,
  Printer,
  Search,
} from 'lucide-react';

interface AdminDashboardProps {
  students: Student[];
  halls: ExamHall[];
  exams: ExamSchedule[];
  allotments: SeatAllotment[];
  onSaveAllotments: (examId: string, newAllotments: SeatAllotment[], result: AllocationResult) => void;
  onClearAllotments: (examId: string) => void;
  onSwapSeats?: (sourceAllotmentId: string, targetRow: number, targetCol: number, targetSlot: 'A' | 'B') => void;
  onOpenPrintReport?: (type: PrintableReportType, hall?: ExamHall, exam?: ExamSchedule) => void;
  onAddHall: (hall: ExamHall) => void;
  onUpdateHall: (hall: ExamHall) => void;
  onDeleteHall: (hallId: string) => void;
  onAddStudent: (student: Student) => void;
  onBulkAddStudents: (newStudents: Student[]) => void;
  onDeleteStudent: (studentId: string) => void;
  onAddExam: (exam: ExamSchedule) => void;
  onDeleteExam: (examId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  halls,
  exams,
  allotments,
  onSaveAllotments,
  onClearAllotments,
  onSwapSeats,
  onOpenPrintReport,
  onAddHall,
  onUpdateHall,
  onDeleteHall,
  onAddStudent,
  onBulkAddStudents,
  onDeleteStudent,
  onAddExam,
  onDeleteExam,
}) => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'matrix' | 'halls' | 'students' | 'exams'>('wizard');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixHallFilter, setMatrixHallFilter] = useState('all');

  // Overall university metrics
  const totalStudents = students.length;
  const totalHalls = halls.length;
  const totalDesks = halls.reduce(
    (acc, h) => acc + (h.rows * h.columns * h.desksPerBench - h.blockedSeats.length),
    0
  );
  const totalBlocked = halls.reduce((acc, h) => acc + h.blockedSeats.length, 0);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const hallMap = new Map(halls.map((h) => [h.id, h]));

  // Allotments for matrix tab
  const currentExamAllotments = allotments.filter((a) => a.examId === currentExam?.id);

  const filteredMatrixAllotments = currentExamAllotments.filter((a) => {
    const student = studentMap.get(a.studentId);
    if (!student) return false;

    const matchesSearch =
      !matrixSearch.trim() ||
      student.rollNo.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      student.name.toLowerCase().includes(matrixSearch.toLowerCase()) ||
      a.seatCode.toLowerCase().includes(matrixSearch.toLowerCase());

    const matchesHall = matrixHallFilter === 'all' || a.hallId === matrixHallFilter;

    return matchesSearch && matchesHall;
  });

  // CSV Export for Allotments
  const handleExportAllotmentsCSV = () => {
    if (!currentExam) return;
    const rows = [
      ['Sl No', 'Roll Number', 'Candidate Name', 'Department', 'Semester', 'Section', 'Hall Code', 'Hall Name', 'Seat Code', 'Row', 'Column', 'Attendance'],
      ...filteredMatrixAllotments.map((a, idx) => {
        const student = studentMap.get(a.studentId);
        const hall = hallMap.get(a.hallId);
        return [
          idx + 1,
          student?.rollNo || '',
          student?.name || '',
          student?.department || '',
          student?.semester ? `Sem ${student.semester}` : '',
          student?.section || '',
          hall?.code || '',
          hall?.name || '',
          a.seatCode,
          a.row,
          a.col,
          a.attendance,
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map(val => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExamSeatPro_Allotments_${currentExam.courseCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4.5 shadow-xs hover:border-[#C58F91] transition-all">
          <span className="text-xs text-[#76676A] block font-semibold">Registered Students</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#352A2B] tabular-nums mt-1 block">
            {totalStudents}
          </span>
          <span className="text-[11px] text-[#99888A] block mt-1">Across 10 Specializations</span>
        </div>

        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4.5 shadow-xs hover:border-[#C58F91] transition-all">
          <span className="text-xs text-[#76676A] block font-semibold">Active Examination Halls</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#A96873] tabular-nums mt-1 block">
            {totalHalls}
          </span>
          <span className="text-[11px] text-[#99888A] block mt-1">Aryabhata & Kalam Blocks</span>
        </div>

        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4.5 shadow-xs hover:border-[#059669] transition-all">
          <span className="text-xs text-[#76676A] block font-semibold">Available Desks</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#059669] tabular-nums mt-1 block">
            {totalDesks}
          </span>
          <span className="text-[11px] text-[#99888A] block mt-1">
            {totalBlocked} physically blocked
          </span>
        </div>

        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4.5 shadow-xs hover:border-[#C58F91] transition-all">
          <span className="text-xs text-[#76676A] block font-semibold">Active Exam Papers</span>
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#C58F91] tabular-nums mt-1 block">
            {exams.length}
          </span>
          <span className="text-[11px] text-[#99888A] block mt-1">B.Tech 8 Semesters Session</span>
        </div>
      </div>

      {/* Sub navigation bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl w-fit overflow-x-auto max-w-full shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('wizard')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'wizard'
              ? 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2] shadow-xs'
              : 'text-[#76676A] hover:text-[#352A2B] hover:bg-[#F1E5DC]/50'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${activeTab === 'wizard' ? 'text-[#A96873]' : 'text-[#76676A]'}`} />
          <span>Allocation Engine</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2] shadow-xs'
              : 'text-[#76676A] hover:text-[#352A2B] hover:bg-[#F1E5DC]/50'
          }`}
        >
          <TableProperties className={`w-3.5 h-3.5 ${activeTab === 'matrix' ? 'text-[#A96873]' : 'text-[#76676A]'}`} />
          <span>Master Seating Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('halls')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'halls'
              ? 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2] shadow-xs'
              : 'text-[#76676A] hover:text-[#352A2B] hover:bg-[#F1E5DC]/50'
          }`}
        >
          <Building className={`w-3.5 h-3.5 ${activeTab === 'halls' ? 'text-[#A96873]' : 'text-[#76676A]'}`} />
          <span>Halls & Desks ({halls.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'students'
              ? 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2] shadow-xs'
              : 'text-[#76676A] hover:text-[#352A2B] hover:bg-[#F1E5DC]/50'
          }`}
        >
          <Users className={`w-3.5 h-3.5 ${activeTab === 'students' ? 'text-[#A96873]' : 'text-[#76676A]'}`} />
          <span>Students Roster ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2] shadow-xs'
              : 'text-[#76676A] hover:text-[#352A2B] hover:bg-[#F1E5DC]/50'
          }`}
        >
          <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'exams' ? 'text-[#A96873]' : 'text-[#76676A]'}`} />
          <span>Exam Schedules ({exams.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'wizard' && (
        <AllocationWizard
          exams={exams}
          halls={halls}
          students={students}
          allotments={allotments}
          onSaveAllotments={onSaveAllotments}
          onClearAllotments={onClearAllotments}
          onSwapSeats={onSwapSeats}
        />
      )}

      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
                  <TableProperties className="w-5 h-5 text-[#A96873]" />
                  <span>Consolidated Master Seating Matrix</span>
                </h3>
                <p className="text-xs text-[#76676A] mt-0.5">
                  Roll-number ordered seating matrix across all examination halls with instant CSV export and consolidated printing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="text-xs font-semibold py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.courseCode}: {ex.courseTitle}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportAllotmentsCSV}
                  disabled={currentExamAllotments.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#352A2B] border border-[#E5D3D0] disabled:opacity-40 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#A96873]" />
                  <span>Export Allotment CSV</span>
                </button>

                {onOpenPrintReport && (
                  <button
                    type="button"
                    onClick={() => onOpenPrintReport('master_roster', undefined, currentExam)}
                    disabled={currentExamAllotments.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 btn-rose-primary disabled:opacity-40 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Master Matrix</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter controls */}
            <div className="mt-4 pt-4 border-t border-[#E5D3D0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#99888A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search roll no, candidate, seat code..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] placeholder:text-[#99888A] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-[#76676A] font-semibold">Filter Hall:</span>
                <select
                  value={matrixHallFilter}
                  onChange={(e) => setMatrixHallFilter(e.target.value)}
                  className="text-xs py-1.5 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
                >
                  <option value="all">All Halls ({currentExamAllotments.length} Allotted)</option>
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.code} — {h.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F1E5DC]/70 border-b border-[#E5D3D0] text-[#76676A] font-semibold">
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4 font-mono">Roll Number</th>
                    <th className="py-2.5 px-4">Candidate Name</th>
                    <th className="py-2.5 px-4">Department & Sec</th>
                    <th className="py-2.5 px-4 font-mono">Hall</th>
                    <th className="py-2.5 px-4 font-mono">Seat Code</th>
                    <th className="py-2.5 px-4 text-center">Desk Position</th>
                    <th className="py-2.5 px-4 text-center">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5D3D0]/70">
                  {filteredMatrixAllotments.length > 0 ? (
                    filteredMatrixAllotments.map((allot, idx) => {
                      const student = studentMap.get(allot.studentId);
                      const hall = hallMap.get(allot.hallId);
                      return (
                        <tr key={allot.id} className="hover:bg-[#F6E0E2]/40 transition-colors">
                          <td className="py-2.5 px-4 text-center font-mono text-[#99888A]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-[#A96873]">
                            {student?.rollNo || '—'}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-[#352A2B]">
                            {student?.name || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-[#76676A]">
                            {student?.department} · Sec {student?.section}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-[#352A2B]">
                            {hall?.code || '—'}
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-[#059669]">
                            {allot.seatCode}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-[#76676A]">
                            Row {allot.row}, Col {allot.col}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`inline-block font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                allot.attendance === 'present'
                                  ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                                  : allot.attendance === 'absent'
                                  ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                                  : allot.attendance === 'malpractice'
                                  ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                                  : 'bg-[#F1E5DC] text-[#76676A] border-[#E5D3D0]'
                              }`}
                            >
                              {allot.attendance}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#76676A]">
                        {currentExamAllotments.length === 0
                          ? 'No seating allocations generated for this course yet. Run the Allocation Engine first.'
                          : 'No candidates match the current search or hall filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'halls' && (
        <HallManager
          halls={halls}
          onAddHall={onAddHall}
          onUpdateHall={onUpdateHall}
          onDeleteHall={onDeleteHall}
        />
      )}

      {activeTab === 'students' && (
        <StudentManager
          students={students}
          exams={exams}
          onAddStudent={onAddStudent}
          onBulkAddStudents={onBulkAddStudents}
          onDeleteStudent={onDeleteStudent}
        />
      )}

      {activeTab === 'exams' && (
        <ExamManager
          exams={exams}
          onAddExam={onAddExam}
          onDeleteExam={onDeleteExam}
        />
      )}
    </div>
  );
};
