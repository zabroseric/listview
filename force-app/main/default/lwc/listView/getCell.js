/**
 * Manipulates the cell value before rendering it into the datatable.
 */
export const getCell = (value) => {

  // Get only the url for the hyperlink.
  if (getUrlHref(value)) {
    return addUrlProtocol(getUrlHref(value));
  }
  // Turn the id into a hyperlink.
  if(getId(value)) {
    return '/' + getId(value);
  }
  return value;
}

const getUrlHref = (value) => /href="(?<href>.+?)"/i.exec(value)?.groups?.href;
const addUrlProtocol = (value) => /^(https?:\/\/|\/)/.exec(value) === null ? 'https://' + value : value;

const getId = (value) => /^([a-z0-9]{15}|[a-z0-9]{18})$/i.exec(value)?.input;