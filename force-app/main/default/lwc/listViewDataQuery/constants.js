

export const pageSizeDefault = 200;
export const sortByDefault = 'id';
export const sortDirectionDefault = 'asc';
export const infiniteScrollHeightDefault = 500;
export const searchTimerDelay = 300;
export const soslMaxRowCount = 2000;

// A list of special fields that should provide a link to the record id.
export const nameFields = [
  'casenumber',
  'ordernumber',
  'name',
];

// A list of all field names that should be replaced.
export const fieldLabelsReplace = {
  'Full Name': 'Contact Name',
};

// SOQL sorting is not supported for these data types.
export const dataTypesNoSort = [
  'multipicklist',
  'picklist',
  'textarea',
  'encryptedstring',
];

// Provides the mapping between apex and datatable column types.
export const dataTypes = {
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
  'picklist': 'string',
  'reference': 'string',
  'sobject': 'string',
  'string': 'string',
  'textarea': 'string',
  'time': 'date',
  'url': 'url',
};