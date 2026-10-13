import { useEffect, useState } from 'react';
import './index.css';
import CoordinatorOverview from './CoordinatorOverview.jsx';

const STORAGE_KEY = 'panelsync-lite-v1';

const panels = [
  { id: 'Panel A', room: 'Room 301', color: 'blue' },
  { id: 'Panel B', room: 'Room 302', color: 'purple' },
  { id: 'Panel C', room: 'Lab 201', color: 'orange' },
];

const slots = [
  '09:00 – 09:20',
  '09:20 – 09:40',
  '09:40 – 10:00',
  '10:20 – 10:40',
  '10:40 – 11:00',
  '11:00 – 11:20',
];

const seedGroups = [
  {
    id: 'G01',
    title: 'CampusBite Smart Queue System',
    mentor: 'Dr. Ananya Rao',
    members: 'Aarav, Meera, Riya',
  },
  {
    id: 'G02',
    title: 'AI Attendance Assistant',
    mentor: 'Dr. Vivek Shah',
    members: 'Karthik, Dev, Nisha',
  },
  {
    id: 'G03',
    title: 'SafeStreet Incident Platform',
    mentor: 'Dr. Ananya Rao',
    members: 'Ishaan, Kavya, Rohan',
  },
  {
    id: 'G04',
    title: 'WasteWise Recycling Tracker',
    mentor: 'Prof. Priya Nair',
    members: 'Aditi, Varun, Sneha',
  },
  {
    id: 'G05',
    title: 'MentorMap Alumni Platform',
    mentor: 'Dr. Vivek Shah',
    members: 'Rahul, Diya, Arjun',
  },
  {
    id: 'G06',
    title: 'GreenGrid Urban Garden Tracker',
    mentor: 'Prof. Priya Nair',
    members: 'Sana, Adarsh, Neel',
  },
  {
    id: 'G07',
    title: 'FarmDirect Marketplace',
    mentor: 'Dr. Mehul Kapoor',
    members: 'Nitin, Pooja, Ayaan',
  },
];

const initialAssignments = [
  {
    groupId: 'G01',
    panel: 'Panel A',
    room: 'Room 301',
    slot: '09:00 – 09:20',
    date: '15 Oct 2026',
  },
  {
    groupId: 'G02',
    panel: 'Panel B',
    room: 'Room 302',
    slot: '09:00 – 09:20',
    date: '15 Oct 2026',
  },
  {
    groupId: 'G03',
    panel: 'Panel C',
    room: 'Lab 201',
    slot: '09:20 – 09:40',
    date: '15 Oct 2026',
  },
  {
    groupId: 'G04',
    panel: 'Panel A',
    room: 'Room 301',
    slot: '09:20 – 09:40',
    date: '15 Oct 2026',
  },
  {
    groupId: 'G05',
    panel: 'Panel B',
    room: 'Room 302',
    slot: '09:40 – 10:00',
    date: '15 Oct 2026',
  },
  {
    groupId: 'G06',
    panel: 'Panel C',
    room: 'Lab 201',
    slot: '09:40 – 10:00',
    date: '15 Oct 2026',
  },
  {
    groupId: 'G07',
    panel: 'Panel A',
    room: 'Room 301',
    slot: '10:20 – 10:40',
    date: '15 Oct 2026',
  },
];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved?.groups && saved?.assignments) {
      return saved;
    }
  } catch {
    return {
      groups: seedGroups,
      assignments: initialAssignments,
    };
  }

  return {
    groups: seedGroups,
    assignments: initialAssignments,
  };
}

