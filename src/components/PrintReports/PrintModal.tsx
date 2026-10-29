import React from 'react';
import {
  ExamHall,
  ExamSchedule,
  PrintableReportType,
  SeatAllotment,
  Student,
} from '../../types';
import { DoorChartReport } from './DoorChartReport';
import { AttendanceSheetReport } from './AttendanceSheetReport';
import { DeskSlipsReport } from './DeskSlipsReport';
import { StudentSlipReport } from './StudentSlipReport';
import { MasterRosterReport } from './MasterRosterReport';
import { Printer, X } from 'lucide-react';

interface PrintModalProps {
  reportType: PrintableReportType;
  hall?: ExamHall;
  halls?: ExamHall[];
  exam?: ExamSchedule;
  student?: Student;
  allotment?: SeatAllotment;
  allotments: SeatAllotment[];
  students: Student[];
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  reportType,
  hall,
  halls,
  exam,
  student,
  allotment,
  allotments,
  students,
  onClose,
}) => {
  if (reportType === 'none') return null;

  const handlePrint = () => {
    window.print();
  };

  const getTitle = () => {
    switch (reportType) {
      case 'door_chart':
        return `Hall Door Seating Chart — ${hall?.code || ''}`;
      case 'attendance_sheet':
        return `Invigilator Attendance & Signature Sheet — ${hall?.code || ''}`;
      case 'desk_slips':
        return `Desk Slips — ${hall?.code || ''}`;
      case 'student_slip':
        return `Candidate Exam Entry Pass — ${student?.rollNo || ''}`;
      case 'master_roster':
        return `Consolidated Master Seating Matrix — ${exam?.courseCode || ''}`;
      default:
        return 'Print Document';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#352A2B]/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-[#FFFCF8] rounded-2xl shadow-2xl border border-[#E5D3D0] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls Header (hidden during actual browser print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5D3D0] bg-[#FFF9F6] no-print">
          <div>
            <h3 className="text-base font-bold text-[#352A2B]">{getTitle()}</h3>
            <p className="text-xs text-[#76676A]">
              Official examination cell formatted report. Ready to print or export as PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 btn-rose-primary text-white rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#76676A] hover:text-[#352A2B] rounded-lg hover:bg-[#F6E0E2] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Content */}
        <div className="overflow-y-auto p-6 sm:p-8 flex-1 bg-[#F8F0E8]/50 print:bg-white print:p-0">
          {reportType === 'door_chart' && hall && exam && (
            <DoorChartReport
              hall={hall}
              exam={exam}
              allotments={allotments}
              students={students}
            />
          )}

          {reportType === 'attendance_sheet' && hall && exam && (
            <AttendanceSheetReport
              hall={hall}
              exam={exam}
              allotments={allotments}
              students={students}
            />
          )}

          {reportType === 'desk_slips' && hall && exam && (
            <DeskSlipsReport
              hall={hall}
              exam={exam}
              allotments={allotments}
              students={students}
            />
          )}

          {reportType === 'student_slip' && student && hall && exam && allotment && (
            <StudentSlipReport
              student={student}
              hall={hall}
              exam={exam}
              allotment={allotment}
            />
          )}

          {reportType === 'master_roster' && exam && (
            <MasterRosterReport
              exam={exam}
              halls={halls || (hall ? [hall] : [])}
              students={students}
              allotments={allotments}
            />
          )}
        </div>
      </div>
    </div>
  );
};
