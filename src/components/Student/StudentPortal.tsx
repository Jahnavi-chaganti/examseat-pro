import React, { useState, useMemo } from 'react';
import { ExamHall, ExamSchedule, SeatAllotment, Student } from '../../types';
import { Search, MapPin, Clock, AlertCircle, Printer, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { SeatingGridVisualizer } from '../Common/SeatingGridVisualizer';

interface StudentPortalProps {
  students: Student[];
  halls: ExamHall[];
  exams: ExamSchedule[];
  allotments: SeatAllotment[];
  initialRollNo?: string;
  onPrintStudentSlip: (student: Student, hall: ExamHall, exam: ExamSchedule, allotment: SeatAllotment) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  students,
  halls,
  exams,
  allotments,
  initialRollNo,
  onPrintStudentSlip,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialRollNo || '');
  const [hasSearched, setHasSearched] = useState(Boolean(initialRollNo));

  // Sample roll numbers matching actual Pragati Surampalem student roster
  const sampleRollNumbers = [
    { label: 'CSE 2-2: 25A35A0501 (Lateral)', roll: '25A35A0501' },
    { label: 'CSE 2-2: 23A31A0501 (Regular)', roll: '23A31A0501' },
    { label: 'ECE 2-2: 23A31A0401', roll: '23A31A0401' },
    { label: 'AIML 2-2: 23A31A4201', roll: '23A31A4201' },
    { label: 'CSE 3-2: 22A31A0501', roll: '22A31A0501' },
    { label: 'CSE 4-2: 21A31A0501', roll: '21A31A0501' },
  ];

  // Selected student state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => {
    if (initialRollNo) {
      const clean = initialRollNo.replace(/[\s-]/g, '').toLowerCase();
      const match = students.find((s) => s.rollNo.replace(/[\s-]/g, '').toLowerCase() === clean);
      return match || null;
    }
    // Default to 25A35A0501 or first student
    const match = students.find((s) => s.rollNo === '25A35A0501');
    return match || students[0] || null;
  });

  // Normalize search query for fuzzy/partial matching
  const cleanQuery = searchQuery.replace(/[\s-]/g, '').toLowerCase();

  // Find matching candidates based on query
  const matchingCandidates = useMemo(() => {
    if (!cleanQuery) return [];
    return students.filter((s) => {
      const sRoll = s.rollNo.replace(/[\s-]/g, '').toLowerCase();
      const sName = s.name.toLowerCase();
      const sEmail = s.email.toLowerCase();

      return (
        sRoll.includes(cleanQuery) ||
        sName.includes(searchQuery.trim().toLowerCase()) ||
        sEmail.includes(cleanQuery)
      );
    });
  }, [cleanQuery, searchQuery, students]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);

    if (matchingCandidates.length > 0) {
      setSelectedStudent(matchingCandidates[0]);
    } else {
      setSelectedStudent(null);
    }
  };

  const handleSelectCandidate = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(student.rollNo);
    setHasSearched(true);
  };

  const handleQuickSelect = (rollNo: string) => {
    setSearchQuery(rollNo);
    setHasSearched(true);
    const clean = rollNo.replace(/[\s-]/g, '').toLowerCase();
    const match = students.find((s) => s.rollNo.replace(/[\s-]/g, '').toLowerCase() === clean);
    if (match) {
      setSelectedStudent(match);
    }
  };

  // Find student's active allotments
  const studentAllotments = useMemo(() => {
    if (!selectedStudent) return [];
    return allotments.filter((a) => a.studentId === selectedStudent.id);
  }, [selectedStudent, allotments]);

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-2xl p-6 sm:p-8 shadow-md text-center max-w-3xl mx-auto relative overflow-hidden">
        {/* Subtle radial ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-gradient-to-b from-[#E9BFC2]/30 via-[#F6E0E2]/20 to-transparent blur-2xl pointer-events-none -z-10 rounded-full" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6E0E2] border border-[#E9BFC2] text-[#A96873] text-xs font-bold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time Candidate Desk Lookup</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#352A2B] via-[#A96873] to-[#C58F91] bg-clip-text text-transparent">
          Find Your Examination Seat & Hall
        </h2>
        <p className="text-xs sm:text-sm text-[#76676A] mt-1.5 max-w-xl mx-auto font-medium">
          Enter your official University Registration / Roll Number or Name to instantly locate your hall, row, and desk assignment.
        </p>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#99888A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setHasSearched(true);
                // If direct exact match, auto-select
                const clean = val.replace(/[\s-]/g, '').toLowerCase();
                const directMatch = students.find(
                  (s) => s.rollNo.replace(/[\s-]/g, '').toLowerCase() === clean
                );
                if (directMatch) {
                  setSelectedStudent(directMatch);
                }
              }}
              placeholder="Enter Roll Number (e.g. 25A35A0501, 23A31A0501)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9F6] border border-[#E5D3D0] rounded-xl text-sm font-mono text-[#352A2B] placeholder:text-[#99888A] focus:outline-none focus:border-[#A96873] focus:ring-2 focus:ring-[#E9BFC2]/40 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 btn-rose-primary text-white font-bold text-sm rounded-xl transition-all shrink-0 cursor-pointer active:scale-95 shadow-md"
          >
            Search Seat
          </button>
        </form>

        {/* Quick test chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#76676A]">
          <span className="text-[11px] font-semibold">Quick Samples:</span>
          {sampleRollNumbers.map((item) => (
            <button
              key={item.roll}
              type="button"
              onClick={() => handleQuickSelect(item.roll)}
              className="font-mono text-[#A96873] hover:text-[#352A2B] hover:bg-[#F6E0E2] font-bold px-2 py-0.5 rounded-md bg-[#FFF9F6] text-[11px] border border-[#E5D3D0] hover:border-[#C58F91] transition-colors cursor-pointer shadow-2xs"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multiple Candidates Disambiguation List */}
      {cleanQuery && matchingCandidates.length > 1 && (
        <div className="max-w-4xl mx-auto bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-4 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-[#76676A] mb-2.5">
            Matching Candidates ({matchingCandidates.length}):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {matchingCandidates.slice(0, 6).map((c) => {
              const isSelected = selectedStudent?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCandidate(c)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C58F91] bg-[#F6E0E2] text-[#352A2B] shadow-2xs'
                      : 'border-[#E5D3D0] hover:border-[#C58F91] bg-[#FFF9F6] text-[#76676A] hover:text-[#352A2B]'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-mono font-bold text-xs block text-[#A96873]">
                      {c.rollNo}
                    </span>
                    <span className="text-xs text-[#352A2B] font-bold block truncate">{c.name}</span>
                    <span className="text-[10px] text-[#76676A] block truncate">
                      {c.department} · Yr {c.year} Sem {c.semester} (Sec {c.section})
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#99888A] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results Fallback */}
      {hasSearched && cleanQuery && matchingCandidates.length === 0 && (
        <div className="max-w-2xl mx-auto bg-[#FFFCF8] border border-[#FCA5A5] rounded-2xl p-8 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#DC2626]">No Candidate Record Found</h3>
          <p className="text-xs text-[#76676A] mt-1 max-w-md mx-auto">
            No enrolled student matched query "{searchQuery}". Please check your university registration number or try one of the branch suggestions below:
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {sampleRollNumbers.map((s) => (
              <button
                key={s.roll}
                type="button"
                onClick={() => handleQuickSelect(s.roll)}
                className="text-xs px-2.5 py-1 bg-[#FFF9F6] hover:bg-[#F6E0E2] border border-[#E5D3D0] rounded-md font-mono text-[#A96873] font-bold cursor-pointer"
              >
                {s.roll}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      {selectedStudent && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Student Profile Strip */}
          <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C58F91] to-[#A96873] text-white font-black flex items-center justify-center text-base font-mono shadow-xs border border-[#E9BFC2]">
                {selectedStudent.rollNo.slice(-3)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#352A2B]">{selectedStudent.name}</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#FFF9F6] border border-[#E5D3D0] text-[#A96873]">
                    {selectedStudent.rollNo}
                  </span>
                </div>
                <div className="text-xs text-[#76676A] mt-0.5 font-medium">
                  {selectedStudent.department} · Year {selectedStudent.year} (Semester {selectedStudent.semester}) · Batch {selectedStudent.batch} (Sec {selectedStudent.section})
                </div>
              </div>
            </div>

            <div className="text-xs text-[#76676A] font-mono bg-[#FFF9F6] px-3 py-1.5 rounded-lg border border-[#E5D3D0] w-fit font-medium">
              Registered Exams: <strong className="text-[#059669] font-bold">{selectedStudent.registeredExamIds.length}</strong>
            </div>
          </div>

          {studentAllotments.length > 0 ? (
            studentAllotments.map((allotment) => {
              const exam = exams.find((e) => e.id === allotment.examId);
              const hall = halls.find((h) => h.id === allotment.hallId);

              if (!exam || !hall) return null;

              return (
                <div
                  key={allotment.id}
                  className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-2xl overflow-hidden shadow-md"
                >
                  <div className="bg-gradient-to-r from-[#A96873] via-[#B5797B] to-[#C58F91] px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] uppercase font-bold tracking-wider text-white/90">
                        Assigned Seating
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {exam.courseCode} — {exam.courseTitle}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPrintStudentSlip(selectedStudent, hall, exam, allotment)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-[#A96873] text-xs font-bold hover:bg-[#FFF9F6] transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Hall Ticket Slip</span>
                    </button>
                  </div>

                  <div className="p-6">
                    {/* Big Callout Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-[#FFF9F6] border-2 border-[#C58F91] text-center shadow-xs">
                        <span className="text-xs font-bold text-[#A96873] block uppercase tracking-wider">
                          Seat Number
                        </span>
                        <span className="text-3xl font-mono font-black text-[#352A2B] block mt-1">
                          {allotment.seatCode}
                        </span>
                        <span className="text-xs text-[#059669] font-mono mt-1 block font-bold">
                          Row {allotment.row} · Desk Col {allotment.col}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FFF9F6] border border-[#E5D3D0]">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#A96873] mb-1">
                          <MapPin className="w-4 h-4 text-[#A96873]" />
                          <span>Hall & Location</span>
                        </div>
                        <div className="text-sm font-bold text-[#352A2B]">{hall.code} — {hall.name}</div>
                        <div className="text-xs text-[#76676A] mt-0.5">
                          {hall.building}, {hall.floor}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#FFF9F6] border border-[#E5D3D0]">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] mb-1">
                          <Clock className="w-4 h-4 text-[#D97706]" />
                          <span>Date & Reporting Time</span>
                        </div>
                        <div className="text-sm font-bold text-[#352A2B]">
                          {exam.date} ({exam.session})
                        </div>
                        <div className="text-xs text-[#DC2626] font-mono font-bold mt-0.5">
                          Report by {exam.session === 'FN' ? '09:00 AM' : '01:30 PM'}
                        </div>
                      </div>
                    </div>

                    {/* Campus Hall Route & Directions Guide */}
                    <div className="mb-6 p-3.5 bg-[#F1E5DC]/50 border border-[#E5D3D0] rounded-xl text-xs text-[#76676A] flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-[#A96873] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[#352A2B]">Campus Navigation Guide:</span>
                        <p className="text-[11px] text-[#76676A] mt-0.5 leading-relaxed">
                          Proceed to <strong className="text-[#352A2B]">{hall.building} (Pragati Engineering College, Surampalem)</strong>. Take the staircase or lift to the <strong className="text-[#352A2B]">{hall.floor}</strong>. Locate door <strong className="text-[#A96873]">{hall.code} ({hall.name})</strong> and occupy <strong className="text-[#059669]">Row {allotment.row}, Column {allotment.col}</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Room Visualizer Preview */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-[#76676A] uppercase tracking-wider">
                          Room Layout & Desk Locator
                        </h5>
                        <span className="text-xs text-[#059669] font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                          Highlighted in emerald
                        </span>
                      </div>
                      <SeatingGridVisualizer
                        hall={hall}
                        allotments={allotments}
                        students={students}
                        highlightStudentId={selectedStudent.id}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-8 text-center text-[#76676A]">
              <AlertCircle className="w-8 h-8 text-[#99888A] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#352A2B]">
                Seating Not Yet Allocated for {selectedStudent.name}
              </h4>
              <p className="text-xs text-[#76676A] mt-1 max-w-md mx-auto">
                Candidate is registered for courses ({selectedStudent.registeredExamIds.join(', ')}), but seating has not been generated for this schedule yet. Check back once the Exam Cell runs the automated allocation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Helpful Guidelines Card */}
      <div className="max-w-4xl mx-auto bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 text-xs text-[#76676A] shadow-xs">
        <h4 className="font-bold text-[#352A2B] mb-2.5">Examination Hall Guidelines</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 leading-relaxed">
          <div>
            • <strong className="text-[#352A2B]">Identity Check:</strong> Carry your Physical Student Identity Card and printed seat pass.
          </div>
          <div>
            • <strong className="text-[#352A2B]">Seating Discipline:</strong> Candidates must sit strictly at their allotted seat codes to ensure attendance validation.
          </div>
          <div>
            • <strong className="text-[#352A2B]">Electronics Prohibited:</strong> Cell phones, smart watches, Bluetooth devices, and programmable calculators are strictly banned.
          </div>
          <div>
            • <strong className="text-[#352A2B]">Discrepancies:</strong> In case of any name or roll number mismatch, contact the Exam Cell Control Room on the Ground Floor.
          </div>
        </div>
      </div>
    </div>
  );
};
