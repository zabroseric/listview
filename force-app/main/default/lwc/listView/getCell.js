/**
 * Manipulates the cell value before rendering it into the datatable.
 */
export const getCell = (value) => {
  const href = /href="(?<href>.+?)"/i.exec(value);

  if (href) {
    return href.groups.href;
  }
  return value;
}