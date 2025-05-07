/* global describe, it */
describe('locale-loader', function () {
  'use strict';

  describe('_loadLocale', function () {
    it('should load English locale data by default', function () {
      var localeData = axe._loadLocale('en');
      assert.ok(localeData);
      assert.ok(localeData.rules);
      assert.ok(localeData.checks);
      assert.ok(localeData.failureSummaries);
      assert.ok(localeData.incompleteFallbackMessage);
    });

    it('should throw error for unknown language', function () {
      assert.throws(function () {
        axe._loadLocale('xyz');
      }, /Locale data not found for language: xyz/);
    });

    it('should load locale data through configure', function () {
      var localeData = axe._loadLocale('en');

      // Reset audit to initial state
      axe._audit._init();

      // Configure with English locale
      axe.configure({ lang: 'en' });

      // Check that the locale data was properly merged into the audit's data
      Object.keys(localeData.checks).forEach(function (checkId) {
        assert.ok(
          axe._audit.data.checks[checkId],
          'Check ' + checkId + ' should exist'
        );
        var checkData = axe._audit.data.checks[checkId];
        var localeCheck = localeData.checks[checkId];

        // Compare each message property
        assert.equal(
          checkData.messages.pass,
          localeCheck.pass,
          'Check ' + checkId + ' pass message should match'
        );
        assert.deepEqual(
          checkData.messages.fail,
          localeCheck.fail,
          'Check ' + checkId + ' fail message should match'
        );
        if (localeCheck.incomplete) {
          // Use deepEqual for incomplete messages since they can be objects
          assert.deepEqual(
            checkData.messages.incomplete,
            localeCheck.incomplete,
            'Check ' + checkId + ' incomplete message should match'
          );
        }
      });

      Object.keys(localeData.rules).forEach(function (ruleId) {
        assert.ok(
          axe._audit.data.rules[ruleId],
          'Rule ' + ruleId + ' should exist'
        );
        assert.deepEqual(
          {
            description: axe._audit.data.rules[ruleId].description,
            help: axe._audit.data.rules[ruleId].help
          },
          localeData.rules[ruleId],
          'Rule ' + ruleId + ' data should match'
        );
      });

      // Define expected outputs for each failure summary type
      var expectedOutputs = {
        any: 'Fix any of the following:\n  Test item 1\n  Test item 2\n  with newline',
        none: 'Fix all of the following:\n  Test item 1\n  Test item 2\n  with newline',
        all: 'Fix all of the following:\n  Test item 1\n  Test item 2\n  with newline'
      };

      Object.keys(localeData.failureSummaries).forEach(function (type) {
        assert.ok(
          axe._audit.data.failureSummaries[type],
          'Failure summary ' + type + ' should exist'
        );
        var auditSummary =
          axe._audit.data.failureSummaries[type].failureMessage;
        var localeSummary = localeData.failureSummaries[type].failureMessage;

        // Test the function with sample data to verify it produces the expected output
        if (typeof auditSummary === 'function') {
          var testData = ['Test item 1', 'Test item 2\nwith newline'];
          assert.equal(
            auditSummary(testData),
            expectedOutputs[type],
            'Failure summary ' + type + ' should format data correctly'
          );
        } else {
          assert.deepEqual(
            auditSummary,
            localeSummary,
            'Failure summary ' + type + ' message should match'
          );
        }
      });

      assert.equal(
        axe._audit.data.incompleteFallbackMessage,
        localeData.incompleteFallbackMessage,
        'Incomplete fallback message should match'
      );
      assert.equal(axe._audit.lang, 'en', 'Language should be set to en');
    });

    it('should throw error for invalid language in configure', function () {
      assert.throws(function () {
        axe.configure({ lang: 'xyz' });
      }, /Failed to load locale data for language: xyz/);
    });
  });

  describe('isValidLang', function () {
    it('should validate English language code', function () {
      assert.ok(axe.utils.isValidLang('en'));
    });

    it('should validate other supported languages', function () {
      // Add test for other languages based on what's supported
      var supportedLangs = axe.utils.validLangs();
      supportedLangs.forEach(function (lang) {
        assert.ok(
          axe.utils.isValidLang(lang),
          'Language ' + lang + ' should be valid'
        );
      });
    });

    it('should reject invalid language codes', function () {
      assert.ok(!axe.utils.isValidLang('xyz'));
      assert.ok(!axe.utils.isValidLang(''));
      assert.ok(!axe.utils.isValidLang('123'));
    });
  });

  describe('validLangs', function () {
    it('should return array of valid languages', function () {
      var langs = axe.utils.validLangs();
      assert.ok(Array.isArray(langs));
      assert.ok(langs.length > 0);
      assert.ok(langs.includes('en'));
    });
  });
});
