import React from 'react';
import { UserRole } from '../types';
import { ShieldCheck, UserCheck, GraduationCap, Users } from 'lucide-react';

interface RoleBannerProps {
  currentRole: UserRole;
  onSwitchRole?: (role: UserRole) => void;
}

const ROLE_CONFIGS = {
  admin: {
    title: 'Exam Cell Administrator Console',
    desc: 'Manage student registrations, exam schedules, examination halls, seating capacity, and execute the automated mixed-seating allocation engine.',
    icon: Users,
    glow: 'from-[#E9BFC2]/30 to-transparent',
    iconBg: 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2]',
    badge: 'Administrative Access',
    badgeStyle: 'bg-[#F6E0E2] text-[#A96873] border border-[#E9BFC2]',
  },
  officer: {
    title: 'Examination Officer Review & Approval',
    desc: 'Review automated allotments, inspect adjacent-department anti-cheat integrity audits, verify zero seat collisions, and formally approve/lock seating plans.',
    icon: ShieldCheck,
    glow: 'from-[#A7F3D0]/30 to-transparent',
    iconBg: 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]',
    badge: 'Authority Sign-off',
    badgeStyle: 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]',
  },
  invigilator: {
    title: 'Faculty & Invigilator Portal',
    desc: 'Inspect allocated halls, track live student attendance (Present, Absent, Malpractice), and generate official printable door charts, signature rosters, and desk slips.',
    icon: UserCheck,
    glow: 'from-[#FDE68A]/30 to-transparent',
    iconBg: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
    badge: 'Hall Supervision',
    badgeStyle: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
  },
  student: {
    title: 'Student Seat Lookup Portal',
    desc: 'Search your University Registration / Roll Number to instantly find your assigned examination hall, floor block, row, column, and exact desk number.',
    icon: GraduationCap,
    glow: 'from-[#E9BFC2]/30 to-transparent',
    iconBg: 'bg-[#F1E5DC] text-[#352A2B] border border-[#E5D3D0]',
    badge: 'Public Student Access',
    badgeStyle: 'bg-[#F1E5DC] text-[#352A2B] border border-[#E5D3D0]',
  },
};

export const RoleBanner: React.FC<RoleBannerProps> = ({ currentRole }) => {
  const config = ROLE_CONFIGS[currentRole];
  const Icon = config.icon;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#FFFCF8] via-[#F1E5DC]/50 to-[#FFFCF8] no-print border-b border-[#E5D3D0]">
      {/* Dynamic ambient color glow according to active role */}
      <div className={`absolute top-0 left-0 w-96 h-full bg-gradient-to-r ${config.glow} blur-2xl pointer-events-none opacity-60`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-4.5 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-2.5 rounded-xl ${config.iconBg} shrink-0 shadow-xs`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#352A2B]">
                  {config.title}
                </h1>
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md ${config.badgeStyle}`}>
                  {config.badge}
                </span>
              </div>
              <p className="text-xs text-[#76676A] mt-0.5 max-w-3xl leading-relaxed">
                {config.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
