import { iterate } from 'iterare'

export function prependConstraintsWithParentProp(parentError, error) {
  const constraints = {};
  for (const key in error.constraints) {
      constraints[key] = `${parentError.property}.${error.constraints[key]}`;
  }
  return Object.assign(Object.assign({}, error), { constraints });
}

export function mapChildrenToValidationErrors(error) {
    if (!(error.children && error.children.length)) {
        return [error];
    }
    const validationErrors = [];
    for (const item of error.children) {
        if (item.children && item.children.length) {
            validationErrors.push(...mapChildrenToValidationErrors(item));
        }
        validationErrors.push(prependConstraintsWithParentProp(error, item));
    }
    return validationErrors;
}

export function flattenValidationErrors(validationErrors) {
  return iterate(validationErrors)
      .map(error => mapChildrenToValidationErrors(error))
      .flatten()
      .filter(item => !!item.constraints)
      .map(item => Object.values(item.constraints))
      .flatten()
      .toArray();
}