function mergeLabResults(existingTests, submittedResults) {
  if (!Array.isArray(submittedResults) || !submittedResults.length || submittedResults.length > existingTests.length) {
    throw new Error('Invalid lab results payload');
  }
  const byCode = new Map();
  for (const result of submittedResults) {
    if (!result || typeof result.code !== 'string' || typeof result.result !== 'string' ||
        !result.result.trim() || result.result.length > 500 ||
        !['normal', 'high', 'low'].includes(result.flag || 'normal') ||
        byCode.has(result.code)) {
      throw new Error('Invalid or duplicate lab result entry');
    }
    byCode.set(result.code, { result: result.result.trim(), flag: result.flag || 'normal' });
  }
  const knownCodes = new Set(existingTests.map(test => test.code));
  for (const code of byCode.keys()) if (!knownCodes.has(code)) throw new Error('Unknown lab test code');
  const tests = existingTests.map(test => {
    const value = typeof test.toObject === 'function' ? test.toObject() : { ...test };
    const update = byCode.get(value.code);
    return update ? { ...value, ...update } : value;
  });
  return { tests, complete: tests.length > 0 && tests.every(test => typeof test.result === 'string' && test.result.trim() !== '') };
}
module.exports = { mergeLabResults };
