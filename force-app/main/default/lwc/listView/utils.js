/**
 * Converts the string to title case.
 */
export const titleCase = (string) => (string || '').replace(/\w\S*/g,
  (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
);

/**
 * Remove empty values from an object.
 * @src https://stackoverflow.com/questions/25421233/javascript-removing-undefined-fields-from-an-object
 *
 * @param obj
 * @returns {{}}
 */
export const filterObj = (obj) => {
  let newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) newObj[key] = filterObj(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

/**
 * Merge two objects together, one as the defaults, and the other as the options provided.
 *
 * @param objDefaults
 * @param objOptions
 */
export const mergeOptions = (objDefaults, objOptions) => ({...objDefaults, ...filterObj(objOptions)});

/**
 * A decorative pattern to debug function calls and returns errors in a more usable form.
 *
 * @param funcName
 * @param func
 * @returns {function(...[*]): *}
 */
export const logApexFunc = (funcName, func) => {
  return async (...props) => {
    try {
      console.debug(`Running ${funcName} with props: `, ...props);
      const result = await func(...props);
      console.debug(`Result of ${funcName}:`, result);
      return result;
    } catch (e) {
      throw e?.body?.message || e?.message || e;
    }
  }
}

/**
 * Converts unknown data to a boolean, this is useful when a true or false may be passed as a string
 * or an alternative format.
 *
 * @param obj
 * @returns {boolean}
 */
export const toBoolean = (obj) => {
  switch (String(obj).toLowerCase().trim()) {
    case "true":
    case "yes":
    case "1":
      return true;

    case "false":
    case "no":
    case "0":
    case null:
      return false;

    default:
      return Boolean(obj);
  }
}

/**
 * Get the ids that have been found in text, and prefer the 18 length, over the 15 length if provided.
 *
 * @param value
 * @returns {string | undefined}
 */
export const getId = (value) => /(?<id>[a-z0-9]{18}|[a-z0-9]{15})/i.exec(value)?.groups?.id;