import React, { useState, useMemo } from 'react';
import { AcademicYear, Department, ExamSchedule, Student } from '../../types';
import { Plus, Upload, Download, Search, Trash2, Users, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  exams: ExamSchedule[];
  onAddStudent: (student: Student) => void;
  onBulkAddStudents: (newStudents: Student[]) => void;
  onDeleteStudent: (studentId: string) => void;
}

const DEPARTMENTS: Department[] = [
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

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  exams,
  onAddStudent,
  onBulkAddStudents,
  onDeleteStudent,
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [semFilter, setSemFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const [isAdding, setIsAdding] = useState(false);
  const [csvFeedback, setCsvFeedback] = useState<string | null>(null);

  // New Student Form
  const [newRollNo, setNewRollNo] = useState('25A35A0517');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState<Department>('Computer Science & Engineering');
  const [newYear, setNewYear] = useState<AcademicYear>(2);
  const [newSection, setNewSection] = useState('A');
  const [newSemester, setNewSemester] = useState(4);
  const [newBatch, setNewBatch] = useState('2023-2027');
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([exams[0]?.id || '']);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.rollNo.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q);

      const matchesDept = deptFilter === 'all' || s.department === deptFilter;
      const matchesYear = yearFilter === 'all' || s.year === Number(yearFilter);
      const matchesSem = semFilter === 'all' || s.semester === Number(semFilter);

      return matchesSearch && matchesDept && matchesYear && matchesSem;
    });
  }, [students, search, deptFilter, yearFilter, semFilter]);

  // Reset page on filter changes
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newName.trim()) return;

    const student: Student = {
      id: `student-pragati-${Date.now()}`,
      rollNo: newRollNo.trim().toUpperCase(),
      name: newName.trim(),
      email: `${newRollNo.trim().toLowerCase()}@pragati.ac.in`,
      department: newDept,
      section: newSection.trim().toUpperCase() || 'A',
      year: Number(newYear) as AcademicYear,
      semester: Number(newSemester),
      batch: newBatch,
      registeredExamIds: selectedExamIds,
    };

    onAddStudent(student);
    setIsAdding(false);
    setNewRollNo('');
    setNewName('');
  };

  const handleDownloadTemplate = () => {
    const headers = 'RollNo,Name,Department,Year,Semester,Section,Batch\n';
    const sample = '25A35A0501,Aditya Varma,Computer Science & Engineering,2,4,A,2023-2027\n23A31A0401,Keerthi Reddy,Electronics & Communication Engineering,2,4,B,2023-2027';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Pragati_Student_Roster_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const parsedStudents: Student[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          const [roll, name, dept, yearStr, semStr, sec, batch] = parts;
          if (roll && name) {
            const yr = (Number(yearStr) || 2) as AcademicYear;
            const sem = Number(semStr) || yr * 2;
            parsedStudents.push({
              id: `student-import-${Date.now()}-${i}`,
              rollNo: roll.toUpperCase(),
              name: name,
              email: `${roll.toLowerCase()}@pragati.ac.in`,
              department: (dept as Department) || 'Computer Science & Engineering',
              section: sec?.toUpperCase() || 'A',
              year: yr,
              semester: sem,
              batch: batch || '2023-2027',
              registeredExamIds: exams.map((ex) => ex.id),
            });
          }
        }
      }

      if (parsedStudents.length > 0) {
        onBulkAddStudents(parsedStudents);
        setCsvFeedback(`Successfully ingested ${parsedStudents.length} Pragati engineering students from CSV.`);
        setTimeout(() => setCsvFeedback(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Add and CSV Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#A96873]" />
            <span>Pragati Engineering College Student Roster ({students.length} Candidates)</span>
          </h3>
          <p className="text-xs text-[#76676A] mt-0.5">
            4 Academic Years (I to IV B.Tech) · 8 Semesters · 10 Specialized Engineering Branches · Surampalem Campus
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#352A2B] border border-[#E5D3D0] rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-[#A96873]" />
            <span>Bulk CSV Upload</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#352A2B] border border-[#E5D3D0] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Download Pragati CSV sample format"
          >
            <Download className="w-3.5 h-3.5 text-[#A96873]" />
            <span>CSV Template</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 px-4 py-2 btn-rose-primary rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Register Candidate</span>
          </button>
        </div>
      </div>

      {csvFeedback && (
        <div className="p-3 bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl text-xs text-[#059669] flex items-center gap-2 font-semibold">
          <FileSpreadsheet className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{csvFeedback}</span>
        </div>
      )}

      {/* Manual Add Student Form */}
      {isAdding && (
        <form
          onSubmit={handleManualAdd}
          className="bg-[#FFFCF8] border border-[#C58F91] rounded-xl p-5 shadow-xl space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#E5D3D0]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#352A2B]">
              Manual Pragati Candidate Registration
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
              <label className="font-bold text-[#352A2B] block mb-1">Roll / Hall Ticket No</label>
              <input
                type="text"
                value={newRollNo}
                onChange={(e) => setNewRollNo(e.target.value)}
                placeholder="e.g. 25A35A0517"
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg font-mono focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Candidate Full Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sai Gudimetla"
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">B.Tech Department</label>
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value as Department)}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Academic Year</label>
              <select
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value) as AcademicYear)}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              >
                <option value={1}>I B.Tech (1st Year)</option>
                <option value={2}>II B.Tech (2nd Year)</option>
                <option value={3}>III B.Tech (3rd Year)</option>
                <option value={4}>IV B.Tech (4th Year)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Semester</label>
              <select
                value={newSemester}
                onChange={(e) => setNewSemester(Number(e.target.value))}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              >
                <option value={1}>Semester 1 (1-1)</option>
                <option value={2}>Semester 2 (1-2)</option>
                <option value={3}>Semester 3 (2-1)</option>
                <option value={4}>Semester 4 (2-2)</option>
                <option value={5}>Semester 5 (3-1)</option>
                <option value={6}>Semester 6 (3-2)</option>
                <option value={7}>Semester 7 (4-1)</option>
                <option value={8}>Semester 8 (4-2)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Section</label>
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg uppercase focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Batch</label>
              <input
                type="text"
                value={newBatch}
                onChange={(e) => setNewBatch(e.target.value)}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Register for Exam</label>
              <select
                value={selectedExamIds[0] || ''}
                onChange={(e) => setSelectedExamIds([e.target.value])}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.courseCode}: {ex.courseTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 btn-rose-primary text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
            >
              Save Pragati Candidate
            </button>
          </div>
        </form>
      )}

      {/* Filter and Table */}
      <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5D3D0] flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-[#99888A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roll (e.g. 25A35A0501) or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] placeholder:text-[#99888A] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-2.5 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg cursor-pointer"
            >
              <option value="all">All Years (I-IV)</option>
              <option value="1">I B.Tech (1st Yr)</option>
              <option value="2">II B.Tech (2nd Yr)</option>
              <option value="3">III B.Tech (3rd Yr)</option>
              <option value="4">IV B.Tech (4th Yr)</option>
            </select>

            {/* Semester Filter */}
            <select
              value={semFilter}
              onChange={(e) => {
                setSemFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-2.5 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg cursor-pointer"
            >
              <option value="all">All Semesters (1-8)</option>
              <option value="1">Sem 1 (1-1)</option>
              <option value="2">Sem 2 (1-2)</option>
              <option value="3">Sem 3 (2-1)</option>
              <option value="4">Sem 4 (2-2)</option>
              <option value="5">Sem 5 (3-1)</option>
              <option value="6">Sem 6 (3-2)</option>
              <option value="7">Sem 7 (4-1)</option>
              <option value="8">Sem 8 (4-2)</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs py-1.5 px-2.5 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg max-w-xs cursor-pointer"
            >
              <option value="all">All Branches (10 Departments)</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F1E5DC]/70 border-b border-[#E5D3D0] text-[#76676A] font-semibold">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-4 font-mono">Roll Number</th>
                <th className="py-2.5 px-4">Candidate Name</th>
                <th className="py-2.5 px-4">Department / Branch</th>
                <th className="py-2.5 px-4 text-center">Year & Sem</th>
                <th className="py-2.5 px-4 text-center">Sec · Batch</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D3D0]/60">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((s, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={s.id} className="hover:bg-[#F6E0E2]/40 transition-colors">
                      <td className="py-2 px-4 text-center font-mono text-[#99888A]">
                        {globalIndex}
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-[#A96873]">
                        {s.rollNo}
                      </td>
                      <td className="py-2 px-4 font-semibold text-[#352A2B]">
                        {s.name}
                      </td>
                      <td className="py-2 px-4 text-[#76676A]">
                        {s.department}
                      </td>
                      <td className="py-2 px-4 text-center font-mono font-bold text-[#352A2B]">
                        Yr {s.year} (Sem {s.semester})
                      </td>
                      <td className="py-2 px-4 text-center font-mono text-[#76676A] text-[11px]">
                        Sec {s.section} · {s.batch}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(s.id)}
                          className="p-1.5 text-[#99888A] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition-colors cursor-pointer"
                          title="Delete student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#76676A]">
                    No Pragati candidates match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-[#E5D3D0] bg-[#F1E5DC]/50 flex items-center justify-between text-xs text-[#76676A]">
          <div>
            Showing <strong className="font-mono font-bold text-[#352A2B]">{Math.min((currentPage - 1) * pageSize + 1, filteredStudents.length)}</strong> to{' '}
            <strong className="font-mono font-bold text-[#352A2B]">{Math.min(currentPage * pageSize, filteredStudents.length)}</strong> of{' '}
            <strong className="font-mono font-bold text-[#352A2B]">{filteredStudents.length}</strong> candidates
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#E5D3D0] bg-[#FFFCF8] text-[#352A2B] hover:bg-[#F6E0E2] disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold px-2 text-[#352A2B]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#E5D3D0] bg-[#FFFCF8] text-[#352A2B] hover:bg-[#F6E0E2] disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
