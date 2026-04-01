import { parseBankSMS } from './src/services/smsParser';

const testCases = [
  {
    address: 'AD-HDFCBK',
    body: 'Rs.5000.00 credited to your account XXXXX1234 on 01-04-24. Info: UPI-ID.',
    expected: { amount: 5000, bank: 'HDFCBK' }
  },
  {
    address: 'VM-ICICIBK',
    body: 'INR 2,000.00 has been credited via UPI to your Acct XX123 on 01/04/2026.',
    expected: { amount: 2000, bank: 'ICICIBK' }
  },
  {
    address: 'SBI-BANK',
    body: 'Your A/c XX123 is credited with ₹15,000.50 on 12-03-24. New Bal: ₹50,000.',
    expected: { amount: 15000.50, bank: 'SBI' }
  },
  {
    address: 'AXISBK',
    body: 'Dear Customer, your A/c XX999 is debited for Rs.100.00. OTP: 123456.',
    expected: null // Should be ignored (debit/OTP)
  }
];

console.log('--- SMS Parser Test Suite ---');
testCases.forEach((tc, idx) => {
  const result = parseBankSMS(tc.body, tc.address);
  if (tc.expected === null) {
    if (result === null) {
      console.log(`Test ${idx + 1}: Passed (Ignored as expected)`);
    } else {
      console.log(`Test ${idx + 1}: FAILED (Expected null but got transaction)`);
    }
  } else {
    if (result && result.amount === tc.expected.amount && result.note.includes(tc.expected.bank)) {
      console.log(`Test ${idx + 1}: Passed (Amount: ${result.amount}, Bank: ${tc.expected.bank})`);
    } else {
      console.log(`Test ${idx + 1}: FAILED`, { result, expected: tc.expected });
    }
  }
});
