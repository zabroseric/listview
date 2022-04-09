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
  urlType: 'hyperlink',
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
    type: getType(metaData, optionsMod),
  };

  // Override any formulas to disallow editing.
  if (formula) {
    column.editable = false;
  }

  // Add label to the hyperlink.
  if (isHyperlinkFormula(metaData)) {
    column.typeAttributes = {
      ...column.typeAttributes,
      label: getHyperlinkLabel(formula) ? getHyperlinkLabel(formula) : getHyperlinkUrl(formula),
    };
  }
  // Add button variant.
  if (isHyperlink(metaData) && getButtonVariant(urlType)) {
    column.typeAttributes = {
      ...column.typeAttributes,
      variant: getButtonVariant(urlType),
      fieldName: metaData.name,
      type: 'button',
    };
  }

  return column;
};

/**
 * Detect the type of column we have based on what is returned by apex.
 *
 * @param metaData
 * @param options
 * @returns {string}
 */
const getType = (metaData, options) => {
  // Change an url, to either a link or button.
  if (isHyperlink(metaData)) {
    return options.urlType === 'hyperlink' ? 'url' : 'button';
  }
  return dataTypes[metaData.type];
}

const isHyperlink = (metaData) => isHyperlinkFormula(metaData || '') || metaData.type === 'url';
const isHyperlinkFormula = (metaData) => /hyperlink/i.exec(metaData.calculatedFormula || '') !== null;

const getHyperlinkUrl = (value) => /hyperlink\("(?<url>[^"]+)",/i.exec(value)?.groups?.url;
const getHyperlinkLabel = (value) => /hyperlink\([^,]+,\s*"(?<label>[^"]+)"/i.exec(value)?.groups?.label;
const getButtonVariant = (value) => /button-(?<variant>.+)/.exec(value)?.groups?.variant;

export default getColumn;