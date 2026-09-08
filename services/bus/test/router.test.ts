import { describe, expect, it } from 'vitest';
import { buildUrl } from '../src/router.js';

describe('buildUrl', () => {
  it('substitutes :param segments from data on GET', () => {
    expect(buildUrl('http://a', '/registro/citizen/:id', 'GET', { id: '1-2345-6789' })).toBe('http://a/registro/citizen/1-2345-6789');
    expect(buildUrl('http://a', '/registro-nacional/property/:folio', 'GET', { folio: '1-123456-000' })).toBe(
      'http://a/registro-nacional/property/1-123456-000',
    );
    expect(buildUrl('http://a', '/ccss/employment/:citizenId', 'GET', { citizenId: '7-0123-0456' })).toBe(
      'http://a/ccss/employment/7-0123-0456',
    );
    expect(buildUrl('http://a', '/registro-nacional/vehicle/:plate', 'GET', { plate: 'BCR-123' })).toBe('http://a/registro-nacional/vehicle/BCR-123');
    expect(buildUrl('http://a', '/registro/dependants/:id', 'GET', { id: '7-0111-0222' })).toBe('http://a/registro/dependants/7-0111-0222');
  });

  it('appends declared query keys from data and URL-encodes them', () => {
    expect(buildUrl('http://a', '/registro-nacional/properties', 'GET', { ownerId: '1-2345-6789', other: 'x' }, ['ownerId'])).toBe(
      'http://a/registro-nacional/properties?ownerId=1-2345-6789',
    );
    expect(buildUrl('http://a', '/registro-nacional/vehicles', 'GET', { ownerId: '2-0987-0654' }, ['ownerId'])).toBe(
      'http://a/registro-nacional/vehicles?ownerId=2-0987-0654',
    );
    expect(buildUrl('http://a', '/x', 'GET', { q: 'a b&c' }, ['q'])).toBe('http://a/x?q=a+b%26c');
    expect(buildUrl('http://a', '/x', 'GET', {}, ['q'])).toBe('http://a/x');
    expect(buildUrl('http://a', '/x', 'GET', null, ['q'])).toBe('http://a/x');
  });

  it('leaves POST paths untouched', () => {
    expect(buildUrl('http://a', '/tributacion/createTaxId', 'POST', { id: 'x' }, ['id'])).toBe('http://a/tributacion/createTaxId');
  });

  it('encodes a missing :param as empty', () => {
    expect(buildUrl('http://a', '/registro/citizen/:id', 'GET', {})).toBe('http://a/registro/citizen/');
  });
});
