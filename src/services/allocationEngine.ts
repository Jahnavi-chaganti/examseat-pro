import {
  AllocationMode,
  AllocationResult,
  AllocationRuleConfig,
  ExamHall,
  ExamSchedule,
  SeatAllotment,
  Student,
} from '../types';

interface SeatSlot {
  hallId: string;
  hallCode: string;
  row: number;
  col: number;
  slot: 'A' | 'B';
  seatCode: string;
}

/**
 * Generate all valid, non-blocked seats for a set of halls
 */
export function generateAvailableSeats(
  halls: ExamHall[],
  selectedHallIds: string[],
  config: AllocationRuleConfig
): SeatSlot[] {
  const targetHalls = halls.filter((h) => selectedHallIds.includes(h.id));
  const availableSeats: SeatSlot[] = [];

  for (const hall of targetHalls) {
    const blockedSet = new Set(hall.blockedSeats);

    for (let r = 1; r <= hall.rows; r++) {
      for (let c = 1; c <= hall.columns; c++) {
        // Staggered / buffer mode: skip alternate columns or checkerboard positions
        if (config.mode === 'staggered_buffer' || config.bufferEmptySeats) {
          if ((r + c) % 2 !== 0) {
            continue; // Skip this seat to create safe distance
          }
        }

        const slots: ('A' | 'B')[] = hall.desksPerBench === 2 ? ['A', 'B'] : ['A'];

        for (const slot of slots) {
          const seatKey = `R${r}-C${c}-${slot}`;
          if (blockedSet.has(seatKey)) {
            continue; // Skip physically blocked / defective seat
          }

          const padR = String(r).padStart(2, '0');
          const padC = String(c).padStart(2, '0');
          const seatCode = `${hall.code}-R${padR}-C${padC}${hall.desksPerBench === 2 ? `-${slot}` : ''}`;

          availableSeats.push({
            hallId: hall.id,
            hallCode: hall.code,
            row: r,
            col: c,
            slot,
            seatCode,
          });
        }
      }
    }
  }

  return availableSeats;
}

/**
 * Group students by department or section for smart interleaving
 */
function groupStudents(
  students: Student[],
  separateBy: 'department' | 'section' | 'subject' | 'semester'
): Map<string, Student[]> {
  const groups = new Map<string, Student[]>();

  for (const student of students) {
    let key: string = student.department;
    if (separateBy === 'section') {
      key = `${student.department}-Sec${student.section}`;
    } else if (separateBy === 'semester') {
      key = `Sem${student.semester}-${student.department}`;
    }
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(student);
  }

  // Sort students within each group by Roll Number for orderly indexing
  for (const [_, list] of groups) {
    list.sort((a, b) => a.rollNo.localeCompare(b.rollNo));
  }

  return groups;
}

/**
 * Interleave multiple groups so that adjacent elements come from different groups
 * e.g., [CSE1, CSE2, CSE3], [ECE1, ECE2], [ME1, ME2] -> [CSE1, ECE1, ME1, CSE2, ECE2, ME2, CSE3]
 */
function interleaveStudents(grouped: Map<string, Student[]>): Student[] {
  const groupArrays = Array.from(grouped.values()).map((list) => [...list]);
  const interleaved: Student[] = [];

  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const group of groupArrays) {
      if (group.length > 0) {
        interleaved.push(group.shift()!);
        hasMore = true;
      }
    }
  }

  return interleaved;
}

/**
 * Run the automated seating allotment engine
 */
