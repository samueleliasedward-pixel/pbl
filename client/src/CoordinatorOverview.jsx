import { useState } from 'react';

const KEY = 'panelsync-publication-v1';

function loadPublication() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export default function CoordinatorOverview({
  groups,
  assignments,
  panels,
  slots,
  onOpenSchedule,
}) {
  const [publication, setPublication] = useState(loadPublication);
  const [feedback, setFeedback] = useState('');

  const signature = JSON.stringify({ groups, assignments });
  const groupIds = new Set(groups.map((group) => group.id));
  const assignedIds = new Set(
    assignments
      .filter((assignment) => groupIds.has(assignment.groupId))
      .map((assignment) => assignment.groupId),
  );

  const unscheduled = groups.filter((group) => !assignedIds.has(group.id));
  const errors = [];

  assignments.forEach((entry, index) => {
    if (!groupIds.has(entry.groupId)) {
      errors.push(`Unknown group: ${entry.groupId}`);
    }

    if (!slots.includes(entry.slot)) {
      errors.push(`${entry.groupId}: time slot is not configured.`);
    }

    const configuredPanel = panels.find((panel) => panel.id === entry.panel);

    if (!configuredPanel || configuredPanel.room !== entry.room) {
      errors.push(`${entry.groupId}: panel/room configuration is invalid.`);
    }

    if (!entry.date) {
      errors.push(`${entry.groupId}: presentation date is missing.`);
    }

    assignments.slice(index + 1).forEach((other) => {
      if (entry.groupId === other.groupId) {
        errors.push(`${entry.groupId} has multiple assignments.`);
      }

      if (entry.date !== other.date || entry.slot !== other.slot) return;

      if (entry.room === other.room) {
        errors.push(
          `Room conflict: ${entry.groupId} and ${other.groupId} in ${entry.room}.`,
        );
      }

      if (entry.panel === other.panel) {
        errors.push(
          `Panel conflict: ${entry.groupId} and ${other.groupId} on ${entry.panel}.`,
        );
      }

      const mentorA = groups.find(
        (group) => group.id === entry.groupId,
      )?.mentor;
      const mentorB = groups.find(
        (group) => group.id === other.groupId,
      )?.mentor;

      if (mentorA && mentorB && mentorA.trim().toLowerCase() === mentorB.trim().toLowerCase()) {
        errors.push(
          `Mentor conflict: ${mentorA} is assigned simultaneously to ${entry.groupId} and ${other.groupId}.`,
        );
      }
    });
  });

  const uniqueErrors = [...new Set(errors)];
  const coverage = groups.length
    ? Math.round((assignedIds.size / groups.length) * 100)
    : 0;

  const dates = new Set(assignments.map((entry) => entry.date).filter(Boolean));
  const dayCount = Math.max(dates.size, 1);
  const capacity = panels.length * slots.length * dayCount;
  const occupiedCells = new Set(
    assignments.map((entry) => `${entry.date}|${entry.panel}|${entry.slot}`),
  ).size;

  const utilisation = capacity
    ? Math.round((occupiedCells / capacity) * 100)
    : 0;

  const canPublish =
    groups.length > 0 &&
    unscheduled.length === 0 &&
    uniqueErrors.length === 0;

  const isCurrent =
    publication && publication.signature === signature;

  const stateLabel = isCurrent
    ? 'Published snapshot'
    : publication
      ? 'Draft — changed since publication'
      : 'Draft — not published';

  function publish() {
    if (!canPublish) {
      setFeedback(
        'Publication blocked. Schedule every group and resolve validation errors first.',
      );
      return;
    }

    const next = {
      version: (publication?.version || 0) + 1,
      at: new Date().toISOString(),
      signature,
      groupCount: groups.length,
      assignments: JSON.parse(JSON.stringify(assignments)),
      notifications: groups.map((group) => ({
        id: group.id,
        mentor: group.mentor,
        title: group.title,
        status: 'Prepared — simulation only',
      })),
    };

    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setPublication(next);
      setFeedback(
        `Version ${next.version} saved locally. Notification previews prepared; no email was sent.`,
      );
    } catch {
      setFeedback(
        'Could not save publication. Browser storage may be unavailable or full.',
      );
    }
  }

  function downloadSnapshot() {
    if (!publication) return;

    const blob = new Blob(
      [JSON.stringify(publication, null, 2)],
      { type: 'application/json' },
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `panelsync-publication-v${publication.version}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="pro-overview">
      <div className="dash-head">
        <div>
          <span className="tag dark">COORDINATOR COMMAND CENTER</span>
          <h1>Presentation readiness</h1>
          <p>
            Validate the timetable, inspect capacity and save a published
            snapshot before sharing.
          </p>
        </div>
        <button className="primary" onClick={onOpenSchedule}>
          Open timetable →
        </button>
      </div>

      <div className="pro-banner">
        <div>
          <span className="tag">ACADEMIC DEMO · LOCAL BROWSER STORAGE</span>
          <h2>{canPublish ? 'Ready for coordinator approval' : 'Review required'}</h2>
          <p>{stateLabel}</p>
        </div>
        <div className="pro-score">
          <b>{coverage}%</b>
          <span>groups assigned</span>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <span>Registered groups</span>
          <b>{groups.length}</b>
          <small>Current project roster</small>
        </div>
        <div className="metric green">
          <span>Unscheduled groups</span>
          <b>{unscheduled.length}</b>
          <small>{assignedIds.size} unique groups assigned</small>
        </div>
        <div className="metric orange">
          <span>Validation issues</span>
          <b>{uniqueErrors.length}</b>
          <small>Resource and assignment checks</small>
        </div>
        <div className="metric purple">
          <span>Panel utilisation</span>
          <b>{utilisation}%</b>
          <small>{occupiedCells} of {capacity} configured cells occupied</small>
        </div>
      </div>

      <div className="pro-grid">
        <article className="chart-card">
          <div className="chart-title">
            <span>Panel capacity allocation</span>
            <small>CALCULATED</small>
          </div>
          {panels.map((panel) => {
            const used = new Set(
              assignments
                .filter((entry) => entry.panel === panel.id)
                .map((entry) => `${entry.date}|${entry.slot}`),
            ).size;

            const available = slots.length * dayCount;
            const percent = available ? (used / available) * 100 : 0;

            return (
              <div className="pro-load" key={panel.id}>
                <div>
                  <b>{panel.id}</b>
                  <span>{panel.room} · {used}/{available} cells</span>
                </div>
                <div className="pro-progress">
                  <i style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
              </div>
            );
          })}
          <p className="pro-note">
            Capacity uses configured slots across dates currently represented
            in the timetable, or one demo day when empty.
          </p>
        </article>

        <article className="chart-card">
          <div className="chart-title">
            <span>Schedule validation</span>
            <small>{canPublish ? 'READY' : 'ACTION NEEDED'}</small>
          </div>

          {uniqueErrors.length === 0 && (
            <div className="pro-check">
              ✓ No duplicate, mentor, room or panel conflicts detected
              in the configured fixed-slot model.
            </div>
          )}

          {uniqueErrors.map((error) => (
            <div className="pro-error" key={error}>{error}</div>
          ))}

          {unscheduled.length > 0 && (
            <div className="pro-error">
              Unscheduled: {unscheduled.map((group) => group.id).join(', ')}.
              Generate a schedule or assign these groups manually.
            </div>
          )}

          <p className="pro-note">
            This validation applies to the current fixed-duration time grid.
            It does not verify institutional approval or mentor availability
            outside the configured demo.
          </p>
        </article>
      </div>

      <div className="pro-grid">
        <article className="chart-card">
          <span className="tag dark">VERSIONED PUBLICATION</span>
          <h2>Publish a validated snapshot</h2>
          <p className="pro-note">
            Save a local publication version. Changes to groups or assignments
            make it stale until you publish again.
          </p>
          <div className="pro-actions">
            <button
              className="primary"
              onClick={publish}
              disabled={!canPublish || Boolean(isCurrent)}
            >
              {isCurrent ? 'Current version published' : 'Validate & publish'}
            </button>
            <button
              className="outline"
              onClick={downloadSnapshot}
              disabled={!publication}
            >
              Download published JSON
            </button>
          </div>

          {publication && (
            <p className="pro-note">
              Version {publication.version} · saved{' '}
              {new Date(publication.at).toLocaleString()} ·{' '}
              {publication.groupCount} groups.
            </p>
          )}

          {feedback && <p className="pro-feedback" role="status">{feedback}</p>}
        </article>

        <article className="chart-card">
          <span className="tag dark">NOTIFICATION PREVIEW</span>
          <h2>Presentation notices</h2>
          <p className="pro-note">
            One preview per group in the latest published snapshot.
            These are not sent emails.
          </p>
          {!publication && (
            <p className="pro-note">Publish a valid schedule to create previews.</p>
          )}
          {publication?.notifications.map((notification) => (
            <div className="pro-notice-row" key={notification.id}>
              <div>
                <b>{notification.id} · {notification.mentor}</b>
                <small>{notification.title}</small>
              </div>
              <span>Preview</span>
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
