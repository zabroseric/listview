import {getCell} from "./getCell";

/**
 * Manipulates the row values before rendering it into the datatable.
 */
export const getRow = (row) => {
  const rowReturn = {};
  for (let key in row) {
    if (row.hasOwnProperty(key)) {
      rowReturn[key] = getCell(row[key]);

      // If we have a hyperlink, create an additional reference field for the label.
      if (getHyperlinkLabel(row[key])) {
        rowReturn[`${key}-Label`] = getHyperlinkLabel(row[key]);
      }
    }
  }
  return rowReturn;
}

const getHyperlinkLabel = (value) => /<a[^>]+>(?<label>[^<]+)/.exec(value)?.groups?.label;