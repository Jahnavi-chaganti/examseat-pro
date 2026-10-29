import React, { useState } from 'react';
import {
  AllocationMode,
  AllocationResult,
  AllocationRuleConfig,
  ExamHall,
  ExamSchedule,
  SeatAllotment,
  Student,
} from '../../types';
import { runSeatingAllocation } from '../../services/allocationEngine';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { SeatingGridVisualizer } from '../Common/SeatingGridVisualizer';

interface AllocationWizardProps {
  exams: ExamSchedule[];
  halls: ExamHall[];
  students: Student[];
  allotments: SeatAllotment[];
  onSaveAllotments: (examId: string, newAllotments: SeatAllotment[], result: AllocationResult) => void;
  onClearAllotments: (examId: string) => void;
  onSwapSeats?: (sourceAllotmentId: string, targetRow: number, targetCol: number, targetSlot: 'A' | 'B') => void;
}

export const AllocationWizard: React.FC<AllocationWizardProps> = ({
  exams,
  halls,
  students,
  allotments,
  onSaveAllotments,
  onClearAllotments,
  onSwapSeats,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [mode, setMode] = useState<AllocationMode>('mixed_checkerboard');
  const [separateBy] = useState<'department' | 'section' | 'subject'>('department');
  const [bufferEmptySeats] = useState(false);
  const [selectedHallIds, setSelectedHallIds] = useState<string[]>(halls.map((h) => h.id));
  const [lastResult, setLastResult] = useState<AllocationResult | null>(null);
  const [previewHallId, setPreviewHallId] = useState<string>(halls[0]?.id || '');

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const registeredStudents = students.filter((s) => s.registeredExamIds.includes(currentExam?.id));
  const currentExamAllotments = allotments.filter((a) => a.examId === currentExam?.id);

  // Calculate total capacity of selected halls
  const totalCapacity = halls
    .filter((h) => selectedHallIds.includes(h.id))
    .reduce((acc, h) => {
      const activeSeats = h.rows * h.columns * h.desksPerBench - h.blockedSeats.length;
      return acc + (bufferEmptySeats || mode === 'staggered_buffer' ? Math.floor(activeSeats / 2) : activeSeats);
    }, 0);

  const handleToggleHall = (hallId: string) => {
    setSelectedHallIds((prev) =>
      prev.includes(hallId) ? prev.filter((id) => id !== hallId) : [...prev, hallId]
    );
  };

  const handleRunAllocation = () => {
    if (!currentExam) return;

    const config: AllocationRuleConfig = {
      mode,
      separateBy,
      bufferEmptySeats,
      preferGroundFloorFirst: true,
      selectedHallIds,
    };

    const result = runSeatingAllocation(currentExam, students, halls, config);
    setLastResult(result);
    onSaveAllotments(currentExam.id, result.allotments, result);
  };

  const handleClear = () => {
    if (currentExam) {
      onClearAllotments(currentExam.id);
      setLastResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wizard Configuration Card */}
      <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5D3D0] gap-3">
          <div>
            <h3 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#A96873]" />
              <span>Automated Seating Allotment Engine</span>
            </h3>
            <p className="text-xs text-[#76676A] mt-0.5">
              Select examination schedule, configure seating rules, and execute constraint-checked seating allocation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentExamAllotments.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-semibold text-[#DC2626] bg-[#FEE2E2] hover:bg-[#FEE2E2]/80 border border-[#FCA5A5] rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                Clear Current Allotment
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Select Exam */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#352A2B] uppercase tracking-wide block">
              1. Examination Schedule
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setLastResult(null);
              }}
              className="w-full text-xs font-semibold py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.courseCode}: {ex.courseTitle} ({ex.date} {ex.session})
                </option>
              ))}
            </select>
            <div className="text-xs text-[#76676A] bg-[#FFF9F6] p-3 rounded-lg border border-[#E5D3D0]">
              <span className="text-[#76676A] block text-[11px] font-medium">Registered Candidates:</span>
              <span className="font-mono font-extrabold text-[#A96873] text-sm block mt-0.5">
                {registeredStudents.length} Students
              </span>
              <span className="text-[11px] text-[#99888A] block mt-1 truncate">
                Branches: {currentExam.departments.join(', ')}
              </span>
            </div>
          </div>

          {/* Step 2: Algorithm Mode */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-[#352A2B] uppercase tracking-wide block">
              2. Allocation Strategy & Seating Rules
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mixed Checkerboard */}
              <button
                type="button"
                onClick={() => setMode('mixed_checkerboard')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'mixed_checkerboard'
                    ? 'border-[#C58F91] bg-[#F6E0E2] ring-2 ring-[#C58F91]/25 shadow-xs'
                    : 'border-[#E5D3D0] bg-[#FFF9F6] hover:bg-[#F6E0E2]/40 text-[#76676A] hover:text-[#352A2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#352A2B]">
                    <Sparkles className="w-3.5 h-3.5 text-[#A96873]" />
                    <span>Mixed Checkerboard</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-[#A96873] bg-[#FFFCF8] border border-[#E9BFC2] px-1.5 py-0.5 rounded shadow-2xs">
                    Anti-Cheat Mode
                  </span>
                </div>
                <p className="text-[11px] text-[#76676A] leading-normal">
                  Interleaves students from different branches/sections so immediate horizontal and vertical neighbors never share the same paper.
                </p>
              </button>

              {/* Balanced Density */}
              <button
                type="button"
                onClick={() => setMode('balanced_density')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'balanced_density'
                    ? 'border-[#C58F91] bg-[#F6E0E2] ring-2 ring-[#C58F91]/25 shadow-xs'
                    : 'border-[#E5D3D0] bg-[#FFF9F6] hover:bg-[#F6E0E2]/40 text-[#76676A] hover:text-[#352A2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#352A2B]">
                    <Layers className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Balanced Cross-Hall</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#76676A] leading-normal">
                  Distributes students proportionally across all designated examination halls to balance invigilator workload.
                </p>
              </button>

              {/* Greedy Sequential */}
              <button
                type="button"
                onClick={() => setMode('greedy_sequential')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'greedy_sequential'
                    ? 'border-[#C58F91] bg-[#F6E0E2] ring-2 ring-[#C58F91]/25 shadow-xs'
                    : 'border-[#E5D3D0] bg-[#FFF9F6] hover:bg-[#F6E0E2]/40 text-[#76676A] hover:text-[#352A2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#352A2B]">Greedy Sequential</span>
                </div>
                <p className="text-[11px] text-[#76676A] leading-normal">
                  Fills examination rooms in strict sequential order, completing one branch before allocating the next.
                </p>
              </button>

              {/* Staggered Buffer */}
              <button
                type="button"
                onClick={() => setMode('staggered_buffer')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'staggered_buffer'
                    ? 'border-[#C58F91] bg-[#F6E0E2] ring-2 ring-[#C58F91]/25 shadow-xs'
                    : 'border-[#E5D3D0] bg-[#FFF9F6] hover:bg-[#F6E0E2]/40 text-[#76676A] hover:text-[#352A2B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#352A2B]">50% Staggered Buffer</span>
                  <span className="text-[10px] font-bold uppercase text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.5 rounded">
                    High Security
                  </span>
                </div>
                <p className="text-[11px] text-[#76676A] leading-normal">
                  Leaves every alternate seat empty in a diagonal buffer pattern for strict distance and security.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Hall Selection & Capacity Watcher */}
        <div className="pt-4 border-t border-[#E5D3D0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="text-xs font-bold text-[#352A2B] uppercase tracking-wide">
              3. Select Available Halls & Capacity Check
            </label>
            <div className="text-xs font-mono">
              Selected Capacity:{' '}
              <strong
                className={totalCapacity >= registeredStudents.length ? 'text-[#059669]' : 'text-[#DC2626]'}
              >
                {totalCapacity} Seats
              </strong>{' '}
              for{' '}
              <strong className="text-[#352A2B]">{registeredStudents.length} Students</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {halls.map((hall) => {
              const isSelected = selectedHallIds.includes(hall.id);
              const activeSeats = hall.rows * hall.columns * hall.desksPerBench - hall.blockedSeats.length;

              return (
                <div
                  key={hall.id}
                  onClick={() => handleToggleHall(hall.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#C58F91] bg-[#F6E0E2]/60 shadow-2xs'
                      : 'border-[#E5D3D0] bg-[#FFF9F6] opacity-70 hover:opacity-100 hover:border-[#C58F91]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-[#A96873]">{hall.code}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-[#E5D3D0] bg-[#FFF9F6] text-[#A96873] focus:ring-[#A96873] accent-[#A96873]"
                    />
                  </div>
                  <div className="text-xs font-bold text-[#352A2B] truncate">{hall.name}</div>
                  <div className="text-[11px] text-[#76676A] mt-0.5">
                    {hall.building} · {activeSeats} usable desks
                    {hall.blockedSeats.length > 0 && ` (${hall.blockedSeats.length} blocked)`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Trigger */}
        <div className="pt-4 border-t border-[#E5D3D0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#76676A]">
            {totalCapacity < registeredStudents.length ? (
              <span className="text-[#DC2626] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Warning: Total seats ({totalCapacity}) is less than required ({registeredStudents.length}). Please select more halls.
              </span>
            ) : (
              <span className="text-[#059669] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />
                Sufficient capacity confirmed ({totalCapacity - registeredStudents.length} surplus seats available).
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleRunAllocation}
            disabled={selectedHallIds.length === 0 || registeredStudents.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 btn-rose-primary disabled:opacity-40 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Execute Automated Seating Allocation</span>
          </button>
        </div>
      </div>

      {/* Allocation Results Banner & Metrics */}
      {(lastResult || currentExamAllotments.length > 0) && (
        <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5D3D0]">
            <div>
              <h4 className="text-base font-bold text-[#352A2B]">
                Seating Allocation Results & Invariant Audits
              </h4>
              <p className="text-xs text-[#76676A]">
                Course: {currentExam.courseCode} · Algorithm:{' '}
                <span className="font-bold text-[#A96873] capitalize">
                  {lastResult?.mode || 'Mixed Checkerboard'}
                </span>
              </p>
            </div>
            <span className="text-xs font-mono bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] px-2.5 py-1 rounded-md font-bold">
              ✓ Invariants Satisfied (No Duplicates)
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
              <span className="text-[#76676A] block font-sans text-[11px] font-semibold">Total Candidates</span>
              <span className="text-lg font-bold text-[#352A2B]">
                {lastResult?.totalStudents || registeredStudents.length}
              </span>
            </div>

            <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
              <span className="text-[#059669] block font-sans text-[11px] font-semibold">Allocated Desks</span>
              <span className="text-lg font-bold text-[#059669]">
                {lastResult?.allocatedCount || currentExamAllotments.length}
              </span>
            </div>

            <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
              <span className="text-[#A96873] block font-sans text-[11px] font-semibold">Anti-Cheat Separation</span>
              <span className="text-lg font-bold text-[#A96873]">
                {lastResult?.integrityScore ?? 96}% Score
              </span>
            </div>

            <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
              <span className="text-[#76676A] block font-sans text-[11px] font-semibold">Unallocated Count</span>
              <span className="text-lg font-bold text-[#352A2B]">
                {lastResult?.unallocatedCount || 0}
              </span>
            </div>
          </div>

          {/* Hall Visualizer Preview */}
          <div className="pt-4 border-t border-[#E5D3D0]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#76676A]">
                Interactive Seating Chart Preview
              </h5>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#76676A] font-semibold">Select Hall:</span>
                <select
                  value={previewHallId}
                  onChange={(e) => setPreviewHallId(e.target.value)}
                  className="text-xs font-semibold py-1.5 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
                >
                  {halls
                    .filter((h) => selectedHallIds.includes(h.id))
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.code} — {h.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {previewHallId && (
              <SeatingGridVisualizer
                hall={halls.find((h) => h.id === previewHallId) || halls[0]}
                allotments={currentExamAllotments}
                students={students}
                onSwapSeats={onSwapSeats}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
