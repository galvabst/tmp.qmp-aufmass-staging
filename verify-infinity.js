import('zod').then(({ z }) => {
  // Exactly as in aufmass-schema.ts (lines 3-17)
  const emptyToUndefined = (value) => {
    if (value === null || value === '') return undefined;
    if (typeof value === 'number' && Number.isNaN(value)) return undefined;
    return value;
  };

  const optionalNonNegativeNumber = z.preprocess(emptyToUndefined, z.number().min(0).optional());
  const requiredNonNegativeNumber = (message = 'Bitte angeben') =>
    z.preprocess(emptyToUndefined, z.number({ required_error: message, invalid_type_error: message }).min(0, message));

  console.log('\n=== Test 1: optionalNonNegativeNumber with Infinity ===');
  const test1 = optionalNonNegativeNumber.safeParse(Infinity);
  console.log('Result:', test1.success ? 'ACCEPTED' : 'REJECTED');
  if (test1.success) {
    console.log('  Value:', test1.data);
    console.log('  Value === Infinity:', test1.data === Infinity);
  } else {
    console.log('  Error:', test1.error.issues[0]?.message);
  }

  console.log('\n=== Test 2: requiredNonNegativeNumber with Infinity ===');
  const test2 = requiredNonNegativeNumber('Test').safeParse(Infinity);
  console.log('Result:', test2.success ? 'ACCEPTED' : 'REJECTED');
  if (test2.success) {
    console.log('  Value:', test2.data);
  } else {
    console.log('  Error:', test2.error.issues[0]?.message);
  }

  console.log('\n=== Test 3: -Infinity ===');
  const test3 = optionalNonNegativeNumber.safeParse(-Infinity);
  console.log('Result:', test3.success ? 'ACCEPTED' : 'REJECTED');
  if (test3.success) {
    console.log('  Value:', test3.data);
  } else {
    console.log('  Error:', test3.error.issues[0]?.message);
  }

  console.log('\n=== Test 4: With z.number().finite() ===');
  const finiteSchema = z.preprocess(emptyToUndefined, z.number().finite().min(0).optional());
  const test4 = finiteSchema.safeParse(Infinity);
  console.log('Result:', test4.success ? 'ACCEPTED' : 'REJECTED');
  if (test4.success) {
    console.log('  Value:', test4.data);
  } else {
    console.log('  Error:', test4.error.issues[0]?.message);
  }

  console.log('\n=== Test 5: NaN (should be filtered by emptyToUndefined) ===');
  const test5 = optionalNonNegativeNumber.safeParse(NaN);
  console.log('Result:', test5.success ? 'ACCEPTED' : 'REJECTED');
  if (test5.success) {
    console.log('  Value:', test5.data);
    console.log('  Is undefined:', test5.data === undefined);
  }

  console.log('\n=== Test 6: Number.MAX_VALUE * 2 ===');
  const bigNum = Number.MAX_VALUE * 2;
  console.log('Number.MAX_VALUE * 2 =', bigNum, '| Is Infinity?', bigNum === Infinity);
  const test6 = optionalNonNegativeNumber.safeParse(bigNum);
  console.log('Result:', test6.success ? 'ACCEPTED' : 'REJECTED');
  if (test6.success) {
    console.log('  Value:', test6.data);
  }
});
