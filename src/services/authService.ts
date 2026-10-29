import { AuthUser, UserRole } from '../types';

export const DEMO_ACCOUNTS: (AuthUser & { defaultPassword: string; description: string })[] = [
  {
    id: 'user-admin-1',
    username: 'admin@pragati.ac.in',
    name: 'Dr. G. Raghuram',
    email: 'admin@pragati.ac.in',
    role: 'admin',
    designation: 'Controller of Examinations & Exam Cell Head',
    department: 'Pragati Central Exam Cell (Surampalem)',
    defaultPassword: 'admin',
    description: 'Manages Pragati B.Tech students, 8 semester exams, halls, and seating allocation.',
  },
  {
    id: 'user-officer-1',
    username: 'officer@pragati.ac.in',
    name: 'Dr. S. Sambhu Prasad',
    email: 'officer@pragati.ac.in',
    role: 'officer',
    designation: 'Chief Superintendent & Academic Dean',
    department: 'Office of the Principal, Pragati Surampalem',
    defaultPassword: 'admin',
    description: 'Audits multi-branch anti-cheat integrity, verifies zero collisions, and locks seating plans.',
  },
  {
    id: 'user-invigilator-1',
    username: 'invigilator@pragati.ac.in',
    name: 'Dr. G. Satyanarayana',
    email: 'invigilator@pragati.ac.in',
    role: 'invigilator',
    designation: 'Professor & Senior Hall Supervisor',
    department: 'Computer Science & Engineering',
    defaultPassword: 'admin',
    description: 'Supervises assigned examination hall, marks live attendance, and prints rosters.',
  },
  {
    id: 'user-student-1',
    username: '25A35A0501',
    name: 'Sai Gudimetla (25A35A0501)',
    email: '25a35a0501@pragati.ac.in',
    role: 'student',
    designation: 'II B.Tech II Sem (CSE - Lateral Entry)',
    department: 'Computer Science & Engineering',
    rollNo: '25A35A0501',
    defaultPassword: 'admin',
    description: 'Search registration number to locate hall, row, desk code, and download hall ticket.',
  },
];

const AUTH_STORAGE_KEY = 'examseat_auth_session_pragati_v4';

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load user from localStorage', err);
  }
  return null;
}

export function saveUserSession(user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to store user session', err);
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove user session', err);
  }
}

export function authenticate(usernameOrRoll: string, password: string): AuthUser | null {
  const query = usernameOrRoll.trim().toLowerCase();
  const trimmedPass = password.trim();

  // Check demo accounts first
  const account = DEMO_ACCOUNTS.find(
    (acc) =>
      (acc.username.toLowerCase() === query ||
        acc.email.toLowerCase() === query ||
        (acc.rollNo && acc.rollNo.toLowerCase() === query)) &&
      (acc.defaultPassword === trimmedPass || trimmedPass === 'admin')
  );

  if (account) {
    const { defaultPassword, description, ...user } = account;
    return user;
  }

  // Handle any JNTUK / Pragati roll number (e.g. 25A35A0501, 23A31A0501, 22A31A0401, etc.)
  if (query.includes('a3') || query.startsWith('2') || query.length >= 8) {
    const roll = query.toUpperCase();
    const studentUser: AuthUser = {
      id: `student-login-${roll}`,
      username: roll,
      name: `Candidate (${roll})`,
      email: `${query}@pragati.ac.in`,
      role: 'student',
      designation: 'Enrolled B.Tech Candidate',
      rollNo: roll,
    };
    return studentUser;
  }

  return null;
}
