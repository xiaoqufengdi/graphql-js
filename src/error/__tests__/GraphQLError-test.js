/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';

import dedent from '../../jsutils/dedent';
import invariant from '../../jsutils/invariant';
import { Kind, parse, Source, GraphQLError, formatError } from '../../';

const source = new Source(dedent`
  {
    field
  }
`);
const ast = parse(source);
const operationNode = ast.definitions[0];
invariant(operationNode && operationNode.kind === Kind.OPERATION_DEFINITION);
const fieldNode = operationNode.selectionSet.selections[0];
invariant(fieldNode);

describe('GraphQLError', () => {
  it('is a class and is a subclass of Error', () => {
    expect(new GraphQLError('str')).to.be.instanceof(Error);
    expect(new GraphQLError('str')).to.be.instanceof(GraphQLError);
  });

  it('has a name, message, and stack trace', () => {
    const e = new GraphQLError('msg');
    expect(e.name).to.equal('GraphQLError');
    expect(e.stack).to.be.a('string');
    expect(e.message).to.equal('msg');
  });

  it('uses the stack of an original error', () => {
    const original = new Error('original');
    const e = new GraphQLError(
      'msg',
      undefined,
      undefined,
      undefined,
      undefined,
      original,
    );
    expect(e.name).to.equal('GraphQLError');
    expect(e.stack).to.equal(original.stack);
    expect(e.message).to.equal('msg');
    expect(e.originalError).to.equal(original);
  });

  it('creates new stack if original error has no stack', () => {
    const original = new Error('original');
    const e = new GraphQLError('msg', null, null, null, null, original);
    expect(e.name).to.equal('GraphQLError');
    expect(e.stack).to.be.a('string');
    expect(e.message).to.equal('msg');
    expect(e.originalError).to.equal(original);
  });

  it('converts nodes to positions and locations', () => {
    const e = new GraphQLError('msg', [fieldNode]);
    expect(e.nodes).to.deep.equal([fieldNode]);
    expect(e.source).to.equal(source);
    expect(e.positions).to.deep.equal([4]);
    expect(e.locations).to.deep.equal([{ line: 2, column: 3 }]);
  });

  it('converts single node to positions and locations', () => {
    const e = new GraphQLError('msg', fieldNode); // Non-array value.
    expect(e.nodes).to.deep.equal([fieldNode]);
    expect(e.source).to.equal(source);
    expect(e.positions).to.deep.equal([4]);
    expect(e.locations).to.deep.equal([{ line: 2, column: 3 }]);
  });

  it('converts node with loc.start === 0 to positions and locations', () => {
    const e = new GraphQLError('msg', [operationNode]);
    expect(e.nodes).to.deep.equal([operationNode]);
    expect(e.source).to.equal(source);
    expect(e.positions).to.deep.equal([0]);
    expect(e.locations).to.deep.equal([{ line: 1, column: 1 }]);
  });

  it('converts source and positions to locations', () => {
    const e = new GraphQLError('msg', null, source, [6]);
    expect(e.nodes).to.equal(undefined);
    expect(e.source).to.equal(source);
    expect(e.positions).to.deep.equal([6]);
    expect(e.locations).to.deep.equal([{ line: 2, column: 5 }]);
  });

  it('serializes to include message', () => {
    const e = new GraphQLError('msg');
    expect(JSON.stringify(e)).to.equal('{"message":"msg"}');
  });

  it('serializes to include message and locations', () => {
    const e = new GraphQLError('msg', [fieldNode]);
    expect(JSON.stringify(e)).to.equal(
      '{"message":"msg","locations":[{"line":2,"column":3}]}',
    );
  });

  it('serializes to include path', () => {
    const e = new GraphQLError('msg', null, null, null, [
      'path',
      3,
      'to',
      'field',
    ]);
    expect(e.path).to.deep.equal(['path', 3, 'to', 'field']);
    expect(JSON.stringify(e)).to.equal(
      '{"message":"msg","path":["path",3,"to","field"]}',
    );
  });

  it('default error formatter includes path', () => {
    const e = new GraphQLError('msg', null, null, null, [
      'path',
      3,
      'to',
      'field',
    ]);

    expect(formatError(e)).to.deep.equal({
      message: 'msg',
      locations: undefined,
      path: ['path', 3, 'to', 'field'],
    });
  });

  it('default error formatter includes extension fields', () => {
    const e = new GraphQLError('msg', null, null, null, null, null, {
      foo: 'bar',
    });

    expect(formatError(e)).to.deep.equal({
      message: 'msg',
      locations: undefined,
      path: undefined,
      extensions: { foo: 'bar' },
    });
  });
});
