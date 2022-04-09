import {getCell} from "./getCell";

/**
 * Manipulates the row values before rendering it into the datatable.
 */
export const getRow = (row) => {
  const rowReturn = {};
  for (let key in row) {
    if (row.hasOwnProperty(key)) {
      rowReturn[key] = getCell(row[key]);
    }
  }
  return rowReturn;
}