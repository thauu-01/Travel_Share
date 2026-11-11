export function calculateDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate).setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate).setUTCHours(0, 0, 0, 0);
  const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

export default {
  calculateDaysBetween,
  formatDate
};
