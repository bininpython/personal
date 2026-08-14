#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { EXERCISE_CATALOG } from '../src/lib/exercises/catalog.ts';

const outputFlag = process.argv.indexOf('--output');
const outputValue = outputFlag >= 0 ? process.argv[outputFlag + 1] : '';
if (!outputValue) throw new Error('Informe --output.');

const output = resolve(outputValue);
await writeFile(output, `${JSON.stringify(EXERCISE_CATALOG, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ count: EXERCISE_CATALOG.length, output })}\n`);
