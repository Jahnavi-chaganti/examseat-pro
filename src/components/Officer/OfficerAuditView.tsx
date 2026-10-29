import React, { useState } from 'react';
import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../../types';
import { SeatingGridVisualizer } from '../Common/SeatingGridVisualizer';
import { AllocationValidationModal } from '../Common/AllocationValidationModal';
import { ShieldCheck, CheckCircle2, AlertTriangle, Lock, Unlock, Sparkles, FileSearch } from 'lucide-react';

interface OfficerAuditViewProps {
  exams: ExamSchedule[];
  halls: ExamHall[];
  students: Student[];
  allotments: SeatAllotment[];
  onApproveExam: (examId: string, approvedBy: string) => void;
  onUnlockExam: (examId: string) => void;
}

export const OfficerAuditView: React.FC<OfficerAuditViewProps> = ({
  exams,
  halls,
  students,
  allotments,
  onApproveExam,
  onUnlockExam,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedHallId, setSelectedHallId] = useState<string>(halls[0]?.id || '');
  const [approverName, setApproverName] = useState('Dr. S. Sambhu Prasad (Principal & Chief Superintendent)');
  const [showValidationModal, setShowValidationModal] = useState(false);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const currentHall = halls.find((h) => h.id === selectedHallId) || halls[0];

  const studentMap = new Map(students.map((s) => [s.id, s]));

  // Exam-specific allotments
  const examAllotments = allotments.filter((a) => a.examId === currentExam?.id);
  const registeredStudents = students.filter((s) => s.registeredExamIds.includes(currentExam?.id));

  // Anti-collision and integrity analysis
  let duplicateStudents = 0;
  let duplicateSeats = 0;
  const seenStudentIds = new Set<string>();
  const seenSeatKeys = new Set<string>();

  for (const allot of examAllotments) {
    if (seenStudentIds.has(allot.studentId)) duplicateStudents++;
    seenStudentIds.add(allot.studentId);

    const seatKey = `${allot.hallId}-${allot.row}-${allot.col}-${allot.benchSlot}`;
    if (seenSeatKeys.has(seatKey)) duplicateSeats++;
    seenSeatKeys.add(seatKey);
  }

  // Neighbor branch diversity check
  let adjacentPairs = 0;
  let adjacentSameDept = 0;

  for (const hall of halls) {
    const hallAllots = examAllotments.filter((a) => a.hallId === hall.id);
    const gridMap = new Map<string, SeatAllotment>();
    for (const a of hallAllots) {
      gridMap.set(`${a.row},${a.col}`, a);
    }

    for (const a of hallAllots) {
      const studentA = studentMap.get(a.studentId);
      if (!studentA) continue;

      // Right neighbor
      const right = gridMap.get(`${a.row},${a.col + 1}`);
      if (right) {
        const studentB = studentMap.get(right.studentId);
        if (studentB) {
          adjacentPairs++;
          if (studentA.department === studentB.department) adjacentSameDept++;
        }
      }

      // Front neighbor
      const down = gridMap.get(`${a.row + 1},${a.col}`);
      if (down) {
        const studentB = studentMap.get(down.studentId);
        if (studentB) {
          adjacentPairs++;
          if (studentA.department === studentB.department) adjacentSameDept++;
        }
      }
    }
  }

  const integrityScore =
    adjacentPairs > 0
      ? Math.max(0, Math.round(((adjacentPairs - adjacentSameDept) / adjacentPairs) * 100))
      : 100;

  const isApproved = currentExam?.status === 'approved';

  return (
    <div className="space-y-6">
      {/* Exam Selector and Approval Status Card */}
      <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E5D3D0]">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-[#76676A]">
              Audit Examination Seating Plan
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="text-base font-bold text-[#352A2B] py-1.5 px-3 bg-[#FFF9F6] border border-[#E5D3D0] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.courseCode}: {ex.courseTitle}
                  </option>
                ))}
              </select>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                  isApproved
                    ? 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
                    : examAllotments.length > 0
                    ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                    : 'bg-[#F1E5DC] text-[#76676A] border border-[#E5D3D0]'
                }`}
              >
                {isApproved ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Approved & Locked</span>
                  </>
                ) : examAllotments.length > 0 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Pending Approval</span>
                  </>
                ) : (
                  <span>Unallocated Draft</span>
                )}
              </span>
            </div>
            <p className="text-xs text-[#76676A]">
              Scheduled Date: {currentExam.date} ({currentExam.session} · {currentExam.startTime}) · Registered Candidates: {registeredStudents.length}
            </p>
          </div>

          {/* Officer Action Block */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={() => setShowValidationModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#A96873] rounded-lg text-xs font-bold border border-[#E5D3D0] hover:border-[#C58F91] transition-all shadow-2xs cursor-pointer"
              title="Test SQLite database allocation constraints and mixed-department separation"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Deep Constraint & Neighbor Audit</span>
            </button>

            {isApproved ? (
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-[#76676A] block">Signed Off By:</span>
                  <span className="font-bold text-[#352A2B]">{currentExam.approvedBy}</span>
                  <span className="text-[11px] text-[#99888A] block">{currentExam.approvalDate}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onUnlockExam(currentExam.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#76676A] hover:text-[#352A2B] rounded-lg text-xs font-bold border border-[#E5D3D0] transition-colors cursor-pointer shadow-2xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock for Editing</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="Officer Name & Designation..."
                  className="text-xs py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] w-60"
                />
                <button
                  type="button"
                  onClick={() => onApproveExam(currentExam.id, approverName)}
                  disabled={examAllotments.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 btn-rose-primary disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve & Lock Seating Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Verification Checkpoints */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {/* Check 1: Zero Duplicate Students */}
          <div className="p-4 rounded-xl border border-[#E5D3D0] bg-[#FFF9F6] shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#76676A]">Candidate Invariance</span>
              {duplicateStudents === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              )}
            </div>
            <div className="text-xl font-bold font-mono text-[#352A2B] tabular-nums">
              {duplicateStudents === 0 ? 'Zero Duplicates' : `${duplicateStudents} Conflicts`}
            </div>
            <p className="text-[11px] text-[#76676A] mt-1">
              No student is assigned more than once for this examination.
            </p>
          </div>

          {/* Check 2: Zero Duplicate Seats */}
          <div className="p-4 rounded-xl border border-[#E5D3D0] bg-[#FFF9F6] shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#76676A]">Seat Collision Check</span>
              {duplicateSeats === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              )}
            </div>
            <div className="text-xl font-bold font-mono text-[#059669] tabular-nums">
              {duplicateSeats === 0 ? 'Pass (100% Unique)' : `${duplicateSeats} Collisions`}
            </div>
            <p className="text-[11px] text-[#76676A] mt-1">
              No desk is double-booked across any hall.
            </p>
          </div>

          {/* Check 3: Mixed Seating Academic Integrity Score */}
          <div className="p-4 rounded-xl border border-[#E5D3D0] bg-[#FFF9F6] shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#76676A]">Anti-Cheat Integrity</span>
              <Sparkles className="w-4 h-4 text-[#A96873]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#A96873] tabular-nums">
              {integrityScore}% Separation
            </div>
            <p className="text-[11px] text-[#76676A] mt-1">
              Adjacent neighbor branch diversification rate ({adjacentSameDept} adjacent same-branch pairs).
            </p>
          </div>

          {/* Check 4: Capacity Coverage */}
          <div className="p-4 rounded-xl border border-[#E5D3D0] bg-[#FFF9F6] shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#76676A]">Candidate Coverage</span>
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#352A2B] tabular-nums">
              {examAllotments.length} / {registeredStudents.length}
            </div>
            <p className="text-[11px] text-[#76676A] mt-1">
              {registeredStudents.length - examAllotments.length === 0
                ? 'All registered candidates assigned'
                : `${registeredStudents.length - examAllotments.length} candidates unallocated`}
            </p>
          </div>
        </div>
      </div>

      {/* Hall-by-Hall Layout Visualizer */}
      <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#352A2B]">Hall Seating Inspection</h3>
            <p className="text-xs text-[#76676A]">
              Examine desk allotments visually to verify academic integrity separation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#76676A] font-semibold">Select Hall:</span>
            <select
              value={selectedHallId}
              onChange={(e) => setSelectedHallId(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
            >
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} — {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SeatingGridVisualizer
          hall={currentHall}
          allotments={examAllotments}
          students={students}
        />
      </div>

      {/* Deep Allocation Constraint & Anti-Cheat Validation Modal */}
      {currentExam && (
        <AllocationValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          exam={currentExam}
        />
      )}
    </div>
  );
};
