import React, { useState } from 'react';
import { Department, ExamSchedule } from '../../types';
import { Plus, Calendar, Clock, BookOpen, Trash2 } from 'lucide-react';

interface ExamManagerProps {
  exams: ExamSchedule[];
  onAddExam: (exam: ExamSchedule) => void;
  onDeleteExam: (examId: string) => void;
}

const AVAILABLE_DEPTS: Department[] = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Artificial Intelligence & Machine Learning',
  'Artificial Intelligence & Data Science',
  'CSE (Data Science)',
  'Data Science',
];

const SEMESTER_OPTIONS = [
  { year: 1 as const, semester: 1, label: '1-1 (I B.Tech I Sem)' },
  { year: 1 as const, semester: 2, label: '1-2 (I B.Tech II Sem)' },
  { year: 2 as const, semester: 3, label: '2-1 (II B.Tech I Sem)' },
  { year: 2 as const, semester: 4, label: '2-2 (II B.Tech II Sem)' },
  { year: 3 as const, semester: 5, label: '3-1 (III B.Tech I Sem)' },
  { year: 3 as const, semester: 6, label: '3-2 (III B.Tech II Sem)' },
  { year: 4 as const, semester: 7, label: '4-1 (IV B.Tech I Sem)' },
  { year: 4 as const, semester: 8, label: '4-2 (IV B.Tech II Sem)' },
];

export const ExamManager: React.FC<ExamManagerProps> = ({ exams, onAddExam, onDeleteExam }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [courseCode, setCourseCode] = useState('R2022051');
  const [courseTitle, setCourseTitle] = useState('Operating Systems & System Programming');
  const [selectedDepts, setSelectedDepts] = useState<Department[]>([
    'Computer Science & Engineering',
    'Information Technology',
  ]);
  const [selectedSemIdx, setSelectedSemIdx] = useState<number>(3); // 2-2 default
  const [date, setDate] = useState('2026-11-10');
  const [session, setSession] = useState<'FN' | 'AN'>('FN');
  const [startTime, setStartTime] = useState('09:30 AM');
  const [endTime, setEndTime] = useState('12:30 PM');

  const handleToggleDept = (dept: Department) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseTitle.trim() || selectedDepts.length === 0) return;

    const semInfo = SEMESTER_OPTIONS[selectedSemIdx];
    const newExam: ExamSchedule = {
      id: `exam-${Date.now()}`,
      courseCode: courseCode.trim().toUpperCase(),
      courseTitle: courseTitle.trim(),
      departments: selectedDepts,
      year: semInfo.year,
      semester: semInfo.semester,
      semesterLabel: semInfo.label,
      date,
      session,
      startTime,
      endTime,
      status: 'draft',
    };

    onAddExam(newExam);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#A96873]" />
            <span>Examination Schedules & Courses</span>
          </h3>
          <p className="text-xs text-[#76676A] mt-0.5">
            Configure subjects, dates, Forenoon/Afternoon sessions, and branches taking each paper.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-4 py-2 btn-rose-primary rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Exam</span>
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="bg-[#FFFCF8] border border-[#C58F91] rounded-xl p-5 shadow-xl space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E5D3D0]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#352A2B]">
              Schedule Examination Course
            </h4>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-[#76676A] hover:text-[#352A2B] font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Course Code</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                required
                placeholder="e.g. R2022051"
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg font-mono focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-[#352A2B] block mb-1">Course Title</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
                placeholder="e.g. Operating Systems & System Programming"
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Year & Semester</label>
              <select
                value={selectedSemIdx}
                onChange={(e) => setSelectedSemIdx(Number(e.target.value))}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] font-bold cursor-pointer"
              >
                {SEMESTER_OPTIONS.map((opt, idx) => (
                  <option key={opt.label} value={idx}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Examination Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Session</label>
              <select
                value={session}
                onChange={(e) => {
                  const s = e.target.value as 'FN' | 'AN';
                  setSession(s);
                  if (s === 'FN') {
                    setStartTime('09:30 AM');
                    setEndTime('12:30 PM');
                  } else {
                    setStartTime('02:00 PM');
                    setEndTime('05:00 PM');
                  }
                }}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              >
                <option value="FN">FN: Forenoon (09:30 AM – 12:30 PM)</option>
                <option value="AN">AN: Afternoon (02:00 PM – 05:00 PM)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="font-bold text-[#352A2B] block mb-1">Timings</label>
              <input
                type="text"
                value={`${startTime} - ${endTime}`}
                readOnly
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] rounded-lg font-mono text-[#76676A]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#352A2B] block mb-2">
              Eligible Departments:
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_DEPTS.map((dept) => {
                const checked = selectedDepts.includes(dept);
                return (
                  <button
                    type="button"
                    key={dept}
                    onClick={() => handleToggleDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#F6E0E2] border-[#C58F91] text-[#A96873] font-bold shadow-2xs'
                        : 'bg-[#FFF9F6] border-[#E5D3D0] text-[#76676A] hover:border-[#C58F91] hover:text-[#352A2B]'
                    }`}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 btn-rose-primary text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Save Schedule
            </button>
          </div>
        </form>
      )}

      {/* Exam Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-[#FFFCF8] border border-[#E5D3D0] hover:border-[#C58F91] rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#A96873] bg-[#FFF9F6] px-2 py-0.5 rounded border border-[#E5D3D0]">
                    {exam.courseCode}
                  </span>
                  {exam.semesterLabel && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2]">
                      {exam.semesterLabel}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize border ${
                    exam.status === 'approved'
                      ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                      : exam.status === 'allocated'
                      ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                      : 'bg-[#F1E5DC] text-[#76676A] border-[#E5D3D0]'
                  }`}
                >
                  {exam.status === 'approved' ? 'Locked & Approved' : exam.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-[#352A2B] leading-snug">{exam.courseTitle}</h4>

              <div className="mt-3 space-y-1.5 text-xs text-[#76676A]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#A96873]" />
                  <span>
                    {exam.date} ({exam.session === 'FN' ? 'Forenoon Session' : 'Afternoon Session'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  <span className="font-mono font-bold text-[#352A2B]">
                    {exam.startTime} – {exam.endTime}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#E5D3D0] text-[11px] text-[#76676A]">
                <span className="font-bold block mb-1 text-[#352A2B]">Participating Branches:</span>
                <div className="flex flex-wrap gap-1">
                  {exam.departments.map((d) => (
                    <span key={d} className="bg-[#FFF9F6] border border-[#E5D3D0] px-2 py-0.5 rounded text-[#76676A]">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5D3D0] flex items-center justify-between text-xs">
              <span className="text-[#99888A] font-mono text-[11px]">ID: {exam.id}</span>
              {exams.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteExam(exam.id)}
                  className="p-1.5 text-[#99888A] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                  title="Delete Exam"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
