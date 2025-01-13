import {getId} from "c/utils";

/**
 * Manipulates the cell value before rendering it into the datatable.
 */
export const getCell = (value, column) => {
  // Translate the cell values as required.
  switch (column?.meta?.type) {
    case 'picklist':
    case 'multipicklist':
      return value
        .split(';')
        .map(value => column.meta.picklistValues.find((picklist) => picklist.value === value)?.label || value)
        .join(', ')
        ;
    case 'percent':
      return value / 100;
  }

  const hrefValue = getUrlHref(value);

  // If we have a href and id, just return that.
  if (hrefValue && getId(hrefValue)) {
    return getId(hrefValue);
  }
  // Otherwise, add the protocol if it has been forgotten.
  if (hrefValue) {
    return addUrlProtocol(hrefValue);
  }

  // Turn the id into a hyperlink.
  if (getId(value)) {
    return getId(value);
  }

  return value;
}

const getUrlHref = (value) => /href="(?<href>.+?)"/i.exec(value)?.groups?.href;
const addUrlProtocol = (value) => /^(https?:\/\/|\/)/.exec(value) === null ? 'https://' + value : value;