import React from 'react';
import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../../types';

interface DeskSlipsReportProps {
  hall: ExamHall;
  exam: ExamSchedule;
  allotments: SeatAllotment[];
  students: Student[];
}

export const DeskSlipsReport: React.FC<DeskSlipsReportProps> = ({
  hall,
  exam,
  allotments,
  students,
}) => {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const hallAllotments = allotments
    .filter((a) => a.hallId === hall.id && a.examId === exam.id)
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      if (a.col !== b.col) return a.col - b.col;
      return a.benchSlot.localeCompare(b.benchSlot);
    });

  return (
    <div className="bg-white p-6 max-w-5xl mx-auto print:p-0">
      <div className="text-center pb-3 mb-6 border-b border-slate-300 no-print">
        <h2 className="text-lg font-bold text-slate-900">
          Printable Desk Slips — {hall.code} ({hall.name})
        </h2>
        <p className="text-xs text-slate-500">
          Print on standard A4 paper and cut along the dashed guidelines to affix onto desks.
        </p>
      </div>

      {/* Grid of Desk Slips (2 columns on A4) */}
      <div className="grid grid-cols-2 gap-4">
        {hallAllotments.map((allot) => {
          const student = studentMap.get(allot.studentId);
          return (
            <div
              key={allot.id}
              className="border-2 border-dashed border-slate-400 p-3.5 rounded-lg bg-slate-50/50 flex flex-col justify-between print-avoid-break"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                    E
                  </div>
                  <span className="text-[11px] font-bold tracking-tight uppercase text-slate-800">
                    Exam Cell Desk Slip
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-900">
                  {hall.code}
                </span>
              </div>

              <div className="space-y-1 mb-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">Seat Code</span>
                  <span className="text-sm font-mono font-extrabold text-slate-900">
                    {allot.seatCode}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-500 uppercase">Candidate Roll No</span>
                  <span className="text-base font-mono font-black text-indigo-950">
                    {student?.rollNo || '—'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-900 truncate">
                  {student?.name || '—'}
                </div>

                <div className="text-[11px] text-slate-600 truncate">
                  {student?.department} · Sec {student?.section}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between items-center">
                <span>
                  {exam.courseCode} · {exam.date} ({exam.session})
                </span>
                <span className="font-mono">R{allot.row} C{allot.col}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
