import React, { useState } from 'react';
import { ExamHall } from '../../types';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { SeatingGridVisualizer } from '../Common/SeatingGridVisualizer';

interface HallManagerProps {
  halls: ExamHall[];
  onAddHall: (hall: ExamHall) => void;
  onUpdateHall: (hall: ExamHall) => void;
  onDeleteHall: (hallId: string) => void;
}

export const HallManager: React.FC<HallManagerProps> = ({
  halls,
  onAddHall,
  onUpdateHall,
  onDeleteHall,
}) => {
  const [selectedHallId, setSelectedHallId] = useState<string>(halls[0]?.id || '');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New hall form state
  const [newCode, setNewCode] = useState('LH-301');
  const [newName, setNewName] = useState('Sir Isaac Newton Hall');
  const [newBuilding, setNewBuilding] = useState('Science & Tech Complex');
  const [newFloor, setNewFloor] = useState('3rd Floor');
  const [newRows, setNewRows] = useState(6);
  const [newCols, setNewCols] = useState(6);
  const [newDesksPerBench, setNewDesksPerBench] = useState<1 | 2>(1);
  const [newInvigilator, setNewInvigilator] = useState('Dr. S. Mukherjee');

  const currentHall = halls.find((h) => h.id === selectedHallId) || halls[0];

  const handleToggleBlockedSeat = (seatKey: string) => {
    if (!currentHall) return;
    const exists = currentHall.blockedSeats.includes(seatKey);
    const updatedBlocked = exists
      ? currentHall.blockedSeats.filter((k) => k !== seatKey)
      : [...currentHall.blockedSeats, seatKey];

    onUpdateHall({
      ...currentHall,
      blockedSeats: updatedBlocked,
    });
  };

  const handleCreateHall = (e: React.FormEvent) => {
    e.preventDefault();
    const newHall: ExamHall = {
      id: `hall-${Date.now()}`,
      code: newCode.trim(),
      name: newName.trim(),
      building: newBuilding.trim(),
      floor: newFloor.trim(),
      rows: Number(newRows),
      columns: Number(newCols),
      desksPerBench: newDesksPerBench,
      blockedSeats: [],
      invigilatorName: newInvigilator.trim(),
      invigilatorDept: 'Academic Faculty',
    };

    onAddHall(newHall);
    setSelectedHallId(newHall.id);
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFCF8] border border-[#E5D3D0] rounded-xl p-5 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#352A2B] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#A96873]" />
            <span>Examination Halls & Capacity Planning</span>
          </h3>
          <p className="text-xs text-[#76676A] mt-0.5">
            Configure hall dimensions, benches, and click desks in the layout below to toggle broken or blocked seats.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="inline-flex items-center gap-1.5 px-4 py-2 btn-rose-primary rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Examination Hall</span>
        </button>
      </div>

      {/* Add New Hall Form Modal / Drawer */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateHall}
          className="bg-[#FFFCF8] border border-[#C58F91] rounded-xl p-6 shadow-xl animate-fade-in space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E5D3D0]">
            <h4 className="text-sm font-bold text-[#352A2B]">Configure New Examination Hall</h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-[#76676A] hover:text-[#352A2B] font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Hall Code</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Hall Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Building</label>
              <input
                type="text"
                value={newBuilding}
                onChange={(e) => setNewBuilding(e.target.value)}
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Floor Level</label>
              <input
                type="text"
                value={newFloor}
                onChange={(e) => setNewFloor(e.target.value)}
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Number of Rows</label>
              <input
                type="number"
                min="2"
                max="15"
                value={newRows}
                onChange={(e) => setNewRows(Number(e.target.value))}
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Number of Columns</label>
              <input
                type="number"
                min="2"
                max="15"
                value={newCols}
                onChange={(e) => setNewCols(Number(e.target.value))}
                required
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>

            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Desk Capacity Mode</label>
              <select
                value={newDesksPerBench}
                onChange={(e) => setNewDesksPerBench(Number(e.target.value) as 1 | 2)}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873] cursor-pointer"
              >
                <option value={1}>1 Candidate per Desk (Single Desk)</option>
                <option value={2}>2 Candidates per Bench (Slot A & Slot B)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-[#352A2B] block mb-1">Assigned Invigilator</label>
              <input
                type="text"
                value={newInvigilator}
                onChange={(e) => setNewInvigilator(e.target.value)}
                className="w-full py-2 px-3 bg-[#FFF9F6] border border-[#E5D3D0] text-[#352A2B] rounded-lg focus:border-[#A96873] focus:ring-1 focus:ring-[#A96873]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-4 btn-rose-primary text-white rounded-lg font-bold shadow-md transition-all cursor-pointer"
              >
                Save & Initialize Hall
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Hall Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {halls.map((hall) => {
          const isSelected = hall.id === currentHall?.id;
          const totalSeats = hall.rows * hall.columns * hall.desksPerBench;
          const usableSeats = totalSeats - hall.blockedSeats.length;

          return (
            <button
              key={hall.id}
              type="button"
              onClick={() => setSelectedHallId(hall.id)}
              className={`px-4 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#F6E0E2] text-[#352A2B] border-[#C58F91] ring-2 ring-[#C58F91]/20 shadow-xs'
                  : 'bg-[#FFF9F6] text-[#76676A] border-[#E5D3D0] hover:border-[#C58F91] hover:text-[#352A2B]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#A96873]">{hall.code}</span>
                <span className="text-[11px] font-bold text-[#352A2B]">{hall.name}</span>
              </div>
              <div className="text-[11px] mt-0.5 text-[#76676A]">
                {usableSeats} usable / {totalSeats} max seats · {hall.blockedSeats.length} blocked
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Hall Layout & Blocked Seats Editor */}
      {currentHall && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFCF8] p-4 rounded-xl border border-[#E5D3D0] shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#352A2B]">
                  Interactive Grid Editor: {currentHall.name} ({currentHall.code})
                </h4>
                <span className="text-xs font-mono bg-[#FFF9F6] border border-[#E5D3D0] text-[#A96873] px-2 py-0.5 rounded font-bold">
                  {currentHall.rows} × {currentHall.columns} ({currentHall.rows * currentHall.columns * currentHall.desksPerBench} Total)
                </span>
              </div>
              <p className="text-xs text-[#76676A] mt-0.5">
                Click any seat below to toggle defective/blocked furniture. Blocked seats are strictly excluded from automated allocation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#76676A] font-semibold">
                Blocked Desks: <strong className="text-[#DC2626]">{currentHall.blockedSeats.length}</strong>
              </span>
              {halls.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteHall(currentHall.id)}
                  className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="Delete Hall"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <SeatingGridVisualizer
            hall={currentHall}
            allotments={[]}
            students={[]}
            isEditableLayout={true}
            onToggleBlockedSeat={handleToggleBlockedSeat}
          />
        </div>
      )}
    </div>
  );
};
