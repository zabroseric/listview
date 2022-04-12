const dataTypes = {
  'address':				                'string',
  'anytype':				                'string',
  'base64':				                  'string',
  'boolean':				                'boolean',
  'combobox':		                		'string',
  'complexvalue':				            'string',
  'currency':			                	'currency',
  'datacategorygroupreference':			'string',
  'date':			                    	'string',
  'datetime':		                		'string',
  'double':		                  		'string',
  'email':			                   	'email',
  'encryptedstring':				        'string',
  'id':				                      'button',
  'integer':				                'string',
  'json':				                    'string',
  'location':				                'string',
  'long':				                    'string',
  'multipicklist':				          'string',
  'percent':				                'string',
  'phone':			                  	'string',
  'picklist':			                	'string',
  'reference':			              	'string',
  'sobject':				                'string',
  'string':				                  'string',
  'textarea':			                	'string',
  'time':			                    	'string',
  'url':			                    	'url',
};

const optionDefaults = {
  urlType: 'button-base',
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
  if (isHyperlinkFormula(metaData)) {
    column.type = 'button';
    column.typeAttributes = {
      label: getHyperlinkStaticLabel(formula) ? getHyperlinkStaticLabel(formula) : { fieldName: `${column.fieldName}-Label` },
      variant: getButtonVariant(urlType),
      fieldName: metaData.name,
      type: 'button',
    };
  }

  // Add the decimal places to the currency.
  if(column.type === 'currency') {
    column.typeAttributes = {
      minimumFractionDigits: metaData.scale,
      maximumFractionDigits: metaData.scale,
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