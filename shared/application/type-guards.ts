import { UnknownRecord } from 'type-fest';
import { Nil, Nilable, NonEmptyArray, Undefinable } from './type-utils';

export const isNull = (x: unknown): x is null => x === null;

export const isNotNull = <T>(x: unknown): x is Exclude<T, null> => !isNull(x);

export const isUndefined = (x: unknown): x is undefined => x === undefined;

export const isNotUndefined = <T>(
  x: Undefinable<T>
): x is Exclude<T, undefined> => !isUndefined(x);

export const isNil = (x: unknown): x is Nil => isNull(x) || isUndefined(x);

export const isNotNil = <T>(x: Nil | T): x is T => !isNil(x);

export const isString = (x: unknown): x is string => typeof x === 'string';

export const isEmptyString = (x: unknown): x is '' => isString(x) && x === '';

export const isNonEmptyString = (x: unknown): x is string =>
  isString(x) && x !== '';

export const isArray = (x: unknown): x is unknown[] => x instanceof Array;

export const isEmptyArray = (x: unknown): x is never[] =>
  isArray(x) && x.length === 0;

export const isNonEmptyArray = <T>(
  x: Nilable<T[] | UnknownRecord>
): x is NonEmptyArray<T> => isArray(x) && x.length > 0;
