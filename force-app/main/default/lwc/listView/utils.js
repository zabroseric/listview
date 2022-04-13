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