export function runSeatingAllocation(
  exam: ExamSchedule,
  allStudents: Student[],
  allHalls: ExamHall[],
  config: AllocationRuleConfig
): AllocationResult {
  const warnings: string[] = [];

  // Filter students registered for this exam
  const registeredStudents = allStudents.filter((s) =>
    s.registeredExamIds.includes(exam.id)
  );

  if (registeredStudents.length === 0) {
    return {
      examId: exam.id,
      timestamp: new Date().toISOString(),
      mode: config.mode,
      totalStudents: 0,
      allocatedCount: 0,
      unallocatedCount: 0,
      unallocatedStudentIds: [],
      integrityScore: 100,
      adjacentCollisionsCount: 0,
      hallSummaries: [],
      allotments: [],
      warnings: ['No students registered for this examination.'],
    };
  }

  // Get available seats in the selected halls
  const selectedHalls = allHalls.filter((h) => config.selectedHallIds.includes(h.id));
  if (selectedHalls.length === 0) {
    return {
      examId: exam.id,
      timestamp: new Date().toISOString(),
      mode: config.mode,
      totalStudents: registeredStudents.length,
      allocatedCount: 0,
      unallocatedCount: registeredStudents.length,
      unallocatedStudentIds: registeredStudents.map((s) => s.id),
      integrityScore: 0,
      adjacentCollisionsCount: 0,
      hallSummaries: [],
      allotments: [],
      warnings: ['No examination halls selected for allotment.'],
    };
  }

  // Order of student sequence based on chosen algorithm mode
  let studentSequence: Student[] = [];
  const grouped = groupStudents(registeredStudents, config.separateBy);

  if (config.mode === 'mixed_checkerboard') {
    // Interleave students from different departments/sections
    studentSequence = interleaveStudents(grouped);
  } else if (config.mode === 'greedy_sequential') {
    // Sequential by department (fill one department first)
    for (const list of grouped.values()) {
      studentSequence.push(...list);
    }
  } else if (config.mode === 'balanced_density') {
    // Interleaved, distributed across halls
    studentSequence = interleaveStudents(grouped);
  } else if (config.mode === 'staggered_buffer') {
    studentSequence = interleaveStudents(grouped);
  }

  // Generate seats per hall
  const hallSeatMap = new Map<string, SeatSlot[]>();
  let totalAvailableSeats = 0;

  for (const hall of selectedHalls) {
    const seats = generateAvailableSeats([hall], [hall.id], config);
    hallSeatMap.set(hall.id, seats);
    totalAvailableSeats += seats.length;
  }

  if (totalAvailableSeats < registeredStudents.length) {
    warnings.push(
      `Capacity deficit: Required ${registeredStudents.length} seats, but selected halls only provide ${totalAvailableSeats} active non-blocked seats (${registeredStudents.length - totalAvailableSeats} seats short).`
    );
  }

  // Prepare ordered list of seat slots according to allocation strategy
  const orderedSeats: SeatSlot[] = [];

  if (config.mode === 'balanced_density' && selectedHalls.length > 1) {
    // Distribute round-robin or proportionally across halls
    const hallQueues = selectedHalls.map((h) => [...(hallSeatMap.get(h.id) || [])]);
    let hasSeats = true;
    while (hasSeats) {
      hasSeats = false;
      for (const queue of hallQueues) {
        if (queue.length > 0) {
          orderedSeats.push(queue.shift()!);
          hasSeats = true;
        }
      }
    }
  } else {
    // Normal sequential hall fill
    for (const hall of selectedHalls) {
      const seats = hallSeatMap.get(hall.id) || [];
      orderedSeats.push(...seats);
    }
  }

  // Execute Allocation with Anti-Duplicate Invariants
  const allotments: SeatAllotment[] = [];
  const assignedStudentIds = new Set<string>();
  const assignedSeatKeys = new Set<string>();
  const unallocatedStudentIds: string[] = [];

  const maxAllocatable = Math.min(studentSequence.length, orderedSeats.length);

  for (let i = 0; i < studentSequence.length; i++) {
    const student = studentSequence[i];

    if (i < orderedSeats.length) {
      const seat = orderedSeats[i];
      const seatKey = `${seat.hallId}-${seat.row}-${seat.col}-${seat.slot}`;

      // Invariant checks: No duplicate student, no duplicate seat
      if (assignedStudentIds.has(student.id)) {
        warnings.push(`Duplicate student assignment prevented for ${student.rollNo}.`);
        continue;
      }
      if (assignedSeatKeys.has(seatKey)) {
        warnings.push(`Duplicate seat collision prevented at ${seat.seatCode}.`);
        continue;
      }

      assignedStudentIds.add(student.id);
      assignedSeatKeys.add(seatKey);

      allotments.push({
        id: `allot-${exam.id}-${student.id}`,
        examId: exam.id,
        studentId: student.id,
        hallId: seat.hallId,
        row: seat.row,
        col: seat.col,
        benchSlot: seat.slot,
        seatCode: seat.seatCode,
        attendance: 'unmarked',
      });
    } else {
      unallocatedStudentIds.push(student.id);
    }
  }

  // Calculate Academic Integrity & Collision Metrics
  // Check how many adjacent neighbors (left/right/front/back) share the exact same department
  const studentMap = new Map(allStudents.map((s) => [s.id, s]));
  const hallAllotmentMap = new Map<string, SeatAllotment[]>();
  for (const allot of allotments) {
    if (!hallAllotmentMap.has(allot.hallId)) {
      hallAllotmentMap.set(allot.hallId, []);
    }
    hallAllotmentMap.get(allot.hallId)!.push(allot);
  }

  let totalAdjacentPairs = 0;
  let adjacentCollisions = 0;

  for (const [_hallId, hallAllots] of hallAllotmentMap) {
    const gridMap = new Map<string, SeatAllotment>();
    for (const a of hallAllots) {
      gridMap.set(`${a.row},${a.col}`, a);
    }

    for (const a of hallAllots) {
      const studentA = studentMap.get(a.studentId);
      if (!studentA) continue;

      // Check right neighbor (r, c + 1)
      const right = gridMap.get(`${a.row},${a.col + 1}`);
      if (right) {
        const studentB = studentMap.get(right.studentId);
        if (studentB) {
          totalAdjacentPairs++;
          if (studentA.department === studentB.department) {
            adjacentCollisions++;
          }
        }
      }

      // Check front neighbor (r + 1, c)
      const down = gridMap.get(`${a.row + 1},${a.col}`);
      if (down) {
        const studentB = studentMap.get(down.studentId);
        if (studentB) {
          totalAdjacentPairs++;
          if (studentA.department === studentB.department) {
            adjacentCollisions++;
          }
        }
      }
    }
  }

  let integrityScore = 100;
  if (totalAdjacentPairs > 0) {
    integrityScore = Math.max(
      0,
      Math.round(((totalAdjacentPairs - adjacentCollisions) / totalAdjacentPairs) * 100)
    );
  }

  // Hall Summaries
  const hallSummaries = selectedHalls.map((hall) => {
    const hallAllots = allotments.filter((a) => a.hallId === hall.id);
    const totalSeats = (hallSeatMap.get(hall.id) || []).length;
    const deptCounts: Record<string, number> = {};

    for (const allot of hallAllots) {
      const student = studentMap.get(allot.studentId);
      if (student) {
        deptCounts[student.department] = (deptCounts[student.department] || 0) + 1;
      }
    }

    return {
      hallId: hall.id,
      hallName: hall.name,
      hallCode: hall.code,
      totalSeats,
      allocatedSeats: hallAllots.length,
      occupancyRate: totalSeats > 0 ? Math.round((hallAllots.length / totalSeats) * 100) : 0,
      departmentBreakdown: deptCounts,
    };
  });

  return {
    examId: exam.id,
    timestamp: new Date().toISOString(),
    mode: config.mode,
    totalStudents: registeredStudents.length,
    allocatedCount: allotments.length,
    unallocatedCount: unallocatedStudentIds.length,
    unallocatedStudentIds,
    integrityScore,
    adjacentCollisionsCount: adjacentCollisions,
    hallSummaries,
    allotments,
    warnings,
  };
}
