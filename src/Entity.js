import 'core-js/fn/array/is-array';
import 'core-js/fn/object/entries';

import _ from 'lodash/fp';
import Sert from 'sert-schema';

let Entity = {};

// Validation

/**
 * Assert entity to be valid based on schema
 * @param {object} schema Entity type schema
 * @param {object} entity Entity
 * @return {object} Entity
 */
Entity.assertValid = (schema, entity, ...args) => {
    Sert.assertValid(schema, entity, ...args);
    return entity;
};

/**
 * Validate entity based on schema
 * @param {object} schema Entity type schema
 * @param {object} entity Entity
 * @return {Error|undefined} Error object if invalid, undefined if valid
 */
Entity.validate = (schema, entity) => {
    return Sert.validate(schema, entity);
};

// Iteration

function _iterate(iteratee, transform = false, valueSchema = {}, value = {}, key = undefined, entityPath = '', entity = {}) { // eslint-disable-line max-len
    switch (valueSchema.type) {
        case 'object': {
            // Run iterator with the whole object
            const iterateeValue = iteratee(valueSchema, value, key, entityPath, entity);
            const newValue = transform ? iterateeValue : value;

            // Run iterator for each defined object property, from the value returned by the whole-object iteratee
            return _.omitBy(_.isUndefined,
                Object
                    .entries(newValue || {})
                    .map(([objKey, objValue]) =>
                        [
                            objKey,
                            _iterate(iteratee, transform, (valueSchema.properties || {})[objKey] || {}, objValue,
                                objKey, entityPath ? `${entityPath}.${objKey}` : objKey, entity)
                        ]
                    )
                    .reduce((newValue, [objKey, objValue]) => ({ ...newValue, [objKey]: objValue }), {})
            );
        }
        case 'array': {
            if (!Array.isArray(value)) {
                // If a array-schema value is not an array, just run the iteratee with the value and skip item iteratee
                const iterateeValue = iteratee(valueSchema, value, key, entityPath, entity);
                return transform ? iterateeValue : value;
            }

            // Run iterator with the whole array
            const iterateeValue = iteratee(valueSchema, value, key, entityPath, entity);
            const newValue = transform ? iterateeValue : value;

            // Run iterator for each item, from the array returned by the whole-array iteratee
            return newValue.map((arrItem, i) =>
                Array.isArray(valueSchema.items) ?
                    // Item-specific schemas (schema.items is an array of schemas)
                    _iterate(iteratee, transform, valueSchema.items[i] || valueSchema.additionalItems || {}, arrItem,
                        i, entityPath ? `${entityPath}.${i}` : i, entity)
                    :
                    // Common item schema (schema.items is a schema)
                    _iterate(iteratee, transform, valueSchema.items || {}, arrItem,
                        i, entityPath ? `${entityPath}.${i}` : i, entity)
            );
        }
        case 'string':
        case 'number':
        case 'integer':
        case 'null':
        case 'boolean':
        default: {
            // For primitive values, just run the iteratee
            const iterateeValue = iteratee(valueSchema, value, key, entityPath, entity);
            return transform ? iterateeValue : value;
        }
    }
}

/**
 * Iterate recursively all values that has a schema definition,
 * including all sub objects and array items
 * @param {object} schema Entity schema
 * @param {object} entity Entity
 * @param {function} iteratee Iteratee (valueSchema, value, key, entityPath, entity) called recursively for values
 */
Entity.forDeep = (schema, entity, iteratee) => {
    _iterate(iteratee, false, schema, entity, undefined, '', entity);
};

/**
 * Create a new entity by iterating recursively all values of entity that has a schema definition,
 * including all sub objects and array items. Iteratee should never mutate provided value.
 * @param {object} schema Entity schema
 * @param {object} entity Entity
 * @param {function} iteratee Iteratee (valueSchema, value, key, entityPath, entity) called recursively for values
 * @return {object} New entity object
 */
Entity.mapDeep = (schema, entity, iteratee) => {
    return _iterate(iteratee, true, schema, entity, undefined, '', entity);
};

// Cleanup

/**
 * Clean entity properties of undefined-property values
 * @param {object} props Properties
 * @return {object}  Cleaned properties
 */
Entity.clean = props => {
    return _.omitBy(_.isNil, props);
};

/**
 * Reset recursively all read-only (schema-defined) props of a given entity,
 * optionally replacing them with same-path values of source
 * @param {object} schema Object type schema
 * @param {object} entity Subject entity
 * @param {object} source Entity containing props to set if subject has changed readOnly props
 * @return {object} Entity with read-only props reset
 */
Entity.resetReadOnly = (schema, entity, source) => {
    return Entity.mapDeep(schema, entity, (valueSchema, value, key, entityPath, entity) =>
        valueSchema.readOnly ?
            _.get(entityPath, source)
            :
            value
    );
};



/**
 * Get all standard entity functions
 * @param {object} schema Object type schema
 * @param {object} schemaPartial Object type partial schema
 * @return {object} Function container
 */
Entity.getStandardFunctions = (schema, schemaPartial) => ({
    schema,
    schemaPartial,

    // Validation
    assertValid: _.partial(Entity.assertValid, [schema]),
    assertValidPartial: _.partial(Entity.assertValid, [schemaPartial]),
    validate: _.partial(Entity.validate, [schema]),

    // Iteration
    forDeep: _.partial(Entity.forDeep, [schema]),
    mapDeep: _.partial(Entity.mapDeep, [schema]),

    // Cleanup
    clean: Entity.clean,
    resetReadOnly: _.partial(Entity.resetReadOnly, [schema]),

    // Lifecycle
    shouldCreate: _.identity,
    willCreate: _.identity,
    didCreate: _.identity,

    shouldUpdate: _.identity,
    willUpdate: _.identity,
    didUpdate: _.identity,

    shouldDelete: _.identity,
    willDelete: _.identity,
    didDelete: _.identity
});

export default Entity;
