const sanitizeString = (value) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/[<>$]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();

const deepSanitize = (input) => {
  if (typeof input === "string") {
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    return input.map(deepSanitize);
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(Object.entries(input).map(([key, val]) => [key, deepSanitize(val)]));
  }

  return input;
};

export const sanitizeInput = (req, _res, next) => {
  if (req.body) {
    req.body = deepSanitize(req.body);
  }

  if (req.query) {
    req.query = deepSanitize(req.query);
  }

  if (req.params) {
    req.params = deepSanitize(req.params);
  }

  next();
};
