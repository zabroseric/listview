import {mergeOptions} from "c/utils";

// A list of all field names that should be replaced.
const FIELD_LABELS_REPLACE = {
  'Full Name': 'Contact Name',
};

// SOQL sorting is not supported for these data types.
const DATA_TYPES_NO_SORTING = [
  'multipicklist',
  'picklist',
  'textarea',
  'encryptedstring',
];

// Provides the mapping between apex and datatable column types.
const DATA_TYPE_COLUMN_MAPPING = {
  'address': 'string',
  'anytype': 'string',
  'base64': 'string',
  'boolean': 'boolean',
  'combobox': 'string',
  'complexvalue': 'string',
  'currency': 'currency',
  'datacategorygroupreference': 'string',
  'date': 'date',
  'datetime': 'date',
  'double': 'number',
  'email': 'email',
  'encryptedstring': 'string',
  'id': 'string',
  'integer': 'number',
  'json': 'string',
  'location': 'location',
  'long': 'number',
  'multipicklist': 'string',
  'percent': 'percent',
  'phone': 'phone',
  'picklist': 'customPicklist',
  'reference': 'string',
  'sobject': 'string',
  'string': 'string',
  'textarea': 'string',
  'time': 'date',
  'url': 'url',
};

const optionDefaults = {
  urlType: 'button-base',
  fieldName: undefined, // Original field name provided (useful if the column is invalid).
  hyperlinkNames: true,
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

  const {urlType, hyperlinkNames, editFieldsList, metaDataRelationship} = mergeOptions(optionDefaults, options);

  // Base definition.
  const columnBase = {
    fieldName: options.fieldName,
    label: replaceFieldLabel(!isColumnHide(metaData) ? metaData.label : ''),
    type: DATA_TYPE_COLUMN_MAPPING[metaData.type],
    sortable: !DATA_TYPES_NO_SORTING.includes(metaData.type),
    meta: metaData,
    editable: editFieldsList.includes(options.fieldName)
  };

  // If we have the name hyperlink it.
  if (hyperlinkNames && metaDataRelationship && metaDataRelationship?.label) {
    return {
      ...columnBase,
      type: 'customButton',
      typeAttributes: {
        url: {fieldName: metaDataRelationship.name.toLowerCase() !== 'name' ? metaDataRelationship.reference.toLowerCase() : 'id'},
        label: {fieldName: options.fieldName},
        variant: 'base'
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
      type: 'customButton',
      cellAttributes: {alignment: getButtonVariant(urlType) === 'base' ? 'left' : 'center'},
      typeAttributes: {
        url: {fieldName: metaData.name.toLowerCase() },
        label: {fieldName: `${columnBase.fieldName}-label`},
        variant: getButtonVariant(urlType)
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
    case 'picklist':
      return {
        ...columnBase,
        typeAttributes: {
          options: metaData.picklistValues.map(({ value, label }) => ({ value, label })),
        }
      };
    default:
      return columnBase;
  }
};

const isHyperlinkFormula = (metaData) => /hyperlink/i.exec(metaData.calculatedFormula || '') !== null;
const isColumnHide = (metaData) => /(hidden)/i.exec(metaData.label) !== null;
const getButtonVariant = (value) => /button-(?<variant>.+)/.exec(value)?.groups?.variant;

const replaceFieldLabel = (fieldLabel) => ((fieldLabel in FIELD_LABELS_REPLACE ? FIELD_LABELS_REPLACE[fieldLabel] : fieldLabel) || '').replace(/ ID$/, ' Name');

export default getColumn;