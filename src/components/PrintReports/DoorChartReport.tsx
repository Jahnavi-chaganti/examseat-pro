import React from 'react';
import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../../types';

interface DoorChartReportProps {
  hall: ExamHall;
  exam: ExamSchedule;
  allotments: SeatAllotment[];
  students: Student[];
}

export const DoorChartReport: React.FC<DoorChartReportProps> = ({
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

  // Calculate department breakdown
  const deptSummary: Record<string, number> = {};
  for (const allot of hallAllotments) {
    const s = studentMap.get(allot.studentId);
    if (s) {
      deptSummary[s.department] = (deptSummary[s.department] || 0) + 1;
    }
  }

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto border border-slate-300 print:border-0 print:p-0">
      {/* Official University Header */}
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
              Semester Examination Hall Entrance Seating Chart
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-300 text-xs text-left">
          <div>
            <span className="font-semibold text-slate-700 block">Hall / Room:</span>
            <span className="font-mono font-bold text-sm text-slate-950">{hall.code} — {hall.name}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Location:</span>
            <span className="font-medium text-slate-900">{hall.building}, {hall.floor}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Exam Date & Session:</span>
            <span className="font-bold text-slate-900">{exam.date} ({exam.session === 'FN' ? 'Forenoon' : 'Afternoon'})</span>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block">Exam Time:</span>
            <span className="font-mono text-slate-900">{exam.startTime} – {exam.endTime}</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-200 text-left text-xs flex justify-between items-center">
          <div>
            <span className="font-semibold text-slate-700">Course: </span>
            <span className="font-bold font-mono text-slate-950">{exam.courseCode}</span> — {exam.courseTitle}
          </div>
          <div className="font-mono text-xs font-semibold text-slate-800">
            Total Candidates Allotted: {hallAllotments.length}
          </div>
        </div>
      </div>

      {/* Notice for Students */}
      <div className="mb-4 p-2.5 bg-slate-100 border border-slate-300 rounded text-xs text-slate-800">
        <span className="font-bold">Instructions to Candidates: </span>
        Verify your Registration Number against the designated Seat Code before entering. Possession of mobile phones, smartwatches, or unauthorized materials is strictly prohibited. Occupy only your allotted seat.
      </div>

      {/* Seating Table */}
      <table className="w-full border-collapse border border-slate-400 text-xs">
        <thead>
          <tr className="bg-slate-200 text-slate-900 border-b border-slate-400 font-bold">
            <th className="border border-slate-400 px-2 py-1.5 text-center w-12">S.No</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left w-32 font-mono">Seat Code</th>
            <th className="border border-slate-400 px-3 py-1.5 text-center w-28 font-mono">Row / Col</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left w-32 font-mono">Reg. / Roll No</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left">Candidate Name</th>
            <th className="border border-slate-400 px-3 py-1.5 text-left w-44">Department</th>
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
                <td className="border border-slate-300 px-2 py-1 text-center font-mono text-slate-600">
                  {idx + 1}
                </td>
                <td className="border border-slate-300 px-3 py-1 font-mono font-bold text-slate-900">
                  {allot.seatCode}
                </td>
                <td className="border border-slate-300 px-3 py-1 text-center font-mono text-slate-700">
                  Row {allot.row}, Col {allot.col}
                </td>
                <td className="border border-slate-300 px-3 py-1 font-mono font-bold text-slate-900">
                  {student?.rollNo || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-1 font-medium text-slate-900">
                  {student?.name || '—'}
                </td>
                <td className="border border-slate-300 px-3 py-1 text-slate-700">
                  {student?.department || '—'} (Sec {student?.section})
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary & Sign-off footer */}
      <div className="mt-8 pt-4 border-t border-slate-400 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-800">
        <div>
          <span className="font-semibold block mb-1">Branch Distribution in this Hall:</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-slate-700">
            {Object.entries(deptSummary).map(([dept, count]) => (
              <span key={dept}>
                {dept}: <strong className="text-slate-950">{count}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-12 text-center pt-8">
          <div>
            <div className="w-36 border-b border-slate-600 mb-1"></div>
            <span className="text-[11px] font-medium text-slate-700">Hall Invigilator</span>
          </div>
          <div>
            <div className="w-36 border-b border-slate-600 mb-1"></div>
            <span className="text-[11px] font-medium text-slate-700">Exam Cell Superintendent</span>
          </div>
        </div>
      </div>
    </div>
  );
};
