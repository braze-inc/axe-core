/*eslint-env node */
'use strict';
var fs = require('fs');
var path = require('path');

module.exports = function (grunt) {
  function loadLocaleData(lang) {
    if (lang === 'en') {
      // For English, generate locale data from rule and check files
      var rules = grunt.file.expand('lib/rules/**/*.json').map(function (file) {
        var json = grunt.file.readJSON(file);
        return {
          id: json.id,
          description: json.metadata.description,
          help: json.metadata.help
        };
      });

      var checks = grunt.file
        .expand('lib/checks/**/*.json')
        .map(function (file) {
          var json = grunt.file.readJSON(file);
          return {
            id: json.id,
            pass: json.metadata.messages.pass,
            fail: json.metadata.messages.fail,
            incomplete: json.metadata.messages.incomplete
          };
        });

      var failureSummaries = grunt.file
        .expand('lib/misc/**/*.json')
        .map(function (file) {
          var json = grunt.file.readJSON(file);
          if (json.type) {
            return {
              type: json.type,
              failureMessage: json.metadata.failureMessage
            };
          }
          return null;
        })
        .filter(Boolean);

      var incompleteFallbackMessage = '';
      var miscFiles = grunt.file.expand('lib/misc/**/*.json');
      for (var i = 0; i < miscFiles.length; i++) {
        var json = grunt.file.readJSON(miscFiles[i]);
        if (typeof json.incompleteFallbackMessage === 'string') {
          incompleteFallbackMessage = json.incompleteFallbackMessage;
          break;
        }
      }

      return {
        lang: 'en',
        rules: rules.reduce(function (acc, rule) {
          acc[rule.id] = {
            description: rule.description,
            help: rule.help
          };
          return acc;
        }, {}),
        checks: checks.reduce(function (acc, check) {
          acc[check.id] = {
            pass: check.pass,
            fail: check.fail,
            incomplete: check.incomplete
          };
          return acc;
        }, {}),
        failureSummaries: failureSummaries.reduce(function (acc, summary) {
          acc[summary.type] = {
            failureMessage: summary.failureMessage
          };
          return acc;
        }, {}),
        incompleteFallbackMessage: incompleteFallbackMessage
      };
    } else {
      // For other languages, load from JSON files
      var localePath = path.join(process.cwd(), 'locales', lang + '.json');
      if (fs.existsSync(localePath)) {
        return JSON.parse(fs.readFileSync(localePath, 'utf8'));
      }
    }
    return null;
  }

  function buildLangTrie(langs) {
    const trie = [];

    for (const lang of langs) {
      let current = trie;
      const paddedLang = lang.padEnd(3, '`');

      for (const char of paddedLang) {
        const index = char.charCodeAt(0) - 96;
        if (!current[index]) {
          current[index] = [];
        }
        current = current[index];
      }
      current[0] = 1; // Mark as valid end
    }

    return trie;
  }

  function generateOutput(langs, checkPath) {
    var outputPath = checkPath + '.js';
    const trie = buildLangTrie(langs);

    // Format trie as a clean string
    const trieStr = JSON.stringify(trie)
      .replace(/\[\]/g, '[0]')
      .replace(/1/g, 'true')
      .replace(/0/g, 'false');

    var template = [
      '/* global axe */\n',
      '/*eslint quotes: 0*/\n',
      'var langs = ' + trieStr + ';\n\n',
      '/**\n',
      ' * Determine if a string is a valid language code\n',
      ' * @method isValidLang\n',
      ' * @memberof axe.utils\n',
      ' * @param {String} lang String to test if a valid language code\n',
      ' * @returns {Boolean}\n',
      ' */\n',
      'function isValidLang(lang) {\n',
      '\tlet array = langs;\n',
      '\twhile (lang.length < 3) {\n',
      "\t\tlang += '`';\n",
      '\t}\n',
      '\tfor (let i = 0; i <= lang.length - 1; i++) {\n',
      '\t\tconst index = lang.charCodeAt(i) - 96;\n',
      '\t\tarray = array[index];\n',
      '\t\tif (!array) {\n',
      '\t\t\treturn false;\n',
      '\t\t}\n',
      '\t}\n',
      '\treturn true;\n',
      '}\n\n',
      '/**\n',
      ' * Returns array of valid language codes\n',
      ' * @method validLangs\n',
      ' * @memberof axe.utils\n',
      ' * @return {Array<String>} Valid language codes\n',
      ' */\n',
      'function _validLangs(langArray) {\n',
      '\tlangArray = Array.isArray(langArray) ? langArray : langs;\n',
      '\tconst codes = [];\n',
      '\tlangArray.forEach((lang, index) => {\n',
      "\t\tconst char = String.fromCharCode(index + 96).replace('`', '');\n",
      '\t\tif (Array.isArray(lang)) {\n',
      '\t\t\tcodes.push(..._validLangs(lang).map(newLang => char + newLang));\n',
      '\t\t} else if (lang) {\n',
      '\t\t\tcodes.push(char);\n',
      '\t\t}\n',
      '\t});\n',
      '\treturn codes;\n',
      '}\n\n',
      'axe.utils.validLangs = function () {\n',
      '\treturn _validLangs();\n',
      '};\n\n',
      'export default isValidLang;\n'
    ].join('');
    grunt.file.write(outputPath, template);
  }

  function generateLocaleLoader(langs) {
    // Format locale data with clean indentation
    var localeDataStr = JSON.stringify(
      langs.reduce(function (acc, lang) {
        var data = loadLocaleData(lang);
        if (data) {
          acc[lang] = data;
        }
        return acc;
      }, {}),
      null,
      '\t'
    );

    var template = [
      '/* global axe */\n',
      '/*eslint quotes: 0*/\n',
      '/**\n',
      ' * Embedded locale data for all supported languages.\n',
      ' * This data is loaded at build time and embedded directly in the library\n',
      ' * to avoid runtime file loading.\n',
      ' * @private\n',
      ' */\n',
      'var localeData = ' + localeDataStr + ';\n\n',
      '/**\n',
      ' * Loads locale data for the specified language\n',
      ' * @method _loadLocale\n',
      ' * @memberof axe\n',
      ' * @private\n',
      ' * @param {String} lang Language code to load\n',
      ' * @return {Object} Locale data for the specified language\n',
      ' */\n',
      'axe._loadLocale = function(lang) {\n',
      "\t'use strict';\n",

      '\treturn localeData[lang];\n',
      '};\n'
    ].join('');
    grunt.file.write('tmp/core/locale-loader.js', template);
  }

  grunt.registerMultiTask(
    'langs',
    'Task for generating language support files',
    function () {
      if (!this.data.check) {
        return;
      }

      var check = this.data.check;
      var langs = [];

      if (grunt.option('lang')) {
        langs = grunt
          .option('lang')
          .split(/[,;]/g)
          .map(function (langCode) {
            return langCode.trim();
          });
      } else if (grunt.option('all-lang')) {
        var localeFiles = fs.readdirSync('./locales');
        langs = localeFiles
          .filter(function (file) {
            return !file.startsWith('_') && file.endsWith('.json');
          })
          .map(function (file) {
            return file.replace('.json', '');
          });
      } else {
        langs = ['en']; // Default to English
      }

      // Sort langs array to ensure consistent output
      langs.sort();

      // Generate the valid-langs.js file with trie structure
      generateOutput(langs, check);

      // Generate the locale-loader.js file with embedded locale data
      generateLocaleLoader(langs);

      grunt.log.ok('Generated language support for: ' + langs.join(', '));
    }
  );
};
