type InferredType =
  | { kind: 'string'; literal?: string }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'array'; items: InferredType }
  | { kind: 'object'; fields: Record<string, InferredType> }
  | { kind: 'union'; variants: InferredType[] }
  | { kind: 'unknown' };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const sameType = (a: InferredType, b: InferredType): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'string' && b.kind === 'string') {
    return a.literal === b.literal;
  }
  if (a.kind === 'array' && b.kind === 'array') {
    return sameType(a.items, b.items);
  }
  if (a.kind === 'object' && b.kind === 'object') {
    const ak = Object.keys(a.fields);
    const bk = Object.keys(b.fields);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => bk.includes(k) && sameType(a.fields[k], b.fields[k]));
  }
  return true;
};

const mergeTypes = (a: InferredType, b: InferredType): InferredType => {
  if (sameType(a, b)) return a;
  if (a.kind === 'null') return { kind: 'union', variants: [b, a] };
  if (b.kind === 'null') return { kind: 'union', variants: [a, b] };
  if (a.kind === 'union') {
    if (a.variants.some((v) => sameType(v, b))) return a;
    return { kind: 'union', variants: [...a.variants, b] };
  }
  if (b.kind === 'union') {
    if (b.variants.some((v) => sameType(v, a))) return b;
    return { kind: 'union', variants: [a, ...b.variants] };
  }
  if (a.kind === 'object' && b.kind === 'object') {
    const fields: Record<string, InferredType> = { ...a.fields };
    for (const [k, v] of Object.entries(b.fields)) {
      fields[k] = k in fields ? mergeTypes(fields[k], v) : v;
    }
    return { kind: 'object', fields };
  }
  return { kind: 'union', variants: [a, b] };
};

const inferType = (value: unknown, isEventField = false): InferredType => {
  if (value === null) return { kind: 'null' };
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: 'array', items: { kind: 'unknown' } };
    let merged = inferType(value[0]);
    for (let i = 1; i < value.length; i++) {
      merged = mergeTypes(merged, inferType(value[i]));
    }
    return { kind: 'array', items: merged };
  }
  if (isPlainObject(value)) {
    const fields: Record<string, InferredType> = {};
    for (const [key, val] of Object.entries(value)) {
      fields[key] = inferType(val, key === 'event');
    }
    return { kind: 'object', fields };
  }
  if (typeof value === 'string') {
    return isEventField ? { kind: 'string', literal: value } : { kind: 'string' };
  }
  if (typeof value === 'number') return { kind: 'number' };
  if (typeof value === 'boolean') return { kind: 'boolean' };
  return { kind: 'unknown' };
};

const VALID_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const formatKey = (key: string) =>
  VALID_KEY.test(key) ? key : `'${key.replace(/'/g, "\\'")}'`;

const indentStr = (n: number) => '  '.repeat(n);

const toTS = (t: InferredType, indent = 0): string => {
  switch (t.kind) {
    case 'string':
      return t.literal !== undefined ? `'${t.literal}'` : 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'unknown':
      return 'unknown';
    case 'array': {
      const inner = toTS(t.items, indent);
      const needsParens = t.items.kind === 'union' || t.items.kind === 'null';
      return needsParens ? `(${inner})[]` : `${inner}[]`;
    }
    case 'union':
      return t.variants.map((v) => toTS(v, indent)).join(' | ');
    case 'object': {
      const keys = Object.keys(t.fields);
      if (keys.length === 0) return '{}';
      const entries = keys
        .map(
          (k) =>
            `${indentStr(indent + 1)}${formatKey(k)}: ${toTS(
              t.fields[k],
              indent + 1,
            )};`,
        )
        .join('\n');
      return `{\n${entries}\n${indentStr(indent)}}`;
    }
  }
};

