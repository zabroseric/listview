import {getId} from "./utils";

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

  // Get only the url for the hyperlink.
  if (getUrlHref(value)) {
    return addUrlProtocol(getUrlHref(value));
  }

  // Turn the id into a hyperlink.
  if (getId(value)) {
    return getId(value);
  }

  return value;
}

const getUrlHref = (value) => /href="(?<href>.+?)"/i.exec(value)?.groups?.href;
const addUrlProtocol = (value) => /^(https?:\/\/|\/)/.exec(value) === null ? 'https://' + value : value;