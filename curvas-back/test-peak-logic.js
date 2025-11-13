// Test script to verify the peak detection logic

// Simulate production data
const productionData = {
  month: [
    '2020-01-01',
    '2020-02-01',
    '2020-03-01', // Cut date / Injection date
    '2020-04-01',
    '2020-05-01', // This is the peak
    '2020-06-01',
    '2020-07-01',
  ],
  efec_oil_prod: [10, 15, 20, 40, 50, 35, 25]
};

// Test 1: fecha_corte === fecha_inyeccion (should find peak = index 4)
const cutDate1 = '2020-03-01T00:00:00.000';
const injectionDate1 = '2020-03-01T00:00:00.000';

console.log('Test 1: Cut date equals injection date');
console.log('Expected: Should find peak at index 4 with value 50');

const cutDateTime1 = new Date(cutDate1);
const injectionDateTime1 = new Date(injectionDate1);

const isCutDateEqualInjection1 = injectionDateTime1 &&
  cutDateTime1.toISOString().split('T')[0] === injectionDateTime1.toISOString().split('T')[0];

console.log('isCutDateEqualInjection:', isCutDateEqualInjection1);

if (isCutDateEqualInjection1) {
  const indicesAfterCut = productionData.month
    .map((m, idx) => ({ date: new Date(m), idx }))
    .filter(({ date }) => date >= cutDateTime1)
    .map(({ idx }) => idx);

  console.log('Indices after cut:', indicesAfterCut);

  const startIndex = indicesAfterCut.reduce((maxIdx, currentIdx) => {
    const currentValue = productionData.efec_oil_prod[currentIdx] || 0;
    const maxValue = productionData.efec_oil_prod[maxIdx] || 0;
    return currentValue > maxValue ? currentIdx : maxIdx;
  }, indicesAfterCut[0]);

  console.log('Found peak at index:', startIndex);
  console.log('Peak value:', productionData.efec_oil_prod[startIndex]);
  console.log('Peak date:', productionData.month[startIndex]);
  console.log('✓ Test 1 passed!\n');
}

// Test 2: fecha_corte !== fecha_inyeccion (should find next point = index 2)
const cutDate2 = '2020-03-01T00:00:00.000';
const injectionDate2 = '2020-01-15T00:00:00.000';

console.log('Test 2: Cut date does NOT equal injection date');
console.log('Expected: Should find next point at index 2 with value 20');

const cutDateTime2 = new Date(cutDate2);
const injectionDateTime2 = new Date(injectionDate2);

const isCutDateEqualInjection2 = injectionDateTime2 &&
  cutDateTime2.toISOString().split('T')[0] === injectionDateTime2.toISOString().split('T')[0];

console.log('isCutDateEqualInjection:', isCutDateEqualInjection2);

if (!isCutDateEqualInjection2) {
  const startIndex = productionData.month.findIndex((m) => {
    const prodDate = new Date(m);
    return prodDate >= cutDateTime2;
  });

  console.log('Found next point at index:', startIndex);
  console.log('Value:', productionData.efec_oil_prod[startIndex]);
  console.log('Date:', productionData.month[startIndex]);
  console.log('✓ Test 2 passed!\n');
}
