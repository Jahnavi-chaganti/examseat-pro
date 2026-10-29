import React, { useState } from 'react';
import {
  AttendanceStatus,
  ExamHall,
  ExamSchedule,
  PrintableReportType,
  SeatAllotment,
  Student,
} from '../../types';
import { SeatingGridVisualizer } from '../Common/SeatingGridVisualizer';
import { Printer, Check, X, AlertTriangle, Users, FileText, Search, ShieldAlert } from 'lucide-react';

interface InvigilatorConsoleProps {
  halls: ExamHall[];
  exams: ExamSchedule[];
  students: Student[];
  allotments: SeatAllotment[];
  onUpdateAttendance: (allotmentId: string, status: AttendanceStatus, notes?: string) => void;
  onOpenPrintReport: (type: PrintableReportType, hall: ExamHall, exam: ExamSchedule) => void;
}

export const InvigilatorConsole: React.FC<InvigilatorConsoleProps> = ({
  halls,
  exams,
  students,
  allotments,
  onUpdateAttendance,
  onOpenPrintReport,
}) => {
  const [selectedHallId, setSelectedHallId] = useState<string>(halls[0]?.id || '');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'layout'>('roster');

  // Incident log dialog state
  const [incidentTarget, setIncidentTarget] = useState<{
    allotmentId: string;
    studentName: string;
    rollNo: string;
    seatCode: string;
  } | null>(null);
  const [incidentReason, setIncidentReason] = useState('Unauthorized chits / paper notes found');
  const [confiscatedItems, setConfiscatedItems] = useState('Notes confiscated, answer booklet replaced');

  const currentHall = halls.find((h) => h.id === selectedHallId) || halls[0];
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const studentMap = new Map(students.map((s) => [s.id, s]));

  // Allotments in this hall for this exam
  const currentAllotments = allotments
    .filter((a) => a.hallId === currentHall?.id && a.examId === currentExam?.id)
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      if (a.col !== b.col) return a.col - b.col;
      return a.benchSlot.localeCompare(b.benchSlot);
    });

  const filteredAllotments = currentAllotments.filter((a) => {
    if (!searchFilter.trim()) return true;
    const s = studentMap.get(a.studentId);
    if (!s) return false;
    const query = searchFilter.toLowerCase();
    return (
      s.rollNo.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query) ||
      a.seatCode.toLowerCase().includes(query) ||
      s.department.toLowerCase().includes(query)
    );
  });

  // Attendance metrics
  const totalStudents = currentAllotments.length;
  const presentCount = currentAllotments.filter((a) => a.attendance === 'present').length;
  const absentCount = currentAllotments.filter((a) => a.attendance === 'absent').length;
  const malpracticeCount = currentAllotments.filter((a) => a.attendance === 'malpractice').length;
  const unmarkedCount = currentAllotments.filter((a) => a.attendance === 'unmarked').length;

  const handleMarkAllPresent = () => {
    for (const a of currentAllotments) {
      if (a.attendance === 'unmarked') {
        onUpdateAttendance(a.id, 'present');
      }
    }
  };

  const handleOpenMalpracticeModal = (allot: SeatAllotment, studentName: string, rollNo: string) => {
    setIncidentTarget({
      allotmentId: allot.id,
      studentName,
      rollNo,
      seatCode: allot.seatCode,
    });
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTarget) return;

    const notes = `${incidentReason} | Action: ${confiscatedItems} (Reported by Invigilator)`;
    onUpdateAttendance(incidentTarget.allotmentId, 'malpractice', notes);
    setIncidentTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="text-xs font-bold text-[#352A2B] block mb-1.5">
              Select Examination Hall:
            </label>
            <select
              value={selectedHallId}
              onChange={(e) => setSelectedHallId(e.target.value)}
              className="w-full text-xs font-semibold py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
            >
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} — {h.name} ({h.building})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#352A2B] block mb-1.5">
              Select Course / Schedule:
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full text-xs font-semibold py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.courseCode}: {ex.courseTitle} ({ex.session})
                </option>
              ))}
            </select>
          </div>

          {/* Printable Reports Dropdown / Buttons */}
          <div className="flex items-end gap-2 pt-1 md:pt-0">
            <button
              type="button"
              onClick={() => onOpenPrintReport('door_chart', currentHall, currentExam)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 btn-rose-primary rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Door Chart</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenPrintReport('attendance_sheet', currentHall, currentExam)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#352A2B] border border-[#E5D3D0] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#A96873]" />
              <span>Roster Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenPrintReport('desk_slips', currentHall, currentExam)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#352A2B] border border-[#E5D3D0] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-[#A96873]" />
              <span>Desk Slips</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invigilation Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4 shadow-xs">
          <span className="text-xs text-[#76676A] font-semibold block">Total Allotted</span>
          <span className="text-2xl font-bold font-mono text-[#352A2B] tabular-nums mt-0.5 block">
            {totalStudents}
          </span>
          <span className="text-[11px] text-[#76676A] block mt-0.5">Hall {currentHall.code}</span>
        </div>

        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4 shadow-xs">
          <span className="text-xs text-[#76676A] font-semibold block">Present</span>
          <span className="text-2xl font-bold font-mono text-[#059669] tabular-nums mt-0.5 block">
            {presentCount}
          </span>
          <span className="text-[11px] text-[#059669] block mt-0.5 font-semibold">
            {totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0}% Attendance
          </span>
        </div>

        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4 shadow-xs">
          <span className="text-xs text-[#76676A] font-semibold block">Absent</span>
          <span className="text-2xl font-bold font-mono text-[#DC2626] tabular-nums mt-0.5 block">
            {absentCount}
          </span>
          <span className="text-[11px] text-[#DC2626] block mt-0.5 font-semibold">Missing Candidates</span>
        </div>

        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4 shadow-xs">
          <span className="text-xs text-[#76676A] font-semibold block">Malpractice Cases</span>
          <span className="text-2xl font-bold font-mono text-[#D97706] tabular-nums mt-0.5 block">
            {malpracticeCount}
          </span>
          <span className="text-[11px] text-[#D97706] block mt-0.5 font-semibold">
            {malpracticeCount > 0 ? 'Incidents Logged' : 'Zero Violations'}
          </span>
        </div>

        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-xs text-[#76676A] font-semibold block">Quick Action</span>
          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={unmarkedCount === 0}
            className="mt-2 w-full py-1.5 px-2 bg-[#D1FAE5] text-[#059669] hover:bg-[#A7F3D0] border border-[#A7F3D0] rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Mark Rest Present
          </button>
        </div>
      </div>

      {/* Main Content: Tabs for Roster vs Layout */}
      <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl shadow-xs overflow-hidden">
        {/* Sub-navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-[#E5D3D0] gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#FFF9F6] border border-[#E5D3D0] rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-[#F6E0E2] text-[#A96873] shadow-xs border border-[#E9BFC2]'
                  : 'text-[#76676A] hover:text-[#352A2B]'
              }`}
            >
              Candidate Roster List ({currentAllotments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                activeTab === 'layout'
                  ? 'bg-[#F6E0E2] text-[#A96873] shadow-xs border border-[#E9BFC2]'
                  : 'text-[#76676A] hover:text-[#352A2B]'
              }`}
            >
              2D Seating Layout Map
            </button>
          </div>

          {activeTab === 'roster' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#99888A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter candidate, roll no, seat..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] placeholder:text-[#99888A] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] w-full sm:w-64"
              />
            </div>
          )}
        </div>

        {activeTab === 'roster' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F1E5DC]/70 border-b border-[#E5D3D0] text-[#76676A] font-semibold">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4 font-mono">Seat Code</th>
                  <th className="py-2.5 px-4 font-mono">Roll Number</th>
                  <th className="py-2.5 px-4">Candidate Name</th>
                  <th className="py-2.5 px-4">Department & Sec</th>
                  <th className="py-2.5 px-4 text-center">Attendance Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D3D0]/60">
                {filteredAllotments.length > 0 ? (
                  filteredAllotments.map((allot, idx) => {
                    const student = studentMap.get(allot.studentId);
                    return (
                      <tr key={allot.id} className="hover:bg-[#F6E0E2]/40 transition-colors">
                        <td className="py-2.5 px-4 text-center font-mono text-[#99888A]">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#059669]">
                          {allot.seatCode}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-[#A96873]">
                          {student?.rollNo || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-[#352A2B]">
                          <div>{student?.name || '—'}</div>
                          {allot.incidentNotes && (
                            <div className="text-[10px] text-[#D97706] font-mono mt-0.5 truncate max-w-xs">
                              {allot.incidentNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-[#76676A]">
                          {student?.department} · Sec {student?.section}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`inline-block font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                              allot.attendance === 'present'
                                ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                                : allot.attendance === 'absent'
                                ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                                : allot.attendance === 'malpractice'
                                ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] font-bold'
                                : 'bg-[#F1E5DC] text-[#76676A] border-[#E5D3D0]'
                            }`}
                          >
                            {allot.attendance}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onUpdateAttendance(allot.id, 'present')}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                allot.attendance === 'present'
                                  ? 'bg-[#059669] text-white border-[#059669]'
                                  : 'text-[#76676A] border-[#E5D3D0] hover:text-[#059669] hover:bg-[#D1FAE5]'
                              }`}
                              title="Mark Present"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateAttendance(allot.id, 'absent')}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                allot.attendance === 'absent'
                                  ? 'bg-[#DC2626] text-white border-[#DC2626]'
                                  : 'text-[#76676A] border-[#E5D3D0] hover:text-[#DC2626] hover:bg-[#FEE2E2]'
                              }`}
                              title="Mark Absent"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenMalpracticeModal(
                                  allot,
                                  student?.name || '',
                                  student?.rollNo || ''
                                )
                              }
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                allot.attendance === 'malpractice'
                                  ? 'bg-[#D97706] text-white border-[#D97706]'
                                  : 'text-[#76676A] border-[#E5D3D0] hover:text-[#D97706] hover:bg-[#FEF3C7]'
                              }`}
                              title="Log Malpractice Incident"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#76676A]">
                      No candidates found matching the query in this hall.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <SeatingGridVisualizer
              hall={currentHall}
              allotments={allotments}
              students={students}
              onUpdateAttendance={onUpdateAttendance}
            />
          </div>
        )}
      </div>

      {/* Malpractice Incident Modal */}
      {incidentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352A2B]/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveIncident}
            className="bg-[#FFFCF8] rounded-2xl shadow-2xl border border-[#E5D3D0] max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#E5D3D0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] rounded-xl">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#352A2B]">Log Malpractice Report</h4>
                  <p className="text-xs text-[#76676A]">
                    Candidate: {incidentTarget.studentName} ({incidentTarget.rollNo}) · Seat {incidentTarget.seatCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIncidentTarget(null)}
                className="text-[#76676A] hover:text-[#352A2B] p-1 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#352A2B] block mb-1.5">
                  Type of Violation:
                </label>
                <select
                  value={incidentReason}
                  onChange={(e) => setIncidentReason(e.target.value)}
                  className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-xl focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
                >
                  <option value="Unauthorized chits / paper notes found">
                    Unauthorized chits / paper notes found
                  </option>
                  <option value="Electronic device / smartwatch detected">
                    Electronic device / smartwatch detected
                  </option>
                  <option value="Copying / peering into adjacent candidate's answer sheet">
                    Copying / peering into adjacent candidate's answer sheet
                  </option>
                  <option value="Verbal communication or exchanging stationary">
                    Verbal communication or exchanging stationary
                  </option>
                  <option value="Refusing invigilator instruction / disorderly conduct">
                    Refusing invigilator instruction / disorderly conduct
                  </option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#352A2B] block mb-1.5">
                  Invigilator Remarks & Confiscated Items:
                </label>
                <textarea
                  rows={3}
                  value={confiscatedItems}
                  onChange={(e) => setConfiscatedItems(e.target.value)}
                  className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-xl focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] font-mono text-xs"
                  placeholder="Describe evidence confiscated and actions taken..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5D3D0]">
              <button
                type="button"
                onClick={() => setIncidentTarget(null)}
                className="px-4 py-2 text-[#76676A] hover:text-[#352A2B] hover:bg-[#F6E0E2] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 btn-rose-primary text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
              >
                File Report & Mark Debarred
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
