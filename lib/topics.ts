// Speaking prompts for US adults 25–45: work, life, opinions. One is picked at random each time.
export const TOPICS = [
  "Explain what you do at work to a smart 12-year-old.",
  "Pitch the best tool or app you used this year.",
  "Describe a project that went wrong and what you learned.",
  "Make the case for a 4-day work week.",
  "Tell us about a decision you'd make differently today.",
  "Convince your team to adopt one new habit.",
  "Describe the best manager you ever had.",
  "Argue for or against working from home.",
  "Explain a hobby of yours and why others should try it.",
  "Present a small change that would improve your city.",
  "Walk us through how you plan a big week.",
  "Share the best advice you've received and why it worked.",
  "Describe a product you'd build if you had six months off.",
  "Explain why your favorite book or show is worth the time.",
  "Pitch a team offsite: where, why, and what you'd do.",
];

export function randomTopic(exclude?: string): string {
  const pool = TOPICS.filter((t) => t !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}
