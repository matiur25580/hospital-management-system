const { mergeLabResults } = require('../utils/labResultPolicy');

const orderTests = [
  { code: 'CBC', name: 'Complete Blood Count', result: '', flag: '' },
  { code: 'TSH', name: 'Thyroid', result: '', flag: '' }
];

test('partial lab results preserve unfinished tests and mark order incomplete', () => {
  const result = mergeLabResults(orderTests, [{ code: 'CBC', result: 'Normal', flag: 'normal' }]);
  expect(result.complete).toBe(false);
  expect(result.tests[0].result).toBe('Normal');
  expect(result.tests[1].result).toBe('');
});

test('all lab results mark the order complete', () => {
  const result = mergeLabResults(orderTests, [
    { code: 'CBC', result: 'Normal', flag: 'normal' },
    { code: 'TSH', result: '4.2', flag: 'high' }
  ]);
  expect(result.complete).toBe(true);
});

test('invalid, duplicate and unknown lab result codes are rejected', () => {
  expect(() => mergeLabResults(orderTests, [{ code: 'CBC', result: '', flag: 'normal' }])).toThrow();
  expect(() => mergeLabResults(orderTests, [
    { code: 'CBC', result: 'A', flag: 'normal' },
    { code: 'CBC', result: 'B', flag: 'normal' }
  ])).toThrow(/duplicate/i);
  expect(() => mergeLabResults(orderTests, [{ code: 'OTHER', result: 'A', flag: 'normal' }])).toThrow(/Unknown/);
});
