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
}

/**
 * Converts metadata generated from the DescribeFieldResult query into a column to be used
 * for a data table.
 *
 * @param metaData
 * @returns {{fieldName, label, type: *}}
 */
const getColumn = (metaData, urlType) => {
  const formula = metaData.calculatedFormula;

  // Base definition.
  const column = {
    fieldName: metaData.name,
    label: metaData.label,
    type: dataTypes[metaData.type]
  };

  // Is hyperlink.
  if (isHyperlinkFormula(formula)) {
    column.type = 'url';
    column.editable = false;
  }
  // Is hyperlink with hardcoded label.
  if (isHyperlinkFormula(formula) && getHyperlinkLabel(formula)) {
    column.typeAttributes = {
      label: getHyperlinkLabel(formula),
    };
  }

  return column;
};

const isHyperlinkFormula = (formula) => /hyperlink/i.exec(formula) !== null;
const getHyperlinkLabel = (formula) => /hyperlink\([^,]+,\s*"(?<label>[^"]+)"/i.exec(formula)?.groups?.label;

export default getColumn;