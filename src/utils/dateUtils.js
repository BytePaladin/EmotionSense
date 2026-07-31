export const formatDateGMT6 = (dateStr) => {
  if (!dateStr) return '';
  const normalizedStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const date = new Date(normalizedStr);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatTimeGMT6 = (dateStr) => {
  if (!dateStr) return '';
  const normalizedStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
  const date = new Date(normalizedStr);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date) + ' (GMT+6)';
};

export const formatFullDateTimeGMT6 = (dateStr) => {
  if (!dateStr) return '';
  return `${formatDateGMT6(dateStr)} ${formatTimeGMT6(dateStr)}`;
};
