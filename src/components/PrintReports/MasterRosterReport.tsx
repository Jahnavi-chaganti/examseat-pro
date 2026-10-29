import React from 'react';
import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../../types';

interface MasterRosterReportProps {
  exam: ExamSchedule;
  halls: ExamHall[];
  students: Student[];
  allotments: SeatAllotment[];
}

export const MasterRosterReport: React.FC<MasterRosterReportProps> = ({
  exam,
  halls,
  students,
  allotments,
}) => {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const hallMap = new Map(halls.map((h) => [h.id, h]));

  const examAllotments = allotments
    .filter((a) => a.examId === exam.id)
    .sort((a, b) => {
      const studentA = studentMap.get(a.studentId);
      const studentB = studentMap.get(b.studentId);
      return (studentA?.rollNo || '').localeCompare(studentB?.rollNo || '');
    });

  return (
    <div className="bg-white p-8 max-w-5xl mx-auto border border-slate-300 print:border-0 print:p-0">
      {/* Official Header */}
      <div className="text-center pb-4 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img
            src="/src/assets/images/exam_institution_crest_1792915042889.jpg"
            alt="University Crest"
            className="w-16 h-16 rounded-full object-cover border border-slate-800"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-slate-950 font-serif">
              Office of the Controller of Examinations
            </h1>
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-700">
              Consolidated Master Seating Matrix & Hall Allocations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-300 text-xs text-left">
          <div>
            <span className="font-semibold text-slate-700 block">Course Code:</span>
            <span className="font-mono font-bold text-sm text-slate-950">{exam.courseCode}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Course Title:</span>
            <span className="font-medium text-slate-900">{exam.courseTitle}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Date & Session:</span>
            <span className="font-bold text-slate-900">{exam.date} ({exam.session})</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Total Allotted:</span>
            <span className="font-mono font-bold text-slate-900">{examAllotments.length} Candidates</span>
          </div>
        </div>
      </div>

      {/* Master Table */}
      <table className="w-full border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
            <th className="border border-slate-400 px-2 py-1.5 text-center w-12">S.N</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left w-28 font-mono">Roll No</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left">Candidate Name</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left w-40">Department</th>
            <th className="border border-slate-400 px-3 py-1.5 text-center w-16">Sec</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left w-28 font-mono">Hall</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left w-36 font-mono">Seat Code</th>
            <th className="border border-slate-400 px-3 py-1.5 text-center w-20">Row/Col</th>
          </tr>
        </thead>
        <tbody>
          {examAllotments.map((allot, idx) => {
            const student = studentMap.get(allot.studentId);
            const hall = hallMap.get(allot.hallId);
            return (
              <tr
                key={allot.id}
                className={`border-b border-slate-300 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="border border-slate-300 px-2 py-1 text-center font-mono text-slate-600">
                  {idx + 1}
                </td>
                <td className="border border-slate-300 px-3 py-1 font-mono font-bold text-slate-900">
                  {student?.rollNo || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-1 font-medium text-slate-900">
                  {student?.name || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-1 text-slate-700">
                  {student?.department || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-1 text-center font-mono text-slate-700">
                  {student?.section || 'A'}
                </td>
                <td className="border border-slate-300 px-3 py-1 font-mono font-bold text-indigo-950">
                  {hall?.code || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-1 font-mono font-semibold text-slate-900">
                  {allot.seatCode}
                </td>
                <td className="border border-slate-300 px-3 py-1 text-center font-mono text-slate-700">
                  R{allot.row} C{allot.col}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer Sign-off */}
      <div className="mt-8 pt-4 border-t border-slate-400 flex justify-between items-end text-xs text-slate-800">
        <div>
          <span className="text-[11px] text-slate-600 block">Generated by ExamSeat Pro Automated Allocation Engine</span>
          <span className="font-mono text-[10px] text-slate-500">Document Hash: {Date.now().toString(36).toUpperCase()}</span>
        </div>
        <div className="flex gap-10 text-center">
          <div>
            <div className="w-40 border-b border-slate-600 mb-1"></div>
            <span className="text-[11px] font-semibold text-slate-800">Exam Cell In-Charge</span>
          </div>
          <div>
            <div className="w-40 border-b border-slate-600 mb-1"></div>
            <span className="text-[11px] font-semibold text-slate-800">Controller of Examinations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
