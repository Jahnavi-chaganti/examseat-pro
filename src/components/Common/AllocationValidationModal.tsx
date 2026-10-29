import React, { useState, useEffect } from 'react';
import { AllocationValidationReport, ExamSchedule } from '../../types';
import { validateSeatingPlanApi } from '../../services/apiClient';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Users,
  Grid,
  Ban,
  Percent,
} from 'lucide-react';

interface AllocationValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamSchedule;
}

export const AllocationValidationModal: React.FC<AllocationValidationModalProps> = ({
  isOpen,
  onClose,
  exam,
}) => {
  const [report, setReport] = useState<AllocationValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runValidation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await validateSeatingPlanApi(exam.id);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Validation request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && exam) {
      runValidation();
    }
  }, [isOpen, exam?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#352A2B]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in no-print">
      <div className="bg-[#FFFCF8] rounded-2xl shadow-2xl border border-[#E5D3D0] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5D3D0] bg-[#FFF9F6] text-[#352A2B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D1FAE5] border border-[#A7F3D0] rounded-xl text-[#059669] shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
                Allocation Integrity & Anti-Cheat Audit
              </h2>
              <p className="text-xs text-[#76676A]">
                {exam.courseCode}: {exam.courseTitle} ({exam.semesterLabel})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#76676A] hover:text-[#352A2B] hover:bg-[#F6E0E2] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[#F8F0E8]/40">
          {loading && (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#A96873] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#76676A]">
                Running SQLite constraint solver and anti-cheat neighbor scanner...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-[#DC2626] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {report && !loading && (
            <>
              {/* Verdict Summary Card */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  report.isValid
                    ? 'bg-[#D1FAE5] border-[#A7F3D0] text-[#059669]'
                    : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {report.isValid ? (
                    <CheckCircle2 className="w-6 h-6 text-[#059669] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-[#DC2626] shrink-0" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold">
                      {report.isValid ? 'Audit Verdict: PASSED' : 'Audit Verdict: CONSTRAINTS VIOLATED'}
                    </h3>
                    <p className="text-xs text-[#76676A] mt-0.5">{report.summary}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold text-[#76676A] uppercase">Integrity Score</div>
                  <div className="text-2xl font-bold font-mono text-[#A96873]">
                    {report.integrityScore}%
                  </div>
                </div>
              </div>

              {/* 4 Pillars Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#FFF9F6] p-3.5 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#352A2B] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#A96873]" />
                      Duplicate Candidates
                    </span>
                    {report.duplicateStudentErrors.length === 0 ? (
                      <span className="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                        0 (Pass)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEE2E2] border border-[#FCA5A5] px-2 py-0.5 rounded">
                        {report.duplicateStudentErrors.length} Fail
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#76676A] mt-1">
                    Ensures each student is assigned to at most 1 examination hall and desk.
                  </p>
                </div>

                <div className="bg-[#FFF9F6] p-3.5 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#352A2B] flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-[#A96873]" />
                      Double-Booked Desks
                    </span>
                    {report.duplicateSeatErrors.length === 0 ? (
                      <span className="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                        0 (Pass)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEE2E2] border border-[#FCA5A5] px-2 py-0.5 rounded">
                        {report.duplicateSeatErrors.length} Fail
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#76676A] mt-1">
                    Ensures no physical desk slot has multiple candidates assigned.
                  </p>
                </div>

                <div className="bg-[#FFF9F6] p-3.5 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#352A2B] flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-[#A96873]" />
                      Blocked Seat Invariance
                    </span>
                    {report.blockedSeatErrors.length === 0 ? (
                      <span className="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                        0 (Pass)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEE2E2] border border-[#FCA5A5] px-2 py-0.5 rounded">
                        {report.blockedSeatErrors.length} Fail
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#76676A] mt-1">
                    Verifies that damaged benches, broken furniture, or pillar seats remain empty.
                  </p>
                </div>

                <div className="bg-[#FFF9F6] p-3.5 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#352A2B] flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-[#A96873]" />
                      Room Capacity Limits
                    </span>
                    {report.capacityExceededErrors.length === 0 ? (
                      <span className="text-[11px] font-bold text-[#059669] bg-[#D1FAE5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                        100% Within Limits
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEE2E2] border border-[#FCA5A5] px-2 py-0.5 rounded">
                        Over Capacity
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#76676A] mt-1">
                    Verifies that hall occupancy does not exceed authorized room desk count.
                  </p>
                </div>
              </div>

              {/* Mixed-Department Separation Report */}
              <div className="bg-[#FFF9F6] p-4 rounded-xl border border-[#E5D3D0] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold text-[#76676A] tracking-wider">
                    Mixed-Department Neighbor Inspection
                  </h4>
                  <span className="text-[11px] text-[#A96873] font-mono font-bold">
                    {report.departmentNeighborCollisions.length === 0
                      ? 'Optimal: 0 adjacent same-branch pairs'
                      : `${report.departmentNeighborCollisions.length} adjacent same-branch occurrences`}
                  </span>
                </div>

                {report.departmentNeighborCollisions.length > 0 ? (
                  <div className="overflow-x-auto max-h-48 border border-[#E5D3D0] rounded-xl bg-[#FFFCF8]">
                    <table className="w-full text-left text-[11px] text-[#76676A]">
                      <thead className="bg-[#F1E5DC]/70 text-[#76676A] font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2">Hall</th>
                          <th className="p-2">Desk A</th>
                          <th className="p-2">Candidate A</th>
                          <th className="p-2">Desk B</th>
                          <th className="p-2">Candidate B</th>
                          <th className="p-2">Department</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5D3D0]/60 font-mono">
                        {report.departmentNeighborCollisions.map((c, idx) => (
                          <tr key={idx} className="hover:bg-[#F6E0E2]/30">
                            <td className="p-2 font-bold text-[#352A2B]">{c.hallCode}</td>
                            <td className="p-2 text-[#A96873] font-semibold">{c.seatCodeA}</td>
                            <td className="p-2 text-[#352A2B]">{c.studentA}</td>
                            <td className="p-2 text-[#A96873] font-semibold">{c.seatCodeB}</td>
                            <td className="p-2 text-[#352A2B]">{c.studentB}</td>
                            <td className="p-2 text-[#D97706] font-semibold">{c.deptA}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#059669] bg-[#D1FAE5] p-3 rounded-lg border border-[#A7F3D0] font-semibold">
                    Excellent! All neighboring students sitting side-by-side or sharing benches belong to different engineering branches.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FFF9F6] border-t border-[#E5D3D0] flex items-center justify-between">
          <button
            type="button"
            onClick={runValidation}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[#76676A] hover:text-[#352A2B] font-bold px-3 py-1.5 rounded-lg border border-[#E5D3D0] hover:bg-[#F6E0E2] transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-verify Constraints</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#FFFCF8] hover:bg-[#F6E0E2] text-[#352A2B] border border-[#E5D3D0] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
