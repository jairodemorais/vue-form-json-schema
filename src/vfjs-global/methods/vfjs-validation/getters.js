import { get, set } from 'lodash';

const vfjsValidationGetters = {
  /** getVfjsPropertiesRequired
    @function
    @description Get all errors of type required
    @param [errors] array
    @return
      An array of the properties in the errors array
      were the error property 'keyword' was 'required'.
  */
  getVfjsPropertiesRequired(errors) {
    if (!errors) {
      return [];
    }

    return errors.reduce((required, error) => {
      if (error.keyword === 'required') {
        if (error.params && error.params.missingProperty) {
          const key = error.params.missingProperty;
          const parent = String(error.dataPath).substr(1);
          const propertyPath = parent ? `${parent}.${key}` : key;

          if (required.indexOf(propertyPath) === -1) {
            required.push(propertyPath);
          }
        }
      }

      return required;
    }, []);
  },
  getVfjsChildPropertiesRequired(parentFields = [], excludeProperties = []) {
    const uniqueProperties = parentFields.filter(property => excludeProperties.indexOf(property) === -1);

    return uniqueProperties.reduce((properties, property) => {
      // Add current property to array
      properties.push(property);

      // Validate schema with this property being an empty object
      const value = {};
      set(value, property, {});
      this.ajv.validate(this.getVfjsSchema(), value);
      const propertiesRequired = this.getVfjsPropertiesRequired(this.ajv.errors);

      // If there were required properties below this property (i.e. this property is an object)
      if (propertiesRequired.length > 0) {
        const excludePropertiesChildren = [...excludeProperties, ...uniqueProperties];

        const childFieldsRequired = this.getVfjsChildPropertiesRequired(
          propertiesRequired,
          excludePropertiesChildren,
        );

        properties.push(...childFieldsRequired);
      }

      return properties;
    }, []);
  },
  getVfjsFieldModelValid(key, value) {
    const errors = this.getVfjsFieldModelValidationErrors(key, value);
    return errors.length === 0;
  },
  getVfjsFieldModelValidationErrors(key, value) {
    return this.getVfjsModelValidationErrors(key, value);
  },
  getVfjsModelValidationErrors(key, value) {
    const schema = this.getVfjsSchema();

    // TODO: Globally get all the errors and reduce them instead of generating them again
    const valueObj = {};
    set(valueObj, key, value);
    this.ajv.validate(schema, valueObj);

    if (this.ajv.errors) {
      return this.ajv.errors.reduce((errors, error) => {
        const property = get(error, 'params.missingProperty');
        const path = error.dataPath ? error.dataPath.substr(1) : '';
        const propertyPath = path ? `${path}.${property}` : property;

        if (key === propertyPath || key === path) {
          errors.push(error);
        }

        return errors;
      }, []);
    }

    return []; // No errors
  },
  getVfjsValid() {
    const errors = this.getVfjsValidationErrors();
    return errors.length === 0;
  },
  getVfjsValidationErrors(model) {
    const valid = this.ajv.validate(this.getVfjsSchema(), model || this.getVfjsModel());
    return (!valid) ? this.ajv.errors : [];
  },
};

export default vfjsValidationGetters;
