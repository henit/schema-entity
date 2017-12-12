import test from 'ava';
import sinon from 'sinon';
import Entity from '../Entity';
import schema from './TestSchema';

const invalid = {
    text: 'foo',
    list: 123
};
const valid = {
    list: ['one', 'two'],
    numeric: 42,
    text: 'foo',
    sub: {
        bar: 123,
        foo: 'abc',
        another: 'thing'
    }
};

// Validation

test('.assertValid valid throws on invalid subject', t => {
    t.throws(() => Entity.assertValid({ type: 'string' }, 123));
    t.throws(() => Entity.assertValid(schema, invalid));

});

test('.assertValie dont throw on valid subject', t => {
    t.notThrows(() => Entity.assertValid({ type: 'string' }, '123'));
    t.notThrows(() => Entity.assertValid(schema, valid));
});

test('.validate return error on invalid subject', t => {
    const error = Entity.validate({ type: 'string' }, 234);
    t.is(typeof error, 'object');
});

test('.validate return undefined on valid subject', t => {
    const error = Entity.validate({ type: 'string' }, '234');
    t.is(error, undefined);
});

// Iteration

test('.forDeep iterate all values without changing props', t => {
    let iteratee = sinon.spy(() => 'foo');
    const actual = Entity.forDeep(schema, valid, iteratee);
    const expected = undefined;
    t.is(actual, expected);
    sinon.assert.calledWith(iteratee, schema, valid, undefined, '', valid);
    sinon.assert.calledWith(iteratee, schema.properties.list, valid.list, 'list', 'list', valid);
    sinon.assert.calledWith(iteratee, schema.properties.list.items, valid.list[0], 0, 'list.0', valid);
    sinon.assert.calledWith(iteratee, schema.properties.list.items, valid.list[1], 1, 'list.1', valid);
    sinon.assert.calledWith(iteratee, schema.properties.numeric, valid.numeric, 'numeric', 'numeric', valid);
    sinon.assert.calledWith(iteratee, schema.properties.text, valid.text, 'text', 'text', valid);
    sinon.assert.calledWith(iteratee, schema.properties.sub, valid.sub, 'sub', 'sub', valid);
    sinon.assert.calledWith(iteratee, schema.properties.sub.properties.foo, valid.sub.foo, 'foo', 'sub.foo', valid);
    sinon.assert.calledWith(iteratee, schema.properties.sub.properties.bar, valid.sub.bar, 'bar', 'sub.bar', valid);
    sinon.assert.calledWith(iteratee, sinon.match({}), valid.sub.another, 'another', 'sub.another', valid);
});

// Entity.mapDeep = (schema, entity, iteratee)

// iteratee(valueSchema, value, key, entityPath, entity)
test('.mapDeep iterate all values and return updated props', t => {
    let iteratee = sinon.spy((schema, value, key, entityPath, entity) => {
        switch (schema.type) {
            case 'array':
                return value.concat('TEST');
            case 'string':
                return 'FOO';
            case 'number':
                return 4242;
            default:
                return value;
        }
    });

    const actual = Entity.mapDeep(schema, valid, iteratee);
    const expected = {
        list: ['FOO', 'FOO', 'FOO'],
        numeric: 4242,
        text: 'FOO',
        sub: {
            bar: 4242,
            foo: 'FOO',
            another: 'thing'
        }
    };

    t.deepEqual(actual, expected);

    sinon.assert.calledWith(iteratee, schema, valid, undefined, '', valid);
    sinon.assert.calledWith(iteratee, schema.properties.list, valid.list, 'list', 'list', valid);
    sinon.assert.calledWith(iteratee, schema.properties.list.items, valid.list[0], 0, 'list.0', valid);
    sinon.assert.calledWith(iteratee, schema.properties.list.items, valid.list[1], 1, 'list.1', valid);
    sinon.assert.calledWith(iteratee, schema.properties.list.items, 'TEST', 2, 'list.2', valid);
    sinon.assert.calledWith(iteratee, schema.properties.numeric, valid.numeric, 'numeric', 'numeric', valid);
    sinon.assert.calledWith(iteratee, schema.properties.text, valid.text, 'text', 'text', valid);
    sinon.assert.calledWith(iteratee, schema.properties.sub, valid.sub, 'sub', 'sub', valid);
    sinon.assert.calledWith(iteratee, schema.properties.sub.properties.foo, valid.sub.foo, 'foo', 'sub.foo', valid);
    sinon.assert.calledWith(iteratee, schema.properties.sub.properties.bar, valid.sub.bar, 'bar', 'sub.bar', valid);
    sinon.assert.calledWith(iteratee, sinon.match({}), valid.sub.another, 'another', 'sub.another', valid);
});

// Cleanup

test('.clean omit undefined and null properties', t => {
    const actual = Entity.clean({
        foo: 'bar',
        empty: undefined,
        nada: null
    });
    const expected = {
        foo: 'bar'
    };

    t.deepEqual(actual, expected);
});

test('.resetReadOnly omit read-only props', t => {
    const actual = Entity.resetReadOnly(schema, valid);
    const expected = {
        list: ['one', 'two'],
        text: 'foo',
        sub: {
            another: 'thing'
        }
    };
    t.deepEqual(actual, expected);
});

test('.resetReadOnly replace read-only with source props', t => {
    const source = {
        text: 'this text',
        numeric: 345,
        sub: {
            foo: 'that text'
        }
    };
    const actual = Entity.resetReadOnly(schema, valid, source);
    const expected = {
        list: ['one', 'two'],
        numeric: 345,
        text: 'foo',
        sub: {
            foo: 'that text',
            another: 'thing'
        }
    };
    t.deepEqual(actual, expected);
});
