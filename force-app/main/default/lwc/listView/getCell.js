/**
 * Manipulates the cell value before rendering it into the datatable.
 */
export const getCell = (value, column) => {

  // Get only the url for the hyperlink.
  if (getUrlHref(value)) {
    return addUrlProtocol(getUrlHref(value));
  }
  // Turn the id into a hyperlink.
  if(getId(value)) {
    return '/' + getId(value);
  }
  // Correctly manage a percentage (as default behaviour multiplies by 100).
  if(column.type === 'percent') {
    return value/100;
  }
  return value;
}

const getUrlHref = (value) => /href="(?<href>.+?)"/i.exec(value)?.groups?.href;
const addUrlProtocol = (value) => /^(https?:\/\/|\/)/.exec(value) === null ? 'https://' + value : value;

const getId = (value) => /^([a-z0-9]{15}|[a-z0-9]{18})$/i.exec(value)?.input;