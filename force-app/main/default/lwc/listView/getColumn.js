const dataTypes = {
  'address':				                'string',
  'anytype':				                'string',
  'base64':				                  'string',
  'boolean':				                'string',
  'combobox':		                		'string',
  'complexvalue':				            'string',
  'currency':			                	'string',
  'datacategorygroupreference':			'string',
  'date':			                    	'string',
  'datetime':		                		'string',
  'double':		                  		'string',
  'email':			                   	'string',
  'encryptedstring':				        'string',
  'id':				                      'string',
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

  // Override any formulas to disallow editing.
  if (formula) {
    column.editable = false;
  }

  // Add label to button.
  if (isHyperlinkFormula(metaData)) {
    column.type = 'button';
    column.typeAttributes = {
      ...column.typeAttributes,
      label: getHyperlinkStaticLabel(formula) ? getHyperlinkStaticLabel(formula) : { fieldName: `${column.fieldName}-Label` },
      variant: getButtonVariant(urlType),
      fieldName: metaData.name,
      type: 'button',
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