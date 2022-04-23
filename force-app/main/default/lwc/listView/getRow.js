import {getCell} from "./getCell";
import {flattenObject} from "./utils";

/**
 * Manipulates the row values before rendering it into the datatable.
 */
const getRow = (row, columns) => {
  const rowFlat = flattenObject(row);
  const rowReturn = {};

  for (const [key, value] of Object.entries(rowFlat)) {
    const fieldName = key.toLowerCase();
    rowReturn[fieldName] = getCell(value, getColumn(columns, fieldName) || {});

    // If we have a hyperlink, create an additional reference field for the label.
    if (getHyperlinkLabel(rowFlat[fieldName])) {
      rowReturn[`${fieldName}-label`] = getHyperlinkLabel(value);
    }
    // If we have a latitude / longitude, split them out into two columns.
    else if (getLatitude(value) && getLongitude(value)) {
      rowReturn[`${fieldName}-latitude`] = getLatitude(value);
      rowReturn[`${fieldName}-longitude`] = getLongitude(value);
    }

  }

  // Add an unknown column, in the situations we want to show the word "Unknown" to users.
  rowReturn['unknown'] = 'Unknown';

  return rowReturn;
}

const getHyperlinkLabel = (value) => /<a[^>]+>(?<label>[^<]+)/.exec(value)?.groups?.label;
const getLatitude = (value) => value?.latitude;
const getLongitude = (value) => value?.longitude

const getColumn = (columns, fieldName) => columns.find((column) => column.fieldName.toLowerCase() === fieldName.toLowerCase());

export default getRow;