import {getCell} from "./getCell";

/**
 * Manipulates the row values before rendering it into the datatable.
 */
export const getRow = (row, columns) => {
  const rowReturn = {};
  for (let key in row) {
    const value = row[key];

    if (row.hasOwnProperty(key)) {
      rowReturn[key] = getCell(value, getColumn(columns, key) || {});

      // If we have a hyperlink, create an additional reference field for the label.
      if (getHyperlinkLabel(row[key])) {
        rowReturn[`${key}-Label`] = getHyperlinkLabel(value);
      }
      // If we have a latitude / longitude, split them out into two columns.
      else if (getLatitude(value) && getLongitude(value)) {
        rowReturn[`${key}-Latitude`] = getLatitude(value);
        rowReturn[`${key}-Longitude`] = getLongitude(value);
      }
    }
  }
  return rowReturn;
}

const getHyperlinkLabel = (value) => /<a[^>]+>(?<label>[^<]+)/.exec(value)?.groups?.label;
const getLatitude = (value) => value?.latitude;
const getLongitude = (value) => value?.longitude

const getColumn = (columns, fieldName) => columns.find((column) => column.fieldName === fieldName);