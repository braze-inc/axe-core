var fs = require('fs');
var path = require('path');
var assert = require('assert');
var glob = require('glob');

var localeFiles = glob.sync(path.join(__dirname, '../locales/*.json'));

describe('locales', function () {
  localeFiles.forEach(function (localeFile) {
    var localeName = path.basename(localeFile, '.json');
    it(localeName + ' should be valid', function () {
      var localeData = fs.readFileSync(localeFile, 'utf-8');
      var locale = JSON.parse(localeData);

      // Test loading through _loadLocale
      var loadedLocale = axe._loadLocale(localeName);
      assert.ok(loadedLocale, 'Should load locale data');
      assert.deepEqual(
        loadedLocale,
        locale,
        'Loaded locale should match file data'
      );

      // Test loading through configure
      function fn() {
        axe.configure({ lang: localeName });
      }
      assert.doesNotThrow(fn, 'Should configure with locale');

      // Verify locale was applied
      assert.deepEqual(
        axe._audit.locale,
        locale,
        'Audit locale should match file data'
      );
    });
  });

  it('should load English locale data', function () {
    var localeData = axe._loadLocale('en');
    assert.ok(localeData, 'Should load English locale data');
    assert.ok(localeData.rules, 'Should have rules');
    assert.ok(localeData.checks, 'Should have checks');
    assert.ok(localeData.failureSummaries, 'Should have failure summaries');
    assert.ok(
      localeData.incompleteFallbackMessage,
      'Should have incomplete fallback message'
    );
  });
});
