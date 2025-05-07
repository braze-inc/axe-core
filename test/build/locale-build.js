/* global describe, it */
describe('locale-build', function () {
  'use strict';

  var fs = require('fs');
  var assert = require('assert');
  var axe = require('../../axe');

  describe('built locale data', function () {
    it('should have English locale data embedded', function () {
      // Check that English locale data is embedded in the built file
      var builtFile = fs.readFileSync('axe.js', 'utf8');
      assert.ok(builtFile.includes('var localeData = {'));
      assert.ok(builtFile.includes('"en":'));
      assert.ok(builtFile.includes('"rules":'));
      assert.ok(builtFile.includes('"checks":'));
    });

    it('should have valid locale data structure', function () {
      var localeData = axe._loadLocale('en');

      // Check rules structure
      assert.ok(localeData.rules);
      Object.keys(localeData.rules).forEach(function (ruleId) {
        var rule = localeData.rules[ruleId];
        assert.ok(
          rule.description,
          'Rule ' + ruleId + ' should have description'
        );
        assert.ok(rule.help, 'Rule ' + ruleId + ' should have help text');
      });

      // Check checks structure
      assert.ok(localeData.checks);
      Object.keys(localeData.checks).forEach(function (checkId) {
        var check = localeData.checks[checkId];
        assert.ok(check.pass, 'Check ' + checkId + ' should have pass message');
        assert.ok(check.fail, 'Check ' + checkId + ' should have fail message');
        assert.ok(
          check.incomplete,
          'Check ' + checkId + ' should have incomplete message'
        );
      });

      // Check failure summaries
      assert.ok(localeData.failureSummaries);
      Object.keys(localeData.failureSummaries).forEach(function (type) {
        var summary = localeData.failureSummaries[type];
        assert.ok(
          summary.failureMessage,
          'Failure summary ' + type + ' should have message'
        );
      });

      // Check incomplete fallback message
      assert.ok(typeof localeData.incompleteFallbackMessage === 'string');
    });

    it('should not have separate English locale file', function () {
      var localeFiles = fs.readdirSync('locales');
      assert.ok(
        !localeFiles.includes('en.json'),
        'Should not have en.json locale file'
      );
    });
  });

  describe('build process', function () {
    it('should generate valid-langs.js', function () {
      var validLangsFile = fs.readFileSync(
        'lib/commons/utils/valid-langs.js',
        'utf8'
      );
      assert.ok(validLangsFile.includes('var langs ='));
      assert.ok(validLangsFile.includes('function isValidLang'));
      assert.ok(validLangsFile.includes('function _validLangs'));
    });

    it('should generate locale-loader.js', function () {
      var localeLoaderFile = fs.readFileSync(
        'tmp/core/locale-loader.js',
        'utf8'
      );
      assert.ok(localeLoaderFile.includes('var localeData ='));
      assert.ok(localeLoaderFile.includes('axe._loadLocale = function'));
    });
  });
});
