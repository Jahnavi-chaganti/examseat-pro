import React, { useState, useEffect } from 'react';
import { AuditLogEntry, DatabaseStats } from '../../types';
import { fetchAuditLogs, fetchDatabaseStats, restoreBackupApi, resetDatabaseApi } from '../../services/apiClient';
import {
  Database,
  History,
  FileCheck2,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  X,
  Server,
  HardDrive,
  FileSpreadsheet,
} from 'lucide-react';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataModified?: () => void;
  onShowToast: (msg: string) => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  isOpen,
  onClose,
  onDataModified,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'database' | 'backup'>('audit');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Restore file state
  const [restoreJson, setRestoreJson] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        fetchAuditLogs(100, actionFilter !== 'all' ? actionFilter : undefined),
        fetchDatabaseStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load audit or stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, actionFilter]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.details.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.entityId && log.entityId.toLowerCase().includes(q))
    );
  });

  const handleExportLogsCsv = () => {
    const headers = ['Timestamp', 'Actor Name', 'Role', 'Action', 'Entity', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExamSeat_AuditLogs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onShowToast('Audit log exported to CSV.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRestoreJson(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreJson.trim()) {
      setRestoreError('Please provide backup JSON contents to restore.');
      return;
    }

    try {
      setIsRestoring(true);
      setRestoreError(null);
      const parsed = JSON.parse(restoreJson);
      await restoreBackupApi(parsed);
      onShowToast('Database restored successfully from verified JSON snapshot.');
      if (onDataModified) onDataModified();
      await loadData();
      setRestoreJson('');
    } catch (err: any) {
      setRestoreError(`Invalid JSON format or database schema validation failure: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDatabaseReset = async () => {
    if (!window.confirm('Reset database to Pragati Engineering College official baseline? This will reinitialize sample students, halls, and exams.')) {
      return;
    }

    try {
      setIsLoading(true);
      await resetDatabaseApi();
      onShowToast('Database reset to fresh baseline.');
      if (onDataModified) onDataModified();
      await loadData();
    } catch (err: any) {
      onShowToast(`Reset failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#352A2B]/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-[#FFFCF8] rounded-2xl border border-[#E5D3D0] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#FFF9F6] px-6 py-4 border-b border-[#E5D3D0] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#C58F91] to-[#A96873] rounded-xl text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
                Enterprise Database & Audit History
                <span className="text-[11px] font-mono font-bold bg-[#F1E5DC] text-[#059669] px-2.5 py-0.5 rounded-full border border-[#E5D3D0]">
                  SQLite 3 ACID
                </span>
              </h2>
              <p className="text-xs text-[#76676A]">
                Pragati Engineering College (Autonomous) · Examination Cell Data Engine
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

        {/* Tab Navigation */}
        <div className="bg-[#F1E5DC]/40 px-6 py-2.5 border-b border-[#E5D3D0] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#FFFCF8] text-[#A96873] border border-[#E9BFC2] shadow-xs'
                  : 'text-[#76676A] hover:text-[#352A2B]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail ({logs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-[#FFFCF8] text-[#A96873] border border-[#E9BFC2] shadow-xs'
                  : 'text-[#76676A] hover:text-[#352A2B]'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Database Storage Engine</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-[#FFFCF8] text-[#A96873] border border-[#E9BFC2] shadow-xs'
                  : 'text-[#76676A] hover:text-[#352A2B]'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Verified Backup & Recovery</span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-[#76676A] hover:text-[#A96873] font-semibold px-2 py-1 rounded-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F8F0E8]/50">
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FFFCF8] p-3 rounded-xl border border-[#E5D3D0] shadow-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#99888A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by action, officer, student or details..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] placeholder:text-[#99888A] rounded-lg focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#99888A]" />
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="text-xs bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg px-2.5 py-1.5 font-semibold focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
                  >
                    <option value="all">All Actions</option>
                    <option value="ALLOCATE_EXAM">Seating Allocations</option>
                    <option value="APPROVE_EXAM">Exam Approvals</option>
                    <option value="UNLOCK_EXAM">Plan Unlocks</option>
                    <option value="SWAP_SEATS">Desk Swaps</option>
                    <option value="MARK_ATTENDANCE">Attendance Marking</option>
                    <option value="CREATE_STUDENT">Student Enrolment</option>
                    <option value="RESTORE_BACKUP">Backup Restorations</option>
                    <option value="SYSTEM_RESET">System Resets</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportLogsCsv}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#FFF9F6] hover:bg-[#F6E0E2] text-[#352A2B] rounded-lg border border-[#E5D3D0] transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Log Table */}
              <div className="bg-[#FFFCF8] rounded-xl border border-[#E5D3D0] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#76676A]">
                    <thead className="bg-[#F1E5DC]/70 text-[#76676A] uppercase font-bold text-[10px] tracking-wider border-b border-[#E5D3D0]">
                      <tr>
                        <th className="py-2.5 px-4">Timestamp</th>
                        <th className="py-2.5 px-4">Actor</th>
                        <th className="py-2.5 px-4">Action</th>
                        <th className="py-2.5 px-4">Entity</th>
                        <th className="py-2.5 px-4">Details & Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5D3D0]/60 font-sans">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-[#76676A]">
                            No audit log events match the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => {
                          const isApproval = log.action === 'APPROVE_EXAM';
                          const isSwap = log.action === 'SWAP_SEATS';
                          const isAlloc = log.action === 'ALLOCATE_EXAM';
                          const isAttend = log.action === 'MARK_ATTENDANCE';

                          return (
                            <tr key={log.id} className="hover:bg-[#F6E0E2]/30 transition-colors">
                              <td className="py-2.5 px-4 font-mono text-[11px] text-[#76676A] whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-[#352A2B]">{log.actorName}</div>
                                <span className="inline-block text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-[#FFF9F6] text-[#76676A] border border-[#E5D3D0]">
                                  {log.actorRole}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isApproval
                                      ? 'bg-[#D1FAE5] text-[#059669] border-[#A7F3D0]'
                                      : isSwap
                                      ? 'bg-[#F6E0E2] text-[#A96873] border-[#E9BFC2]'
                                      : isAlloc
                                      ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                                      : isAttend
                                      ? 'bg-[#F1E5DC] text-[#352A2B] border-[#E5D3D0]'
                                      : 'bg-[#FFF9F6] text-[#352A2B] border-[#E5D3D0]'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-[#76676A] uppercase text-[10px] font-mono font-bold">
                                {log.entityType}
                              </td>
                              <td className="py-2.5 px-4 text-[#352A2B] text-[11px] max-w-md font-medium">
                                {log.details}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && stats && (
            <div className="space-y-6">
              {/* Engine Status Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FFFCF8] via-[#F1E5DC]/40 to-[#FFFCF8] text-[#352A2B] flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E5D3D0] shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#F6E0E2] rounded-xl border border-[#E9BFC2] text-[#A96873] shadow-xs">
                    <HardDrive className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
                      {stats.engine}
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#059669] bg-[#D1FAE5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Online & Healthy
                      </span>
                    </h3>
                    <p className="text-xs text-[#76676A] mt-0.5 font-mono">
                      Database File: {stats.dbFile} (ACID Transactions · WAL Mode)
                    </p>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-xs text-[#76676A] font-semibold">Storage File Size</div>
                  <div className="text-xl font-bold font-mono text-[#A96873]">
                    {stats.storageSizeBytes ? `${(stats.storageSizeBytes / 1024).toFixed(1)} KB` : 'Active'}
                  </div>
                </div>
              </div>

              {/* Table Record Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#76676A] block">Enrolled Students</span>
                  <div className="text-2xl font-bold font-mono text-[#A96873] mt-1">
                    {stats.counts.students}
                  </div>
                  <span className="text-[10px] text-[#99888A]">4 Years · 8 Sems</span>
                </div>

                <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#76676A] block">Exam Halls</span>
                  <div className="text-2xl font-bold font-mono text-[#352A2B] mt-1">
                    {stats.counts.halls}
                  </div>
                  <span className="text-[10px] text-[#99888A]">AB, KB, VB, CB</span>
                </div>

                <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#76676A] block">Exam Schedules</span>
                  <div className="text-2xl font-bold font-mono text-[#352A2B] mt-1">
                    {stats.counts.exams}
                  </div>
                  <span className="text-[10px] text-[#99888A]">All B.Tech Depts</span>
                </div>

                <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#76676A] block">Seat Allotments</span>
                  <div className="text-2xl font-bold font-mono text-[#059669] mt-1">
                    {stats.counts.allotments}
                  </div>
                  <span className="text-[10px] text-[#99888A]">Active Desks</span>
                </div>

                <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#76676A] block">Audit Log Entries</span>
                  <div className="text-2xl font-bold font-mono text-[#352A2B] mt-1">
                    {stats.counts.auditLogs}
                  </div>
                  <span className="text-[10px] text-[#99888A]">Immutable Log</span>
                </div>

                <div className="bg-[#FFFCF8] p-4 rounded-xl border border-[#E5D3D0] shadow-2xs">
                  <span className="text-[11px] font-bold text-[#76676A] block">Authorized Users</span>
                  <div className="text-2xl font-bold font-mono text-[#352A2B] mt-1">
                    {stats.counts.users}
                  </div>
                  <span className="text-[10px] text-[#99888A]">RBAC Profiles</span>
                </div>
              </div>

              {/* Database Schema & Integrity Guarantees */}
              <div className="bg-[#FFFCF8] p-5 rounded-xl border border-[#E5D3D0] space-y-3 shadow-xs">
                <h4 className="text-xs uppercase font-bold text-[#76676A] tracking-wider">
                  Database Constraints & Allocation Integrity Enforcements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
                    <span className="font-bold text-[#352A2B] block mb-0.5">UNIQUE(exam_id, student_id)</span>
                    <p className="text-[#76676A] text-[11px]">
                      Strict database engine constraint ensuring no student can ever be double-assigned in the same exam.
                    </p>
                  </div>
                  <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
                    <span className="font-bold text-[#352A2B] block mb-0.5">UNIQUE(exam_id, hall_id, row, col, bench_slot)</span>
                    <p className="text-[#76676A] text-[11px]">
                      Prevents seat collision at the physical desk level. Two candidates cannot occupy the same desk slot.
                    </p>
                  </div>
                  <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
                    <span className="font-bold text-[#352A2B] block mb-0.5">FOREIGN KEY ON DELETE CASCADE</span>
                    <p className="text-[#76676A] text-[11px]">
                      Maintains referential integrity between students, exam schedules, hall inventory, and seating records.
                    </p>
                  </div>
                  <div className="p-3 bg-[#FFF9F6] rounded-xl border border-[#E5D3D0]">
                    <span className="font-bold text-[#352A2B] block mb-0.5">WAL (Write-Ahead Logging)</span>
                    <p className="text-[#76676A] text-[11px]">
                      Guarantees atomicity, consistency, isolation, and durability for simultaneous invigilator attendance marks.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Backup & Restore Instructions */}
              <div className="bg-[#FFFCF8] p-5 rounded-xl border border-[#E5D3D0] shadow-xs">
                <h3 className="text-sm font-bold text-[#352A2B] mb-1">
                  Validated Backup Export & Restoration
                </h3>
                <p className="text-xs text-[#76676A] mb-4">
                  Export complete snapshots of students, examination halls, schedules, allotments, and audit logs.
                  Restoration performs schema verification and runs in an ACID transaction with rollback on failure.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="/api/backup/export"
                    download
                    className="flex items-center gap-2 px-4 py-2 btn-rose-primary rounded-lg text-xs font-bold transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Verified JSON Backup</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleDatabaseReset}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#FFF9F6] hover:bg-[#FEE2E2] text-[#76676A] hover:text-[#DC2626] border border-[#E5D3D0] hover:border-[#FCA5A5] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Database to University Baseline</span>
                  </button>
                </div>
              </div>

              {/* Restore File Form */}
              <div className="bg-[#FFFCF8] p-5 rounded-xl border border-[#E5D3D0] space-y-4 shadow-xs">
                <h4 className="text-xs uppercase font-bold text-[#76676A] tracking-wider">
                  Restore from JSON Backup File
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#352A2B] block">
                    Upload Backup JSON File:
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="text-xs text-[#76676A] file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#F6E0E2] file:text-[#A96873] hover:file:bg-[#E9BFC2] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#352A2B] block">
                    Or Paste Backup JSON Content:
                  </label>
                  <textarea
                    rows={6}
                    value={restoreJson}
                    onChange={(e) => setRestoreJson(e.target.value)}
                    placeholder="Paste exported backup JSON here..."
                    className="w-full text-xs font-mono p-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-xl focus:outline-none focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
                  />
                </div>

                {restoreError && (
                  <div className="p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-[#DC2626] text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring || !restoreJson.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 btn-rose-primary disabled:opacity-40 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isRestoring ? 'Validating & Restoring...' : 'Validate & Restore Backup'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FFF9F6] border-t border-[#E5D3D0] flex items-center justify-between text-xs text-[#76676A]">
          <span>Pragati Engineering College (Autonomous), Surampalem · Exam Cell Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#FFFCF8] hover:bg-[#F6E0E2] text-[#352A2B] border border-[#E5D3D0] rounded-lg font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
