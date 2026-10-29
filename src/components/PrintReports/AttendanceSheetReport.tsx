import React from 'react';
import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../../types';

interface AttendanceSheetReportProps {
  hall: ExamHall;
  exam: ExamSchedule;
  allotments: SeatAllotment[];
  students: Student[];
}

export const AttendanceSheetReport: React.FC<AttendanceSheetReportProps> = ({
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

  const presentCount = hallAllotments.filter((a) => a.attendance === 'present').length;
  const absentCount = hallAllotments.filter((a) => a.attendance === 'absent').length;
  const malpracticeCount = hallAllotments.filter((a) => a.attendance === 'malpractice').length;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto border border-slate-300 print:border-0 print:p-0">
      {/* Official Header */}
      <div className="text-center pb-4 border-b-2 border-slate-900 mb-4">
        <h1 className="text-xl font-bold tracking-tight uppercase text-slate-950 font-serif">
          University Central Examination Cell
        </h1>
        <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-800 mt-0.5">
          Invigilator Attendance & Signature Roster
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-2 border-t border-slate-300 text-xs text-left">
          <div>
            <span className="font-semibold text-slate-600 block">Hall Code:</span>
            <span className="font-mono font-bold text-sm text-slate-900">{hall.code} ({hall.name})</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600 block">Exam Date & Session:</span>
            <span className="font-bold text-slate-900">{exam.date} · {exam.session} ({exam.startTime})</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600 block">Subject / Course:</span>
            <span className="font-bold text-slate-900">{exam.courseCode} — {exam.courseTitle}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600 block">Assigned Invigilator:</span>
            <span className="font-medium text-slate-900">{hall.invigilatorName || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <table className="w-full border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
            <th className="border border-slate-400 px-2 py-1.5 text-center w-10">S.N</th>
            <th className="border border-slate-400 px-2 py-1.5 text-left w-24 font-mono">Seat Code</th>
            <th className="border border-slate-400 px-2 py-1.5 text-left w-24 font-mono">Roll Number</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left">Candidate Name</th>
            <th className="border border-slate-400 px-2 py-1.5 text-left w-32">Department</th>
            <th className="border border-slate-400 px-2 py-1.5 text-center w-32">Answer Booklet No.</th>
            <th className="border border-slate-400 px-3 py-1.5 text-center w-36">Candidate Signature</th>
            <th className="border border-slate-400 px-2 py-1.5 text-center w-20">Status</th>
          </tr>
        </thead>
        <tbody>
          {hallAllotments.map((allot, idx) => {
            const student = studentMap.get(allot.studentId);
            return (
              <tr
                key={allot.id}
                className={`border-b border-slate-300 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="border border-slate-300 px-2 py-2 text-center font-mono text-slate-600">
                  {idx + 1}
                </td>
                <td className="border border-slate-300 px-2 py-2 font-mono font-semibold text-slate-900">
                  {allot.seatCode}
                </td>
                <td className="border border-slate-300 px-2 py-2 font-mono font-bold text-slate-900">
                  {student?.rollNo || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-2 font-medium text-slate-900">
                  {student?.name || '—'}
                </td>
                <td className="border border-slate-300 px-2 py-2 text-slate-700 truncate max-w-32">
                  {student?.department.split(' ')[0]} (Sec {student?.section})
                </td>
                <td className="border border-slate-300 px-2 py-2 text-center font-mono text-slate-400">
                  {allot.answerBookletNo ? (
                    <span className="font-mono text-slate-900">{allot.answerBookletNo}</span>
                  ) : (
                    <span className="text-slate-300">________________</span>
                  )}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-center">
                  <span className="text-slate-300">__________________</span>
                </td>
                <td className="border border-slate-300 px-2 py-2 text-center uppercase font-mono text-[11px] font-bold">
                  {allot.attendance === 'present' ? (
                    <span className="text-emerald-700">PRESENT</span>
                  ) : allot.attendance === 'absent' ? (
                    <span className="text-rose-700">ABSENT</span>
                  ) : allot.attendance === 'malpractice' ? (
                    <span className="text-purple-700">MALPRAC</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Invigilation Summary Block */}
      <div className="mt-6 border border-slate-400 p-4 rounded bg-slate-50/50 text-xs">
        <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-2">
          Invigilator's Attendance Summary & Certification
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-300 font-mono">
          <div>
            <span className="text-slate-600 block">Total Registered / Allotted:</span>
            <span className="text-base font-bold text-slate-900">{hallAllotments.length}</span>
          </div>
          <div>
            <span className="text-slate-600 block">Total Present:</span>
            <span className="text-base font-bold text-emerald-700">{presentCount || '_______'}</span>
          </div>
          <div>
            <span className="text-slate-600 block">Total Absent:</span>
            <span className="text-base font-bold text-rose-700">{absentCount || '_______'}</span>
          </div>
          <div>
            <span className="text-slate-600 block">Malpractice / Debarred:</span>
            <span className="text-base font-bold text-purple-700">{malpracticeCount || '0'}</span>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-600 leading-normal">
          I hereby certify that the physical seating of candidates in Examination Hall {hall.code} strictly complied with the allotted seating matrix. All candidate signatures and answer booklet serial numbers have been cross-verified.
        </p>

        <div className="mt-8 flex justify-between items-end">
          <div>
            <span className="text-[11px] text-slate-500 block">Date & Handover Timestamp:</span>
            <span className="font-mono text-slate-800">{exam.date} ___:___ HRS</span>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-600 mb-1"></div>
            <span className="text-[11px] font-semibold text-slate-800">
              Signature of Invigilator ({hall.invigilatorName || 'Faculty In-Charge'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
