import React, { useState } from 'react';
import { AuthUser, UserRole } from '../../types';
import { authenticate, DEMO_ACCOUNTS } from '../../services/authService';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Users,
  Lock,
  ArrowRight,
  AlertCircle,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [identifier, setIdentifier] = useState('admin@pragati.ac.in');
  const [password, setPassword] = useState('admin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectDemoRole = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    const demo = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (demo) {
      setIdentifier(demo.username);
      setPassword(demo.defaultPassword);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both your institutional ID and password.');
      return;
    }

    const user = authenticate(identifier, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setErrorMessage('Invalid institutional credentials. (Default demo password is "admin").');
    }
  };

  const handleOneClickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    const { defaultPassword, description, ...user } = account;
    onLoginSuccess(user);
  };

  const roleIcons = {
    admin: Users,
    officer: ShieldCheck,
    invigilator: UserCheck,
    student: GraduationCap,
  };

  return (
    <div className="min-h-screen bg-[#F8F0E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#E9BFC2] selection:text-[#352A2B] relative overflow-hidden">
      {/* Ambient warm rose glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#E9BFC2]/35 via-[#F6E0E2]/30 to-[#C58F91]/20 blur-[100px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#F6E0E2]/40 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E9BFC2]/30 blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Seal and Title */}
        <div className="inline-block relative">
          <div className="relative p-1 rounded-full bg-gradient-to-b from-[#C58F91] via-[#E9BFC2] to-transparent shadow-lg">
            <img
              src="/src/assets/images/exam_institution_crest_1792915042889.jpg"
              alt="Pragati Engineering College Autonomous Seal"
              className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-[#FFFCF8]"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 bg-[#FFFCF8] rounded-full border border-[#E5D3D0] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#A96873]" />
          </span>
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#352A2B] via-[#A96873] to-[#C58F91] bg-clip-text text-transparent">
          ExamSeat Pro
        </h2>
        <p className="mt-1 text-sm font-bold text-[#A96873]">
          Pragati Engineering College (Autonomous), Surampalem
        </p>
        <p className="text-xs text-[#76676A] mt-0.5">
          Automated Examination Seating Allotment System · B.Tech 8 Semesters
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0 relative z-10">
        <div className="bg-[#FFFCF8] py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-[#E5D3D0] relative">
          {/* Top highlight line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#C58F91] to-transparent rounded-t-2xl" />

          {/* Role Selection Tabs */}
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#76676A] block mb-2.5">
              Select Institutional Persona:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = roleIcons[acc.role];
                const isSelected = selectedRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemoRole(acc.role)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-[#C58F91] bg-[#F6E0E2] ring-2 ring-[#C58F91]/30 shadow-sm'
                        : 'border-[#E5D3D0] bg-[#FFF9F6] hover:bg-[#F6E0E2]/50 text-[#76676A] hover:text-[#352A2B]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mb-2 transition-colors ${
                        isSelected ? 'text-[#A96873]' : 'text-[#99888A]'
                      }`}
                    />
                    <div className="text-xs font-bold text-[#352A2B] leading-tight">
                      {acc.role === 'admin'
                        ? 'Exam Admin'
                        : acc.role === 'officer'
                        ? 'Exam Officer'
                        : acc.role === 'invigilator'
                        ? 'Invigilator'
                        : 'Student'}
                    </div>
                    <div className="text-[10px] text-[#76676A] truncate mt-0.5 font-medium">
                      {acc.name.split(' ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Description Notice */}
          {selectedRole && (
            <div className="mb-6 p-3.5 bg-[#F1E5DC]/50 border border-[#E5D3D0] rounded-xl text-xs text-[#76676A] flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#A96873] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#352A2B]">
                  {selectedRole === 'admin' && 'Role: Exam Cell Administrator'}
                  {selectedRole === 'officer' && 'Role: Examination Officer'}
                  {selectedRole === 'invigilator' && 'Role: Faculty / Invigilator'}
                  {selectedRole === 'student' && 'Role: Enrolled Candidate'}
                </span>
                <p className="text-[11px] text-[#76676A] mt-0.5 leading-relaxed">
                  {DEMO_ACCOUNTS.find((a) => a.role === selectedRole)?.description}
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Credential Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#352A2B] mb-1.5">
                {selectedRole === 'student'
                  ? 'Registration / Roll Number or Email'
                  : 'Institutional Email / Username'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  selectedRole === 'student'
                    ? 'e.g. 25A35A0501 or 23A31A0501'
                    : 'e.g. admin@pragati.ac.in'
                }
                required
                className="w-full px-3.5 py-2.5 text-xs bg-[#FFF9F6] border border-[#E5D3D0] rounded-xl text-[#352A2B] focus:bg-[#FFF9F6] focus:outline-none focus:border-[#A96873] focus:ring-2 focus:ring-[#E9BFC2]/40 font-mono transition-all placeholder:text-[#99888A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#352A2B] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-[#FFF9F6] border border-[#E5D3D0] rounded-xl text-[#352A2B] focus:bg-[#FFF9F6] focus:outline-none focus:border-[#A96873] focus:ring-2 focus:ring-[#E9BFC2]/40 font-mono transition-all"
              />
              <span className="text-[10px] text-[#76676A] mt-1.5 block">
                Demo credential password for all roles: <code className="font-mono text-[#A96873] bg-[#F6E0E2] px-1.5 py-0.5 rounded border border-[#E5D3D0] font-bold">admin</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 btn-rose-primary rounded-xl text-xs font-bold transition-all active:scale-[0.99] cursor-pointer shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In to {selectedRole.toUpperCase()} Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Fast 1-Click Demo Logins Strip */}
          <div className="mt-6 pt-5 border-t border-[#E5D3D0]">
            <span className="text-[11px] font-bold text-[#76676A] block mb-2.5 text-center">
              Or instantly sign in with 1-click test credentials:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={`quick-${acc.role}`}
                  type="button"
                  onClick={() => handleOneClickLogin(acc)}
                  className="py-2 px-3 bg-[#FFF9F6] hover:bg-[#F6E0E2] border border-[#E5D3D0] hover:border-[#C58F91] text-[#352A2B] rounded-xl text-[11px] font-medium transition-all text-left truncate flex items-center justify-between group cursor-pointer shadow-2xs"
                  title={`Sign in as ${acc.name} (${acc.role})`}
                >
                  <span className="truncate">{acc.name.split(' ')[0]} ({acc.role})</span>
                  <span className="text-[10px] text-[#A96873] font-bold group-hover:translate-x-0.5 transition-transform shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-[11px] text-[#76676A] max-w-md mx-auto">
          Protected Academic Information System. Role-based access control enforces isolation between administrative, supervisory, and student workspaces.
        </p>
      </div>
    </div>
  );
};