function MiniChart({ title, data, color = 'blue' }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="chart-card">
      <div className="chart-title">
        <span>{title}</span>
        <small>LIVE SCHEDULE DATA</small>
      </div>

      <div className="bars">
        {data.map((item) => (
          <div className="bar-unit" key={item.label}>
            <b>{item.value}</b>
            <div className="bar-track">
              <i
                className={color}
                style={{
                  height: `${Math.max(8, (item.value / max) * 100)}%`,
                }}
              />
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function App() {
  const saved = loadState();

  const [groups, setGroups] = useState(saved.groups);
  const [assignments, setAssignments] = useState(saved.assignments);
  const [activeTab, setActiveTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('G01');
  const [selectedPanel, setSelectedPanel] = useState('Panel A');
  const [selectedSlot, setSelectedSlot] = useState('09:00 – 09:20');
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMentor, setNewMentor] = useState('');
  const [newMembers, setNewMembers] = useState('');

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        groups,
        assignments,
      }),
    );
  }, [groups, assignments]);

  const schedule = assignments
    .map((assignment) => ({
      ...assignment,
      group: groups.find((group) => group.id === assignment.groupId),
    }))
    .filter((item) => item.group)
    .sort((a, b) => {
      const slotDifference = slots.indexOf(a.slot) - slots.indexOf(b.slot);
      return slotDifference || a.panel.localeCompare(b.panel);
    });

  const visibleSchedule = schedule.filter((item) => {
    const text =
      `${item.group.id} ${item.group.title} ${item.group.mentor} ${item.panel} ${item.room}`
        .toLowerCase();

    return text.includes(query.toLowerCase());
  });

  const scheduledGroupIds = new Set(assignments.map((item) => item.groupId));
  const unscheduledGroups = groups.filter(
    (group) => !scheduledGroupIds.has(group.id),
  );

  const panelLoad = panels.map((panel) => ({
    label: panel.id.replace('Panel ', ''),
    value: assignments.filter((item) => item.panel === panel.id).length,
  }));

  const mentorNames = [...new Set(groups.map((group) => group.mentor))];

  const mentorLoad = mentorNames.map((mentor) => ({
    label: mentor.replace('Dr. ', '').replace('Prof. ', '').split(' ').at(-1),
    value: assignments.filter(
      (item) =>
        groups.find((group) => group.id === item.groupId)?.mentor === mentor,
    ).length,
  }));

  const highestPanelLoad = Math.max(...panelLoad.map((item) => item.value), 0);
  const busiestPanels = panelLoad
    .filter((item) => item.value === highestPanelLoad && item.value > 0)
    .map((item) => `Panel ${item.label}`);

  const conflictCount = getConflicts(assignments, groups).length;
  const coverage =
    groups.length === 0
      ? 0
      : Math.round((assignments.length / groups.length) * 100);
  const totalCapacity = panels.length * slots.length;
  const openSlots = Math.max(0, totalCapacity - assignments.length);

  function getConflicts(currentAssignments, currentGroups) {
    const conflicts = [];

    currentAssignments.forEach((first, index) => {
      const firstGroup = currentGroups.find(
        (group) => group.id === first.groupId,
      );

      currentAssignments.slice(index + 1).forEach((second) => {
        const secondGroup = currentGroups.find(
          (group) => group.id === second.groupId,
        );

        const sameTime =
          first.slot === second.slot && first.date === second.date;

        if (!sameTime) return;

        if (first.room === second.room) {
          conflicts.push({
            type: 'Room clash',
            message: `${first.room} is assigned to both ${first.groupId} and ${second.groupId} at ${first.slot}.`,
          });
        }

        if (firstGroup?.mentor === secondGroup?.mentor) {
          conflicts.push({
            type: 'Mentor clash',
            message: `${firstGroup.mentor} is assigned to both ${first.groupId} and ${second.groupId} at ${first.slot}.`,
          });
        }
      });
    });

    return conflicts;
  }

  function generateSchedule() {
    const nextAssignments = [];
    const occupiedRooms = new Set();
    const occupiedMentors = new Set();

    groups.forEach((group) => {
      let placed = false;

      for (const slot of slots) {
        for (const panel of panels) {
          const roomKey = `${slot}-${panel.room}`;
          const mentorKey = `${slot}-${group.mentor}`;

          if (!occupiedRooms.has(roomKey) && !occupiedMentors.has(mentorKey)) {
            nextAssignments.push({
              groupId: group.id,
              panel: panel.id,
              room: panel.room,
              slot,
              date: '15 Oct 2026',
            });

            occupiedRooms.add(roomKey);
            occupiedMentors.add(mentorKey);
            placed = true;
            break;
          }
        }

        if (placed) break;
      }
    });

    const unplacedCount = groups.length - nextAssignments.length;

    setAssignments(nextAssignments);
    setNotice(
      unplacedCount === 0
        ? `Conflict-free schedule generated: ${nextAssignments.length} groups assigned.`
        : `Schedule generated: ${nextAssignments.length} groups assigned and ${unplacedCount} group(s) need another slot.`,
    );
  }

  function attemptMove() {
    const group = groups.find((item) => item.id === selectedGroup);
    const panel = panels.find((item) => item.id === selectedPanel);

    if (!group || !panel) return;

    const candidate = {
      groupId: group.id,
      panel: panel.id,
      room: panel.room,
      slot: selectedSlot,
      date: '15 Oct 2026',
    };

    const remaining = assignments.filter(
      (assignment) => assignment.groupId !== selectedGroup,
    );

    const candidateConflicts = getConflicts(
      [...remaining, candidate],
      groups,
    );

    if (candidateConflicts.length > 0) {
      setNotice(`Conflict blocked: ${candidateConflicts[0].message}`);
      return;
    }

    setAssignments([...remaining, candidate]);
    setNotice(
      `${selectedGroup} moved to ${selectedPanel}, ${panel.room}, ${selectedSlot}.`,
    );
  }

  function addGroup() {
    if (!newTitle.trim() || !newMentor.trim() || !newMembers.trim()) {
      setNotice('Enter the project title, mentor and student members.');
      return;
    }

    const newId = `G${String(groups.length + 1).padStart(2, '0')}`;

    setGroups((current) => [
      ...current,
      {
        id: newId,
        title: newTitle.trim(),
        mentor: newMentor.trim(),
        members: newMembers.trim(),
      },
    ]);

    setNewTitle('');
    setNewMentor('');
    setNewMembers('');
    setShowAddGroup(false);
    setNotice(`${newId} was added. Click Generate Schedule to assign it.`);
  }

  function exportCsv() {
    const header = [
      'Group No.',
      'Project Title',
      'Mentor',
      'Student Members',
      'Panel',
      'Room',
      'Time',
      'Date',
      'Status',
    ];

    const scheduledRows = schedule.map((item) => [
      item.group.id,
      item.group.title,
      item.group.mentor,
      item.group.members,
      item.panel,
      item.room,
      item.slot,
      item.date,
      'Scheduled',
    ]);

    const unscheduledRows = unscheduledGroups.map((group) => [
      group.id,
      group.title,
      group.mentor,
      group.members,
      '',
      '',
      '',
      '15 Oct 2026',
      'Unscheduled',
    ]);

    const csv = [header, ...scheduledRows, ...unscheduledRows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');

    downloadLink.href = url;
    downloadLink.download = 'PanelSync_Presentation_Schedule_15-Oct-2026.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    setNotice(
      `CSV exported: ${schedule.length} scheduled and ${unscheduledGroups.length} unscheduled group(s).`,
    );
  }

  function printSchedule() {
    setActiveTab('dashboard');
    window.setTimeout(() => window.print(), 150);
  }

  function resetDemo() {
    const shouldReset = window.confirm(
      'Reset all locally saved PanelSync demo data?',
    );

    if (!shouldReset) return;

    setGroups(seedGroups);
    setAssignments(initialAssignments);
    setNotice('PanelSync demo reset successfully.');
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo">◫</span>
          <span>
            panel<span>sync</span>
            <small>SMART PRESENTATION SCHEDULING</small>
          </span>
        </div>

        <nav>
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'schedule' ? 'active' : ''}
            onClick={() => setActiveTab('schedule')}
          >
            Schedule generator
          </button>
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Panel dashboard
          </button>
          <button
            className={activeTab === 'analytics' ? 'active' : ''}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics & export
          </button>
        </nav>

        <button className="reset" onClick={resetDemo}>
          ↻ Reset demo
        </button>
      </header>

      <main>
        {activeTab === 'overview' && (
          <CoordinatorOverview
            groups={groups}
            assignments={assignments}
            panels={panels}
            slots={slots}
            onOpenSchedule={() => setActiveTab('dashboard')}
          />
        )}

        {notice && (
          <div className="notice">
            ✓ {notice}
            <button onClick={() => setNotice('')}>×</button>
          </div>
        )}

        {activeTab === 'schedule' && (
          <section>
            <div className="hero">
              <div>
                <span className="tag">WOXSEN SCHOOL OF TECHNOLOGY</span>
                <h1>
                  Every group.
                  <br />
                  <em>Exactly on time.</em>
                </h1>
                <p>
                  PanelSync automatically creates a presentation schedule while
                  preventing mentor double-booking and room clashes.
                </p>

                <div className="hero-pills">
                  <span>✓ Room clash prevention</span>
                  <span>✓ Mentor conflict validation</span>
                  <span>✓ One-click generation</span>
                </div>
              </div>

              <div className="hero-visual">
                <div className="calendar-card">
                  <span>15</span>
                  <b>OCT</b>
                  <small>PROJECT PRESENTATIONS</small>
                </div>

                <div className="float one">
                  <span>✓</span>
                  <div>
                    <b>Conflict-free</b>
                    <small>{conflictCount} active conflicts</small>
                  </div>
                </div>

                <div className="float two">
                  <span>◫</span>
                  <div>
                    <b>{coverage}% scheduled</b>
                    <small>{assignments.length} groups assigned</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-head">
              <div>
                <span className="tag dark">COORDINATOR CONTROL CENTER</span>
                <h2>
                  Generate a schedule <em>in seconds.</em>
                </h2>
              </div>

              <button className="primary" onClick={generateSchedule}>
                Generate conflict-free schedule →
              </button>
            </div>

            <div className="config-grid">
              <div className="config-card">
                <span className="config-label">PRESENTATION DATE</span>
                <b>15 October 2026</b>
                <small>09:00 AM – 11:20 AM</small>
              </div>

              <div className="config-card">
                <span className="config-label">PANELS</span>
                <b>3 configured panels</b>
                <small>Panel A, Panel B, Panel C</small>
              </div>

              <div className="config-card">
                <span className="config-label">ROOMS</span>
                <b>3 available rooms</b>
                <small>Room 301, Room 302, Lab 201</small>
              </div>

              <div className="config-card">
                <span className="config-label">TIME SLOTS</span>
                <b>{slots.length} slots available</b>
                <small>20-minute presentation slots</small>
              </div>
            </div>

            <div className="groups-section">
              <div className="groups-header">
                <div>
                  <span className="tag dark">GROUP DATA INTAKE</span>
                  <h2>Project groups</h2>
                </div>

                <button
                  className="outline"
                  onClick={() => setShowAddGroup((current) => !current)}
                >
                  + Add presentation group
                </button>
              </div>

              {showAddGroup && (
                <div className="add-form">
                  <input
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    placeholder="Project title"
                  />

                  <input
                    value={newMentor}
                    onChange={(event) => setNewMentor(event.target.value)}
                    placeholder="Assigned mentor"
                  />

                  <input
                    value={newMembers}
                    onChange={(event) => setNewMembers(event.target.value)}
                    placeholder="Student member names"
                  />

                  <button className="primary" onClick={addGroup}>
                    Add group
                  </button>
                </div>
              )}

              <div className="group-table">
                <div className="group-row header-row">
                  <span>Group</span>
                  <span>Project title</span>
                  <span>Assigned mentor</span>
                  <span>Student members</span>
                </div>

                {groups.map((group) => (
                  <div className="group-row" key={group.id}>
                    <b>{group.id}</b>
                    <span>{group.title}</span>
                    <span>{group.mentor}</span>
                    <small>{group.members}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'dashboard' && (
          <section>
            <div className="dash-head">
              <div>
                <span className="tag dark">PANEL-WISE TIMETABLE</span>
                <h1>Presentation dashboard</h1>
                <p>
                  Search any group, mentor or panel. Manual moves are validated
                  before being saved.
                </p>
              </div>

              <div className="health-badge">
                <b>
                  {conflictCount === 0
                    ? '✓ 0 conflicts'
                    : `${conflictCount} conflicts`}
                </b>
                <small>Schedule validator</small>
              </div>
            </div>

            <div className="search-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search group, project title, mentor or panel..."
              />

              <button className="outline" onClick={() => setQuery('')}>
                Clear search
              </button>
            </div>

            {unscheduledGroups.length > 0 && (
              <div className="notice">
                ⚠ {unscheduledGroups.length} group(s) still need a presentation
                slot: {unscheduledGroups.map((group) => group.id).join(', ')}.
              </div>
            )}

            <div className="schedule-table">
              <div className="schedule-row table-head">
                <span>Group</span>
                <span>Project title & mentor</span>
                <span>Panel / room</span>
                <span>Time</span>
                <span>Date</span>
              </div>

              {visibleSchedule.map((item) => (
                <div className="schedule-row" key={item.groupId}>
                  <b>{item.group.id}</b>

                  <div>
                    <strong>{item.group.title}</strong>
                    <small>{item.group.mentor}</small>
                  </div>

                  <div>
                    <span
                      className={`panel-badge ${
                        panels.find((panel) => panel.id === item.panel)?.color
                      }`}
                    >
                      {item.panel}
                    </span>
                    <small>{item.room}</small>
                  </div>

                  <span>{item.slot}</span>
                  <span>{item.date}</span>
                </div>
              ))}

              {visibleSchedule.length === 0 && (
                <div className="schedule-row">
                  <span>No scheduled groups match this search.</span>
                </div>
              )}
            </div>

            <div className="move-card">
              <div>
                <span className="tag dark">MANUAL OVERRIDE WITH VALIDATION</span>
                <h2>Try to reschedule a group</h2>
                <p>
                  The system blocks a move if it causes a room or mentor clash.
                  Try moving G03 to Panel A at 09:00–09:20 to see a conflict.
                </p>
              </div>

              <div className="move-controls">
                <select
                  value={selectedGroup}
                  onChange={(event) => setSelectedGroup(event.target.value)}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.id} — {group.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPanel}
                  onChange={(event) => setSelectedPanel(event.target.value)}
                >
                  {panels.map((panel) => (
                    <option key={panel.id} value={panel.id}>
                      {panel.id} — {panel.room}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSlot}
                  onChange={(event) => setSelectedSlot(event.target.value)}
                >
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>

                <button className="primary" onClick={attemptMove}>
                  Validate & move →
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section>
            <div className="dash-head">
              <div>
                <span className="tag dark">COORDINATOR ANALYTICS</span>
                <h1>Schedule health</h1>
                <p>
                  A quick view of panel use, mentor allocation and completion
                  coverage.
                </p>
              </div>

              <div className="export-actions">
                <button className="outline" onClick={exportCsv}>
                  Download CSV ↓
                </button>
                <button className="primary" onClick={printSchedule}>
                  Print / Save as PDF →
                </button>
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric">
                <span>Schedule coverage</span>
                <b>{coverage}%</b>
                <small>
                  {assignments.length} of {groups.length} groups scheduled
                </small>
              </div>

              <div className="metric green">
                <span>Conflict count</span>
                <b>{conflictCount}</b>
                <small>Room and mentor validation</small>
              </div>

              <div className="metric orange">
                <span>Open capacity</span>
                <b>{openSlots}</b>
                <small>Available presentation slots</small>
              </div>

              <div className="metric purple">
                <span>Unscheduled groups</span>
                <b>{unscheduledGroups.length}</b>
                <small>
                  {unscheduledGroups.length === 0
                    ? 'All groups have confirmed slots'
                    : 'Needs coordinator attention'}
                </small>
              </div>
            </div>

            <div className="charts">
              <MiniChart
                title="Groups scheduled per panel"
                data={panelLoad}
                color="blue"
              />

              <MiniChart
                title="Mentor presentation load"
                data={mentorLoad}
                color="purple"
              />
            </div>

            <div className="analytics-bottom">
              <MiniChart
                title="Schedule status overview"
                data={[
                  { label: 'Assigned', value: assignments.length },
                  { label: 'Open slots', value: openSlots },
                  { label: 'Conflicts', value: conflictCount },
                ]}
                color="orange"
              />

              <div className="insight">
                <span className="tag dark">AUTOMATED INSIGHT</span>
                <h2>What the scheduler says</h2>
                <ul>
                  <li>
                    <b>{coverage}%</b> of currently registered groups have
                    confirmed presentation slots.
                  </li>
                  <li>
                    The schedule currently has <b>{conflictCount}</b> room or
                    mentor conflict{conflictCount === 1 ? '' : 's'}.
                  </li>
                  <li>
                    {busiestPanels.length > 0 ? (
                      <>
                        <b>{busiestPanels.join(' and ')}</b> has the highest
                        scheduled load with {highestPanelLoad} group
                        {highestPanelLoad === 1 ? '' : 's'}.
                      </>
                    ) : (
                      'No panel currently has a scheduled presentation.'
                    )}
                  </li>
                  <li>
                    <b>{unscheduledGroups.length}</b> group
                    {unscheduledGroups.length === 1 ? '' : 's'} remain
                    unscheduled, while <b>{openSlots}</b> presentation slots
                    are still available.
                  </li>
                  <li>
                    CSV export includes scheduled and unscheduled groups;
                    Print / Save as PDF opens the official timetable view.
                  </li>
                </ul>
                <p>
                  Prototype analytics are generated from browser-local demo
                  data.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}