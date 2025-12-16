export default function exportResults(data, format) {
  let content = '';
  let mimeType = 'text/plain';
  let fileName = `test-results.${format}`;

  if (format === 'csv') {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    content = `${headers}\n${rows}`;
    mimeType = 'text/csv';
  } else if (format === 'txt') {
    content = data.map(row => JSON.stringify(row)).join('\n');
    mimeType = 'text/plain';
  } else if (format === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
