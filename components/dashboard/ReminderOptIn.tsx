"use client";

import { useEffect, useState } from "react";
import {
  askNotificationPermission,
  loadReminder,
  notificationsSupported,
  reminderIcs,
  saveReminder,
  scheduleReminder,
  type ReminderPrefs,
} from "@/lib/reminders";

// Daily reminder: browser notification while a tab is open, plus a calendar event.
export function ReminderOptIn({ gameEndDate, practicedToday }: { gameEndDate: string; practicedToday: boolean }) {
  const [prefs, setPrefs] = useState<ReminderPrefs>({ enabled: false, time: "19:00" });
  const [blocked, setBlocked] = useState(false);
  const [canNotify, setCanNotify] = useState(false);

  useEffect(() => {
    setPrefs(loadReminder());
    setCanNotify(notificationsSupported());
  }, []);
  useEffect(() => scheduleReminder(prefs, () => practicedToday), [prefs, practicedToday]);

  const update = (next: ReminderPrefs) => {
    setPrefs(next);
    saveReminder(next);
  };

  async function toggle(enabled: boolean) {
    if (enabled && !(await askNotificationPermission())) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    update({ ...prefs, enabled });
  }

  function downloadCalendar() {
    const ics = reminderIcs(prefs.time, gameEndDate, `${window.location.origin}/exercise`);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "upscale-practice.ics" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
      <h2 className="font-mono text-sm text-accent">daily reminder</h2>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor="reminder-time" className="text-muted">
          Remind me at
        </label>
        <input
          id="reminder-time"
          type="time"
          value={prefs.time}
          onChange={(e) => update({ ...prefs, time: e.target.value || "19:00" })}
          className="rounded-md border border-line bg-bg px-2 py-1 font-mono"
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {canNotify && (
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => void toggle(e.target.checked)}
              className="size-4 accent-[var(--color-accent)]"
            />
            Browser notification
          </label>
        )}
        <button
          type="button"
          onClick={downloadCalendar}
          className="rounded-md border border-line px-3 py-2 text-sm hover:bg-raised"
        >
          Add daily reminder to calendar
        </button>
      </div>
      <p className="text-xs text-muted">
        {blocked
          ? "Notifications are blocked for this site. Allow them in your browser settings, or use the calendar reminder."
          : "Browser notifications arrive while Upscale is open in a tab. The calendar reminder works everywhere."}
      </p>
    </section>
  );
}
