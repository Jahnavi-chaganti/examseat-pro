import React, { useState } from 'react';
import { AttendanceStatus, ExamHall, SeatAllotment, Student } from '../../types';
import { AlertCircle, User, X, XCircle } from 'lucide-react';

interface SeatingGridVisualizerProps {
  hall: ExamHall;
  allotments: SeatAllotment[];
  students: Student[];
  onToggleBlockedSeat?: (seatKey: string) => void;
  onUpdateAttendance?: (allotmentId: string, status: AttendanceStatus) => void;
  onSwapSeats?: (sourceAllotmentId: string, targetRow: number, targetCol: number, targetSlot: 'A' | 'B') => void;
  highlightStudentId?: string;
  isEditableLayout?: boolean;
}

// Distinct, high-contrast palette harmonized with the Cream & Dusty Rose theme
const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; rollText: string; dot: string }> = {
  'Computer Science & Eng': {
    bg: 'bg-[#FDF2F4] hover:bg-[#FCE7EB]',
    border: 'border-[#E9BFC2]',
    text: 'text-[#352A2B]',
    rollText: 'text-[#A96873]',
    dot: 'bg-[#C58F91]',
  },
  'Artificial Intelligence & DS': {
    bg: 'bg-[#F5F3FF] hover:bg-[#EDE9FE]',
    border: 'border-[#DDD6FE]',
    text: 'text-[#352A2B]',
    rollText: 'text-[#7C3AED]',
    dot: 'bg-[#8B5CF6]',
  },
  'Electronics & Comm Eng': {
    bg: 'bg-[#ECFDF5] hover:bg-[#D1FAE5]',
    border: 'border-[#A7F3D0]',
    text: 'text-[#352A2B]',
    rollText: 'text-[#059669]',
    dot: 'bg-[#10B981]',
  },
  'Mechanical Engineering': {
    bg: 'bg-[#FFFBEB] hover:bg-[#FEF3C7]',
    border: 'border-[#FDE68A]',
    text: 'text-[#352A2B]',
    rollText: 'text-[#D97706]',
    dot: 'bg-[#F59E0B]',
  },
  'Information Technology': {
    bg: 'bg-[#F0F9FF] hover:bg-[#E0F2FE]',
    border: 'border-[#BAE6FD]',
    text: 'text-[#352A2B]',
    rollText: 'text-[#0284C7]',
    dot: 'bg-[#0EA5E9]',
  },
  'Civil Engineering': {
    bg: 'bg-[#F1E5DC]/80 hover:bg-[#F1E5DC]',
    border: 'border-[#E5D3D0]',
    text: 'text-[#352A2B]',
    rollText: 'text-[#76676A]',
    dot: 'bg-[#99888A]',
  },
};

const DEFAULT_COLOR = {
  bg: 'bg-[#F6E0E2]/60 hover:bg-[#F6E0E2]',
  border: 'border-[#E9BFC2]',
  text: 'text-[#352A2B]',
  rollText: 'text-[#A96873]',
  dot: 'bg-[#C58F91]',
};

