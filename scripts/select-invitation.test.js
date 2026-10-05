const {test} = require('node:test');
const assert = require('node:assert/strict');
const {selectSide, mergeConfig} = require('./select-invitation');
test('repository selects the correct invitation; explicit override is validated', () => {
  assert.equal(selectSide('', 'CikimeLog/tuananh-phuongmai'), 'groom');
  assert.equal(selectSide('', 'CikimeLog/phuongmai-tuananh'), 'bride');
  assert.equal(selectSide('bride', 'CikimeLog/weding'), 'bride');
  assert.throws(() => selectSide('invalid'));
  assert.throws(() => selectSide('', 'CikimeLog/unknown'));
});
test('side config overrides nested fields and preserves shared wedding details', () => {
  assert.deepEqual(mergeConfig({bank:{accountNo:'1',qrImage:'old'},venue:'shared'}, {bank:{qrImage:'new'},invitationSide:'bride'}), {bank:{accountNo:'1',qrImage:'new'},venue:'shared',invitationSide:'bride'});
});
