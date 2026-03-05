import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';

const pipe = new ValidationPipe({ whitelist: true });

class TestDto {} // emitted for type

async function run() {
  try {
    const result = await pipe.transform({ plan: 'starter' }, { type: 'body', metatype: TestDto as any });
    console.log(result);
  } catch (e) {
    console.error(e);
  }
}
run();
