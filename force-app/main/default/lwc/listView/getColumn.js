import {mergeOptions} from "c/utils";
import {dataTypes, dataTypesNoSort, fieldLabelsReplace, nameFields} from "./constants";

const optionDefaults = {
  urlType: 'button-base',
  fieldName: undefined, // Original field name provided (useful if the column is invalid).
  editFieldsList: [],
  metaDataRelationship: undefined,
};

/**
 * Converts metadata generated from the DescribeFieldResult query into a column to be used
 * for a data table.
 *
 * @param metaData
 * @param options
 * @returns {{fieldName, label, type: *}}
 */
const getColumn = (metaData, options) => {
  // If we haven't been passed metadata, return an empty column.
  if (!metaData) {
    return {
      fieldName: undefined,
      label: options.fieldName,
      type: 'string',
      editable: false,
    }
  }

  const formula = metaData.calculatedFormula;
  const {urlType, editFieldsList, metaDataRelationship} = mergeOptions(optionDefaults, options);

  // Base definition.
  const columnBase = {
    fieldName: options.fieldName,
    label: replaceFieldLabel(!isColumnHide(metaData) ? metaData.label : ''),
    type: dataTypes[metaData.type],
    sortable: !dataTypesNoSort.includes(metaData.type),
    meta: metaData,
    editable: editFieldsList.includes(options.fieldName)
  };

  // If we have an id, show the name and hyperlink it.
  if (metaDataRelationship && metaDataRelationship?.label) {
    return {
      ...columnBase,
      type: 'button',
      label: replaceFieldLabel(metaDataRelationship.label),
      typeAttributes: {
        fieldName: {fieldName: metaDataRelationship.name.toLowerCase() !== 'name' ? metaDataRelationship.name.toLowerCase() : 'id'},
        label: {fieldName: options.fieldName},
        variant: 'base',
        type: 'button',
      }
    };
  }

  // Ensure that relationships are always read-only.
  if (metaData.name.includes('.')) {
    columnBase.editable = false;
  }

  // Add label to button.
  if (isHyperlinkFormula(metaData)) {
    return {
      ...columnBase,
      type: 'button',
      cellAttributes: {alignment: getButtonVariant(urlType) === 'base' ? 'left' : 'center'},
      typeAttributes: {
        label: getHyperlinkStaticLabel(formula) ? getHyperlinkStaticLabel(formula) : {fieldName: `${columnBase.fieldName}-label`},
        variant: getButtonVariant(urlType),
        fieldName: metaData.name.toLowerCase(),
        type: 'button',
        sortable: false,
      }
    };
  }

  // Add details to standard types based on how they should be displayed.
  switch (metaData.type) {
    case 'currency':
    case 'double':
    case 'percent':
    case 'long':
      return {
        ...columnBase,
        typeAttributes: {
          minimumFractionDigits: metaData.scale,
          maximumFractionDigits: metaData.scale,
        },
      };
    case 'date':
      return {
        ...columnBase,
        typeAttributes: {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        },
      };
    case 'datetime':
      return {
        ...columnBase,
        typeAttributes: {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        },
      };
    case 'time':
      return {
        ...columnBase,
        typeAttributes: {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        },
      };
    case 'location':
      return {
        ...columnBase,
        typeAttributes: {
          latitude: `${columnBase.fieldName}-latitude`,
          longitude: `${columnBase.fieldName}-longitude`,
        },
      };
    default:
      return columnBase;
  }
};

const isHyperlinkFormula = (metaData) => /hyperlink/i.exec(metaData.calculatedFormula || '') !== null;
const isColumnHide = (metaData) => /(hidden)/i.exec(metaData.label) !== null;

const getHyperlinkStaticLabel = (value) => /hyperlink\([^,]+,\s*"(?<label>[^"]+)"/i.exec(value)?.groups?.label;
const getButtonVariant = (value) => /button-(?<variant>.+)/.exec(value)?.groups?.variant;

export const replaceFieldLabel = (fieldLabel) => ((fieldLabel in fieldLabelsReplace ? fieldLabelsReplace[fieldLabel] : fieldLabel) || '').replace(/ ID$/, ' Name');

export default getColumn;