export const SeatingGridVisualizer: React.FC<SeatingGridVisualizerProps> = ({
  hall,
  allotments,
  students,
  onToggleBlockedSeat,
  onUpdateAttendance,
  onSwapSeats,
  highlightStudentId,
  isEditableLayout = false,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<{
    allotment?: SeatAllotment;
    student?: Student;
    row: number;
    col: number;
    slot: 'A' | 'B';
    isBlocked: boolean;
  } | null>(null);

  // Seat Swap state
  const [swapSourceSeat, setSwapSourceSeat] = useState<{
    allotment: SeatAllotment;
    student?: Student;
    row: number;
    col: number;
    slot: 'A' | 'B';
  } | null>(null);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const blockedSet = new Set(hall.blockedSeats);

  // Map of "r,c,slot" -> SeatAllotment
  const allotmentMap = new Map<string, SeatAllotment>();
  for (const allot of allotments) {
    if (allot.hallId === hall.id) {
      allotmentMap.set(`${allot.row},${allot.col},${allot.benchSlot}`, allot);
    }
  }

  const handleSeatClick = (row: number, col: number, slot: 'A' | 'B') => {
    const seatKey = `R${row}-C${col}-${slot}`;
    const isBlocked = blockedSet.has(seatKey);

    if (isEditableLayout && onToggleBlockedSeat) {
      onToggleBlockedSeat(seatKey);
      return;
    }

    const allot = allotmentMap.get(`${row},${col},${slot}`);
    const student = allot ? studentMap.get(allot.studentId) : undefined;

    // If in swap mode and source seat is selected
    if (onSwapSeats && swapSourceSeat) {
      if (isBlocked) return; // Cannot swap to blocked seat
      // Execute swap with target
      onSwapSeats(swapSourceSeat.allotment.id, row, col, slot);
      setSwapSourceSeat(null);
      return;
    }

    setSelectedSeat({
      allotment: allot,
      student,
      row,
      col,
      slot,
      isBlocked,
    });
  };

  return (
    <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 shadow-xs">
      {/* Hall Details Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E5D3D0]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#352A2B]">{hall.name}</h3>
            <span className="text-xs font-mono font-bold text-[#A96873] bg-[#FFF9F6] border border-[#E5D3D0] px-2.5 py-0.5 rounded">
              {hall.code}
            </span>
          </div>
          <p className="text-xs text-[#76676A] mt-1 font-medium">
            {hall.building} · {hall.floor} · {hall.rows} Rows × {hall.columns} Columns ({hall.rows * hall.columns * hall.desksPerBench} Max Capacity)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#76676A]">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border border-[#E5D3D0] bg-[#FFF9F6]" />
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border border-[#C58F91] bg-[#F6E0E2]" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border border-[#FCA5A5] bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center text-[10px] font-bold">
              ✕
            </div>
            <span>Blocked</span>
          </div>
          {highlightStudentId && (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded border-2 border-[#059669] bg-[#D1FAE5] ring-2 ring-[#059669]/40" />
              <span className="font-bold text-[#059669]">Your Seat</span>
            </div>
          )}
        </div>
      </div>

      {isEditableLayout && (
        <div className="mt-3 p-2.5 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-xs text-[#D97706] flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#D97706]" />
          <span>Click any desk in the layout below to toggle between Available and Blocked/Defective status.</span>
        </div>
      )}

      {swapSourceSeat && (
        <div className="mt-3 p-3 bg-[#F6E0E2] border border-[#C58F91] rounded-xl text-xs text-[#352A2B] flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#A96873]">Reassign Mode Active:</span>
            <span>
              Moving candidate <strong className="font-mono text-[#352A2B] font-bold">{swapSourceSeat.student?.name} ({swapSourceSeat.allotment.seatCode})</strong>. Click target desk to reassign/swap!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSwapSourceSeat(null)}
            className="px-2.5 py-1 bg-[#FFFCF8] hover:bg-[#FFF9F6] text-[#76676A] hover:text-[#352A2B] font-semibold rounded border border-[#E5D3D0] text-[11px] cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Stage / Whiteboard indicator */}
      <div className="my-6 max-w-md mx-auto">
        <div className="bg-[#F1E5DC] border border-[#E5D3D0] text-[#A96873] text-center py-2 px-4 rounded-lg text-xs font-bold tracking-wider uppercase shadow-xs flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A96873] animate-pulse" />
          <span>Invigilator Podium / Whiteboard & Screen</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#A96873] animate-pulse" />
        </div>
        <div className="text-center text-[11px] text-[#76676A] mt-1 font-medium">
          Front of Examination Hall
        </div>
      </div>

      {/* Grid Layout */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-full">
          <table className="border-collapse mx-auto">
            <thead>
              <tr>
                <th className="p-1.5 text-center text-xs font-medium text-[#76676A] w-10"></th>
                {Array.from({ length: hall.columns }).map((_, cIdx) => (
                  <th
                    key={`col-head-${cIdx}`}
                    className="p-1.5 text-center text-xs font-mono font-bold text-[#76676A] min-w-16 sm:min-w-20"
                  >
                    Col {cIdx + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: hall.rows }).map((_, rIdx) => {
                const rowNum = rIdx + 1;
                return (
                  <tr key={`row-${rowNum}`}>
                    {/* Row header */}
                    <td className="p-1.5 text-center text-xs font-mono font-bold text-[#76676A] pr-2">
                      R{rowNum}
                    </td>

                    {/* Columns */}
                    {Array.from({ length: hall.columns }).map((_, cIdx) => {
                      const colNum = cIdx + 1;
                      const slots: ('A' | 'B')[] = hall.desksPerBench === 2 ? ['A', 'B'] : ['A'];

                      return (
                        <td key={`seat-${rowNum}-${colNum}`} className="p-1.5 align-top">
                          <div className={`flex ${slots.length > 1 ? 'gap-1' : ''}`}>
                            {slots.map((slot) => {
                              const seatKey = `R${rowNum}-C${colNum}-${slot}`;
                              const isBlocked = blockedSet.has(seatKey);
                              const allot = allotmentMap.get(`${rowNum},${colNum},${slot}`);
                              const student = allot ? studentMap.get(allot.studentId) : undefined;
                              const isHighlighted = student && student.id === highlightStudentId;

                              let cardStyle = 'bg-[#FFF9F6] border-[#E5D3D0] text-[#76676A] hover:border-[#C58F91] hover:bg-[#F6E0E2]/40';
                              let deptColor = DEFAULT_COLOR;

                              if (isBlocked) {
                                cardStyle = 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626] cursor-pointer';
                              } else if (allot && student) {
                                deptColor = DEPT_COLORS[student.department] || DEFAULT_COLOR;
                                cardStyle = `${deptColor.bg} ${deptColor.border} ${deptColor.text}`;
                              }

                              if (isHighlighted) {
                                cardStyle = 'bg-[#D1FAE5] border-2 border-[#059669] text-[#352A2B] ring-4 ring-[#059669]/30 font-bold shadow-md';
                              }

                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleSeatClick(rowNum, colNum, slot)}
                                  className={`group relative flex-1 min-w-14 sm:min-w-18 p-1.5 rounded-lg border text-left transition-all duration-150 cursor-pointer shadow-2xs ${cardStyle} ${
                                    isEditableLayout ? 'hover:ring-2 hover:ring-[#A96873]' : ''
                                  }`}
                                  title={
                                    isBlocked
                                      ? `Seat R${rowNum}-C${colNum} (Blocked)`
                                      : student
                                      ? `${student.name} (${student.rollNo}) - ${student.department}`
                                      : `Seat R${rowNum}-C${colNum} (Vacant)`
                                  }
                                >
                                  <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-1">
                                    <span className="font-bold opacity-80">
                                      R{rowNum}C{colNum}{slots.length > 1 ? slot : ''}
                                    </span>
                                    {isBlocked ? (
                                      <span className="text-[#DC2626] font-extrabold">✕</span>
                                    ) : allot ? (
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          allot.attendance === 'present'
                                            ? 'bg-[#059669]'
                                            : allot.attendance === 'absent'
                                            ? 'bg-[#DC2626]'
                                            : allot.attendance === 'malpractice'
                                            ? 'bg-[#D97706]'
                                            : deptColor.dot
                                        }`}
                                      />
                                    ) : (
                                      <span className="text-[#E5D3D0]">·</span>
                                    )}
                                  </div>

                                  {isBlocked ? (
                                    <div className="text-[10px] text-[#DC2626] font-bold truncate">
                                      Blocked
                                    </div>
                                  ) : student ? (
                                    <div className="space-y-0.5">
                                      <div className={`text-[11px] font-mono font-bold leading-tight truncate ${deptColor.rollText}`}>
                                        {student.rollNo}
                                      </div>
                                      <div className="text-[10px] font-semibold leading-tight truncate text-[#352A2B]">
                                        {student.name.split(' ')[0]}
                                      </div>
                                      <div className="text-[9px] truncate text-[#76676A] font-medium">
                                        {student.department.split(' ')[0]}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-[#99888A] py-2 text-center font-medium">
                                      Vacant
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal / Drawer for clicked seat */}
      {selectedSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#352A2B]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFCF8] rounded-2xl shadow-2xl border border-[#E5D3D0] max-w-md w-full p-6">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5D3D0]">
              <div>
                <h4 className="text-base font-bold text-[#352A2B]">
                  Seat Details — R{selectedSeat.row} C{selectedSeat.col}{' '}
                  {hall.desksPerBench === 2 ? `Slot ${selectedSeat.slot}` : ''}
                </h4>
                <p className="text-xs text-[#76676A] mt-0.5">
                  {hall.name} ({hall.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSeat(null)}
                className="p-1 rounded-md text-[#76676A] hover:text-[#352A2B] hover:bg-[#F6E0E2] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {selectedSeat.isBlocked ? (
                <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>
                    This seat is marked as physically blocked or defective (e.g. broken desk, structural pillar). It is excluded from automatic seating allocation.
                  </span>
                </div>
              ) : selectedSeat.student && selectedSeat.allotment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-[#FFF9F6] border border-[#E5D3D0] rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2] font-bold flex items-center justify-center text-sm shadow-2xs">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#352A2B]">
                        {selectedSeat.student.name}
                      </div>
                      <div className="text-xs font-mono font-bold text-[#A96873]">
                        {selectedSeat.student.rollNo} · {selectedSeat.student.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#FFF9F6] rounded-lg border border-[#E5D3D0]">
                      <span className="text-[#76676A] block text-[11px] font-semibold">Department</span>
                      <span className="font-semibold text-[#352A2B] truncate block">
                        {selectedSeat.student.department}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FFF9F6] rounded-lg border border-[#E5D3D0]">
                      <span className="text-[#76676A] block text-[11px] font-semibold">Section & Semester</span>
                      <span className="font-semibold text-[#352A2B]">
                        Sec {selectedSeat.student.section} · Sem {selectedSeat.student.semester}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FFF9F6] rounded-lg border border-[#E5D3D0]">
                      <span className="text-[#76676A] block text-[11px] font-semibold">Seat Code</span>
                      <span className="font-mono font-bold text-[#059669]">
                        {selectedSeat.allotment.seatCode}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FFF9F6] rounded-lg border border-[#E5D3D0]">
                      <span className="text-[#76676A] block text-[11px] font-semibold">Attendance Status</span>
                      <span
                        className={`font-bold capitalize ${
                          selectedSeat.allotment.attendance === 'present'
                            ? 'text-[#059669]'
                            : selectedSeat.allotment.attendance === 'absent'
                            ? 'text-[#DC2626]'
                            : selectedSeat.allotment.attendance === 'malpractice'
                            ? 'text-[#D97706]'
                            : 'text-[#76676A]'
                        }`}
                      >
                        {selectedSeat.allotment.attendance}
                      </span>
                    </div>
                  </div>

                  {/* Attendance modifier if callback provided */}
                  {onUpdateAttendance && (
                    <div className="pt-2 border-t border-[#E5D3D0]">
                      <label className="text-xs font-semibold text-[#76676A] block mb-2">
                        Mark Attendance (Invigilator):
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAttendance(selectedSeat.allotment!.id, 'present');
                            setSelectedSeat({
                              ...selectedSeat,
                              allotment: { ...selectedSeat.allotment!, attendance: 'present' },
                            });
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            selectedSeat.allotment.attendance === 'present'
                              ? 'bg-[#D1FAE5] text-[#059669] border-[#059669]'
                              : 'bg-[#FFF9F6] text-[#76676A] border-[#E5D3D0] hover:text-[#352A2B] hover:bg-[#F6E0E2]'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAttendance(selectedSeat.allotment!.id, 'absent');
                            setSelectedSeat({
                              ...selectedSeat,
                              allotment: { ...selectedSeat.allotment!, attendance: 'absent' },
                            });
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            selectedSeat.allotment.attendance === 'absent'
                              ? 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]'
                              : 'bg-[#FFF9F6] text-[#76676A] border-[#E5D3D0] hover:text-[#352A2B] hover:bg-[#F6E0E2]'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateAttendance(selectedSeat.allotment!.id, 'malpractice');
                            setSelectedSeat({
                              ...selectedSeat,
                              allotment: { ...selectedSeat.allotment!, attendance: 'malpractice' },
                            });
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            selectedSeat.allotment.attendance === 'malpractice'
                              ? 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]'
                              : 'bg-[#FFF9F6] text-[#76676A] border-[#E5D3D0] hover:text-[#352A2B] hover:bg-[#F6E0E2]'
                          }`}
                        >
                          Malpractice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-[#76676A] text-xs">
                  This seat is currently unassigned/vacant for the selected examination.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5D3D0]">
              {onSwapSeats && selectedSeat.allotment ? (
                <button
                  type="button"
                  onClick={() => {
                    setSwapSourceSeat({
                      allotment: selectedSeat.allotment!,
                      student: selectedSeat.student,
                      row: selectedSeat.row,
                      col: selectedSeat.col,
                      slot: selectedSeat.slot,
                    });
                    setSelectedSeat(null);
                  }}
                  className="px-3 py-2 btn-rose-primary font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Swap / Reassign This Seat
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedSeat(null)}
                className="px-4 py-2 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#352A2B] rounded-lg text-xs font-bold border border-[#E5D3D0] transition-colors cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
