
export const titleCase = (string) => (string || '').replace(/\w\S*/g,
  (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
);