// have to run node-service and database-service before testing

var assert = require('assert');
var helpers = require('../../utils/helpers');

describe('broadcast_char_count', () => {
  it('charCount function works on text without emojis', function () {
    assert.equal(5, helpers.charCountWithoutEmojis('chars'));
  });

  it('charCount function works on text with only an emoji', function () {
    assert.equal(1, helpers.charCountWithoutEmojis(':emoji:'));
  });

  it('charCount function works on text with multiple emojis', function () {
    assert.equal(10, helpers.charCountWithoutEmojis('text and :emoji:'));
  });

  it('charCount function works on an empty string', function () {
    assert.equal(0, helpers.charCountWithoutEmojis(''));
  });

  it('charCount function does not pick up on single colons', function () {
    assert.equal(6, helpers.charCountWithoutEmojis('chars:'));
  });

  it('charCount function does does not consider whitespace between colons to be an emoji', function () {
    assert.equal(14, helpers.charCountWithoutEmojis('foo : bar: foo'));
  });

  it('charCount function does does not consider colons without a pair to be an emoji', function () {
    assert.equal(9, helpers.charCountWithoutEmojis('foo :foo:bar:'));
  });
});

describe('mysql_date_string', () => {
  it('mysqlDateString function return expected result', function () {
    assert.equal('2016-10-20 00:36:00', helpers.mysqlDateString('2016-10-20T00:36:00.000Z'));
  });
});
