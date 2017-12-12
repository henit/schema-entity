import _ from 'lodash/fp';
let Schema = {};

/**
 * Get the sub schema for a specific entity path
 * @example getEntityPathSchema(schema, 'list.1.title') - Get schema for the title property of
 * array items in the list property
 * @param {object} schema Entity schema
 * @param {string|array} path Entity path
 * @return {object} Path schema
 */
Schema.getPathSchema = (schema, path) => {
    const pathArr = Array.isArray(path) ? path : path.split('.');

    switch (schema.type) {
        case 'object': {
            const propSchema = _.get(`properties.${pathArr[0]}`, schema);

            if (propSchema === undefined) {
                // No schema defined for this object property path
                return;
            }
            if (pathArr.length === 1) {
                // Path is at first level, prop schema is the target schema
                return propSchema;
            }

            return Schema.getPathSchema(propSchema, pathArr.slice(1));
        }

        case 'array': {
            const itemSchema = schema.items;

            if (itemSchema === undefined) {
                // No schema defined for items of this array
                return;
            }
            if (pathArr.length === 1) {
                // Path is at first level, array item schema is the target schema
                return itemSchema;
            }

            return Schema.getPathSchema(itemSchema, pathArr.slice(1));
        }

        default:
            return schema;
    }
};

export default Schema;
