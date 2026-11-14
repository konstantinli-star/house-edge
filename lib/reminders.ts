// Daily practice reminder (return mechanic), with no server push needed:
// 1) a browser notification at the chosen time while a Upscale tab is open;
// 2) a daily recurring calendar event (.ics) that works everywhere.

export type ReminderPrefs = { enabled: boolean; time: string }; // "HH:MM" local

const KEY = "upscale:reminder";
const DEFAULT: ReminderPrefs = { enabled: false, time: "19:00" };

export function loadReminder(): ReminderPrefs {
  try {
    return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<ReminderPrefs>) };
  } catch {
    return DEFAULT;
  }
}

export function saveReminder(prefs: ReminderPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Not persisted; the calendar file still works.
  }
}

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;

export async function askNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  return (await Notification.requestPermission()) === "granted";
}

// Milliseconds until the next occurrence of HH:MM (today or tomorrow).
export function msUntil(time: string, now = new Date()): number {
  const [h, m] = time.split(":").map(Number);
  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

// Schedules today's notification while this tab is open. Returns a cancel function.
export function scheduleReminder(prefs: ReminderPrefs, practicedToday: () => boolean): () => void {
  if (!prefs.enabled || !notificationsSupported() || Notification.permission !== "granted") return () => {};
  const id = window.setTimeout(() => {
    if (!practicedToday()) {
      new Notification("Upscale: today’s practice", {
        body: "Two short speaking tasks keep your streak and your goal on track.",
        tag: "upscale-daily",
      });
    }
  }, msUntil(prefs.time));
  return () => window.clearTimeout(id);
}

// A daily recurring calendar event at the chosen time, for the rest of the game.
export function reminderIcs(time: string, untilDate: string, url: string): string {
  const [h, m] = time.split(":");
  const today = new Date();
  const ymd = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Upscale//Practice reminder//EN",
    "BEGIN:VEVENT",
    `UID:upscale-daily-${ymd(today)}@upscale`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${ymd(today)}T${h}${m}00`,
    "DURATION:PT15M",
    `RRULE:FREQ=DAILY;UNTIL=${untilDate.replace(/-/g, "")}T235959`,
    "SUMMARY:Upscale: daily speaking practice",
    `DESCRIPTION:Two short timed tasks (10–15 min). ${url}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Upscale practice",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
