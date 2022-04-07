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
  'url':			                    	'string',
}

/**
 * Converts metadata generated from the DescribeFieldResult query into a column to be used
 * for a data table.
 *
 * @param metaData
 * @returns {{fieldName, label, type: *}}
 */
const getColumn = (metaData) => ({
  fieldName: metaData.name,
  label: metaData.label,
  type: dataTypes[metaData.type]
});

export default getColumn;