import React from 'react';
import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../../types';

interface StudentSlipReportProps {
  student: Student;
  hall: ExamHall;
  exam: ExamSchedule;
  allotment: SeatAllotment;
}

export const StudentSlipReport: React.FC<StudentSlipReportProps> = ({
  student,
  hall,
  exam,
  allotment,
}) => {
  return (
    <div className="bg-white p-8 max-w-2xl mx-auto border-2 border-slate-900 rounded-xl shadow-xs print:border-2 print:p-6">
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <img
            src="/src/assets/images/exam_institution_crest_1792915042889.jpg"
            alt="University Crest"
            className="w-12 h-12 rounded-full border border-slate-800 object-cover"
          />
          <div>
            <h1 className="text-base font-bold uppercase tracking-tight text-slate-950 font-serif">
              University Examination Cell
            </h1>
            <p className="text-xs text-slate-600">Candidate Examination Entry Pass & Seat Allotment</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-mono block text-slate-500">Hall Ticket Token</span>
          <span className="font-mono text-xs font-bold text-slate-900">{allotment.id.slice(0, 12)}</span>
        </div>
      </div>

      {/* Candidate Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Candidate Name:</span>
            <span className="text-sm font-bold text-slate-900">{student.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Registration / Roll No:</span>
            <span className="text-base font-mono font-black text-indigo-900">{student.rollNo}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Department / Branch:</span>
            <span className="font-semibold text-slate-800">{student.department}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Semester & Section:</span>
            <span className="font-semibold text-slate-800">
              Semester {student.semester} · Section {student.section}
            </span>
          </div>
        </div>
      </div>

      {/* Seat Allocation Callout */}
      <div className="border-2 border-indigo-600 bg-indigo-50/60 rounded-xl p-5 mb-6 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
          Assigned Examination Seat
        </span>
        <div className="text-2xl sm:text-3xl font-mono font-black text-indigo-950 tracking-tight my-1">
          {allotment.seatCode}
        </div>
        <div className="text-sm font-semibold text-slate-800">
          {hall.code} — {hall.name}
        </div>
        <div className="text-xs text-slate-600 mt-1">
          {hall.building} · {hall.floor} · Row {allotment.row}, Column {allotment.col}
        </div>
      </div>

      {/* Exam Details */}
      <div className="border border-slate-200 rounded-lg p-4 mb-6 text-xs space-y-2">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Subject:</span>
          <span className="font-semibold text-slate-900">
            {exam.courseCode} — {exam.courseTitle}
          </span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">Date & Session:</span>
          <span className="font-semibold text-slate-900">
            {exam.date} ({exam.session === 'FN' ? 'Forenoon Session' : 'Afternoon Session'})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Reporting Time:</span>
          <span className="font-mono font-semibold text-rose-700">
            {exam.session === 'FN' ? '09:00 AM' : '01:30 PM'} (30 mins before start)
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-[11px] text-slate-600 leading-relaxed mb-6 space-y-1">
        <p className="font-bold text-slate-800">Rules & Mandatory Guidelines:</p>
        <p>1. Must carry a valid University Student Identity Card along with this seat allotment slip.</p>
        <p>2. Report to Examination Hall {hall.code} strictly 30 minutes prior to scheduled start time.</p>
        <p>3. Do not alter or swap assigned desks without Chief Superintendent permission.</p>
      </div>

      {/* Signature Lines */}
      <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-xs">
        <div className="text-center">
          <div className="w-32 border-b border-slate-400 mb-1"></div>
          <span className="text-[10px] text-slate-600">Candidate Signature</span>
        </div>
        <div className="text-center">
          <div className="w-36 border-b border-slate-400 mb-1"></div>
          <span className="text-[10px] font-semibold text-slate-800">Controller of Examinations</span>
        </div>
      </div>
    </div>
  );
};
