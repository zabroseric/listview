const dataTypes = {
  'address':				                'string',
  'anytype':				                'string',
  'base64':				                  'string',
  'boolean':				                'boolean',
  'combobox':		                		'string',
  'complexvalue':				            'string',
  'currency':			                	'currency',
  'datacategorygroupreference':			'string',
  'date':			                    	'date',
  'datetime':		                		'date',
  'double':		                  		'number',
  'email':			                   	'email',
  'encryptedstring':				        'string',
  'id':				                      'button',
  'integer':				                'number',
  'json':				                    'string',
  'location':				                'location',
  'long':				                    'string',
  'multipicklist':				          'string',
  'percent':				                'percent',
  'phone':			                  	'string',
  'picklist':			                	'string',
  'reference':			              	'string',
  'sobject':				                'string',
  'string':				                  'string',
  'textarea':			                	'string',
  'time':			                    	'date',
  'url':			                    	'url',
};

const optionDefaults = {
  urlType: 'button-base',
  fieldName: undefined, // Original field name provided (useful if the column is invalid).
}

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
  const optionsMod = {...optionDefaults, ...options};
  const { urlType } = optionsMod;

  // Base definition.
  const column = {
    fieldName: metaData.name,
    label: metaData.label,
    type: dataTypes[metaData.type],
  };

  // If we have an id, show the name and hyperlink it.
  if(column.fieldName === 'Id') {
    column.typeAttributes = {
      label: { fieldName: `Name` },
      variant: 'base',
      fieldName: metaData.name,
      type: 'button',
    };
  }

  // Add label to button.
  else if (isHyperlinkFormula(metaData)) {
    column.type = 'button';
    column.cellAttributes = { alignment: 'center' };
    column.typeAttributes = {
      label: getHyperlinkStaticLabel(formula) ? getHyperlinkStaticLabel(formula) : { fieldName: `${column.fieldName}-Label` },
      variant: getButtonVariant(urlType),
      fieldName: metaData.name,
      type: 'button',
    };
  }

  // Add details to standard types based on how they should be displayed.
  else if (['currency', 'double', 'percent'].includes(metaData.type)) {
    column.typeAttributes = {
      minimumFractionDigits: metaData.scale,
      maximumFractionDigits: metaData.scale,
    };
  }
  else if (metaData.type === 'date') {
    column.typeAttributes = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    };
  }
  else if (metaData.type === 'date') {
    column.typeAttributes = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    };
  }
  else if (metaData.type === 'datetime') {
    column.typeAttributes = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
  }
  else if (metaData.type === 'time') {
    column.typeAttributes = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
  }
  else if (metaData.type === 'location') {
    column.typeAttributes = {
      latitude: `${column.fieldName}-Latitude`,
      longitude: `${column.fieldName}-Longitude`,
    };
  }

  // Is a column hide label.
  if (isColumnHide(metaData)) {
    column.label = '';
  }

  return column;
};

const isHyperlinkFormula = (metaData) => /hyperlink/i.exec(metaData.calculatedFormula || '') !== null;
const isColumnHide = (metaData) => /(hidden)/i.exec(metaData.label) !== null;

const getHyperlinkStaticLabel = (value) => /hyperlink\([^,]+,\s*"(?<label>[^"]+)"/i.exec(value)?.groups?.label;
const getButtonVariant = (value) => /button-(?<variant>.+)/.exec(value)?.groups?.variant;

export default getColumn;