export const errorMessageGeneric = 'An unknown error occurred, please contact support.';
export const pageSizeMax = 1000;
export const pageSizeDefault = 200;
export const sortByDefault = 'id';
export const sortDirectionDefault = 'asc';
export const infiniteScrollHeightDefault = 500;

// The name field to be used when an id is referenced.
export const nameFields = {
  'case': 'CaseNumber',
  'order': 'OrderNumber',
  'default': 'Name',
};

// SOQL sorting is not supported for these data types.
export const dataTypesNoSort = [
  'multipicklist',
  'picklist',
  'textarea',
  'encryptedstring',
];

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
  'id': 'button',
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