const toJsonSchema = (t: InferredType): unknown => {
  switch (t.kind) {
    case 'string':
      return t.literal !== undefined
        ? { type: 'string', const: t.literal }
        : { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'null':
      return { type: 'null' };
    case 'unknown':
      return {};
    case 'array':
      return { type: 'array', items: toJsonSchema(t.items) };
    case 'union':
      return { anyOf: t.variants.map((v) => toJsonSchema(v)) };
    case 'object': {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(t.fields)) {
        properties[k] = toJsonSchema(v);
        required.push(k);
      }
      return {
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
        additionalProperties: false,
      };
    }
  }
};

const toYup = (t: InferredType, indent = 0): string => {
  switch (t.kind) {
    case 'string':
      return t.literal !== undefined
        ? `yup.string().oneOf(['${t.literal}']).required()`
        : 'yup.string().required()';
    case 'number':
      return 'yup.number().required()';
    case 'boolean':
      return 'yup.boolean().required()';
    case 'null':
      return 'yup.mixed().nullable().defined()';
    case 'unknown':
      return 'yup.mixed()';
    case 'array':
      return `yup.array().of(${toYup(t.items, indent)}).required()`;
    case 'union': {
      const nonNull = t.variants.filter((v) => v.kind !== 'null');
      const isNullable = nonNull.length !== t.variants.length;
      if (nonNull.length === 1) {
        const inner = toYup(nonNull[0], indent);
        return isNullable
          ? `${inner.replace(/\.required\(\)$/, '')}.nullable().defined()`
          : inner;
      }
      return 'yup.mixed()';
    }
    case 'object': {
      const keys = Object.keys(t.fields);
      if (keys.length === 0) return 'yup.object({})';
      const entries = keys
        .map(
          (k) =>
            `${indentStr(indent + 1)}${formatKey(k)}: ${toYup(
              t.fields[k],
              indent + 1,
            )},`,
        )
        .join('\n');
      return `yup.object({\n${entries}\n${indentStr(indent)}})`;
    }
  }
};

const toZod = (t: InferredType, indent = 0): string => {
  switch (t.kind) {
    case 'string':
      return t.literal !== undefined ? `z.literal('${t.literal}')` : 'z.string()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'null':
      return 'z.null()';
    case 'unknown':
      return 'z.unknown()';
    case 'array':
      return `z.array(${toZod(t.items, indent)})`;
    case 'union': {
      const nonNull = t.variants.filter((v) => v.kind !== 'null');
      const isNullable = nonNull.length !== t.variants.length;
      if (nonNull.length === 1) {
        const inner = toZod(nonNull[0], indent);
        return isNullable ? `${inner}.nullable()` : inner;
      }
      return `z.union([${t.variants
        .map((v) => toZod(v, indent))
        .join(', ')}])`;
    }
    case 'object': {
      const keys = Object.keys(t.fields);
      if (keys.length === 0) return 'z.object({})';
      const entries = keys
        .map(
          (k) =>
            `${indentStr(indent + 1)}${formatKey(k)}: ${toZod(
              t.fields[k],
              indent + 1,
            )},`,
        )
        .join('\n');
      return `z.object({\n${entries}\n${indentStr(indent)}})`;
    }
  }
};

const toPascalCase = (input: string) =>
  input
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('') || 'Webhook';

const generateAll = (sample: unknown, eventName: string) => {
  const inferred = inferType(sample);
  const typeName = `${toPascalCase(eventName)}Webhook`;

  return {
    typescript: `export type ${typeName} = ${toTS(inferred)};\n`,
    jsonSchema: `${JSON.stringify(
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: typeName,
        ...(toJsonSchema(inferred) as Record<string, unknown>),
      },
      null,
      2,
    )}\n`,
    yup: `import * as yup from 'yup';\n\nexport const ${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}Schema = ${toYup(
      inferred,
    )};\n`,
    zod: `import { z } from 'zod';\n\nexport const ${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}Schema = ${toZod(
      inferred,
    )};\n\nexport type ${typeName} = z.infer<typeof ${typeName.charAt(0).toLowerCase()}${typeName.slice(1)}Schema>;\n`,
  };
};

export { generateAll, inferType, toTS, toJsonSchema, toYup, toZod };
export type { InferredType };
