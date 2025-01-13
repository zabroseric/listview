const getCSV = (data, columns) => {
  const headingCSV = columns.map((column) => {
    return `"${escapeValues(column.label ?? '')}"`;
  })

  const dataCSV = data.map((row) => {
    return columns.map((column) => {
      return `"${escapeValues(translateValue(row[column.fieldName], column.meta))}"`;
    }).join(',')
  }).join('\n');

  return `${headingCSV}\n${dataCSV}`;
}

const translateValue = (value, metaData) => {
  if (!value) {
    return value;
  }
  if (isHyperlinkFormula(metaData)) {
    return `${window.location.origin}/${value}`;
  }

  switch (metaData.type) {
    case 'currency':
    case 'double':
    case 'percent':
    case 'long':
      return new Intl.NumberFormat('en-GB', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      }).format(value);
    case 'date':
      return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(new Date(value));
    case 'datetime':
      return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(value));
    case 'time':
      return new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(value));
      // TODO: Is the location type required?
    default:
      return value;
  }
}

const escapeValues = (value) => {
  return (value ?? '')
    .replace(/"/g, '""')
    .replace(/–/g, '-')
    ;
}

const isHyperlinkFormula = (metaData) => /hyperlink/i.exec(metaData.calculatedFormula || '') !== null;

export default getCSV;