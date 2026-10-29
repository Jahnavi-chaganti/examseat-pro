import React from 'react';
import { AuthUser } from '../types';
import { LogOut, RotateCcw, Download, Shield, UserCheck, GraduationCap, Users, Database } from 'lucide-react';

interface HeaderProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onResetData: () => void;
  onExportData: () => void;
  onOpenAuditModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onResetData,
  onExportData,
  onOpenAuditModal,
}) => {
  const roleDisplay = {
    admin: { label: 'Exam Cell Admin', icon: Users, color: 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2]' },
    officer: { label: 'Examination Officer', icon: Shield, color: 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]' },
    invigilator: { label: 'Invigilator', icon: UserCheck, color: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]' },
    student: { label: 'Student Candidate', icon: GraduationCap, color: 'bg-[#F1E5DC] text-[#352A2B] border border-[#E5D3D0]' },
  }[currentUser.role];

  const RoleIcon = roleDisplay.icon;

  return (
    <header className="bg-[#FFFCF8]/95 backdrop-blur-md border-b border-[#E5D3D0] sticky top-0 z-40 no-print transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Institution Crest & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <img
                src="/src/assets/images/exam_institution_crest_1792915042889.jpg"
                alt="Pragati Engineering College Seal"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border border-[#E5D3D0] object-cover shadow-sm ring-1 ring-[#C58F91]/40"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#059669] border-2 border-[#FFFCF8]" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#352A2B] via-[#A96873] to-[#C58F91] bg-clip-text text-transparent whitespace-nowrap">
                  ExamSeat Pro
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F1E5DC] text-[#059669] border border-[#E5D3D0] shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                  SQLite 3 ACID
                </span>
              </div>
              <span className="block text-[11px] text-[#76676A] font-medium truncate max-w-[240px] sm:max-w-none">
                Pragati Engineering College (Autonomous), Surampalem
              </span>
            </div>
          </div>

          {/* Zone 2: Authenticated User Persona & Role Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 p-1.5 px-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0] shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#C58F91] to-[#A96873] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-bold text-[#352A2B] truncate max-w-44">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#76676A] truncate max-w-44 font-medium">
                  {currentUser.designation}
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${roleDisplay.color}`}
              >
                <RoleIcon className="w-3 h-3" />
                <span className="whitespace-nowrap">{roleDisplay.label}</span>
              </span>
            </div>
          </div>

          {/* Zone 3: Quick Action Tools & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {(currentUser.role === 'admin' || currentUser.role === 'officer') && onOpenAuditModal && (
              <button
                type="button"
                onClick={onOpenAuditModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#A96873] bg-[#FFF9F6] border border-[#E5D3D0] rounded-lg hover:border-[#C58F91] hover:bg-[#F6E0E2] hover:shadow-xs transition-all whitespace-nowrap shrink-0 shadow-xs active:scale-95 cursor-pointer"
                title="View SQLite database tables and immutable audit trail"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Database & Audit</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={onExportData}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#352A2B] bg-[#FFF9F6] border border-[#E5D3D0] rounded-lg hover:bg-[#F6E0E2] hover:border-[#C58F91] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  title="Export database to JSON backup"
                >
                  <Download className="w-3.5 h-3.5 text-[#A96873]" />
                  <span>Export</span>
                </button>

                <button
                  type="button"
                  onClick={onResetData}
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#76676A] bg-[#FFF9F6] border border-[#E5D3D0] rounded-lg hover:text-[#352A2B] hover:bg-[#F6E0E2] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  title="Reset to fresh demo university records"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#76676A]" />
                  <span>Reset</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#DC2626] bg-[#FEE2E2]/70 hover:bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg transition-all whitespace-nowrap shrink-0 active:scale-95 cursor-pointer shadow-xs"
              title="Sign out of system"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
