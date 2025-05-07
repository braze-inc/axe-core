var execSync = require('child_process').execSync;

/*eslint
camelcase: ["error", {"properties": "never"}]
*/
module.exports = function (grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-bytesize');
  grunt.loadTasks('build/tasks');

  // Get supported languages from command line options
  var langs;
  if (grunt.option('lang')) {
    langs = grunt
      .option('lang')
      .split(/[,;]/g)
      .map(function (lang) {
        return lang.trim();
      });
  } else if (grunt.option('all-lang')) {
    var localeFiles = require('fs').readdirSync('./locales');
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

  // run tests only for affected files instead of all tests
  grunt.event.on('watch', function (action, filepath) {
    grunt.config.set('watch.file', filepath);
  });

  process.env.NODE_NO_HTTP2 = 1; // to hide node warning - (node:18740) ExperimentalWarning: The http2 module is an experimental API.

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      core: ['dist', 'tmp/core', 'tmp/rules.js', 'axe.js', 'axe.*.js'],
      tests: ['tmp/integration-tests.js']
    },
    babel: {
      options: {
        compact: false
      },
      core: {
        files: [
          {
            expand: true,
            cwd: 'lib/core',
            src: ['index.js'],
            dest: 'tmp/core'
          }
        ]
      },
      misc: {
        files: [
          {
            expand: true,
            cwd: 'tmp',
            src: ['**/*.js'],
            dest: 'tmp'
          }
        ]
      },
      locale: {
        files: [
          {
            expand: true,
            cwd: 'lib/core',
            src: ['locale-loader.js'],
            dest: 'tmp/core'
          }
        ]
      }
    },
    'update-help': {
      options: {
        version: '<%=pkg.version%>'
      },
      rules: {
        src: ['lib/rules/**/*.json']
      }
    },
    concat: {
      engine: {
        options: {
          process: true
        },
        coreFiles: ['tmp/core/index.js', 'tmp/core/**/*.js'],
        files: [
          {
            src: [
              'lib/intro.stub',
              '<%= concat.engine.coreFiles %>',
              // include rules / checks / commons
              '<%= configure.rules.files[0].dest.auto %>',
              'lib/outro.stub'
            ],
            dest: 'axe.js'
          }
        ]
      }
    },
    esbuild: {
      core: {
        files: [
          {
            expand: true,
            cwd: 'lib/core',
            src: ['core.js'],
            dest: 'tmp/core'
          }
        ]
      }
    },
    'metadata-function-map': {
      core: {
        files: [
          {
            expand: true,
            src: [
              'lib/checks/**/*-{evaluate,after}.js',
              'lib/rules/**/*-matches.js'
            ],
            dest: 'lib/core/base/metadata-function-map.js'
          }
        ]
      }
    },
    'aria-supported': {
      data: {
        entry: 'lib/commons/aria/index.js',
        destFile: 'doc/aria-supported.md',
        listType: 'unsupported' // Possible values for listType: 'supported', 'unsupported', 'all'
      }
    },
    configure: {
      rules: {
        tmp: 'tmp/rules.js',
        options: {
          tags: grunt.option('tags'),
          langs: langs // Pass langs to configure task
        },
        files: [
          {
            src: [''],
            dest: {
              auto: 'tmp/rules.js',
              descriptions: 'doc/rule-descriptions.md'
            }
          }
        ]
      }
    },
    'add-locale': {
      template: {
        options: {
          lang: 'xyz'
        },
        src: ['tmp/core/core.js'],
        dest: './locales/_template.json'
      },
      newLang: {
        options: {
          lang: grunt.option('lang')
        },
        src: ['tmp/core/core.js'],
        dest: './locales/' + (grunt.option('lang') || 'new-locale') + '.json'
      }
    },
    langs: {
      generate: {
        check: 'lib/commons/utils/valid-langs'
      }
    },
    validate: {
      check: {
        options: {
          type: 'check'
        },
        src: 'lib/checks/**/*.json'
      },
      rule: {
        options: {
          type: 'rule'
        },
        src: 'lib/rules/**/*.json'
      }
    },
    uglify: {
      beautify: {
        files: [
          {
            src: ['axe.js'],
            dest: 'axe.js'
          }
        ],
        options: {
          mangle: false,
          compress: false,
          beautify: {
            beautify: true,
            ascii_only: true,
            indent_level: 2,
            braces: true,
            quote_style: 1
          },
          output: {
            comments: /^\/*! axe/
          }
        }
      },
      minify: {
        files: [
          {
            src: ['axe.js'],
            dest: './axe.min.js'
          }
        ],
        options: {
          output: {
            comments: /^\/*! axe/
          },
          mangle: {
            reserved: ['commons', 'utils', 'axe', 'window', 'document']
          }
        }
      }
    },
    test: {
      data: {
        testFile: '<%= watch.file %>'
      }
    },
    watch: {
      axe: {
        options: { spawn: false },
        files: ['lib/**/*', 'Gruntfile.js'],
        tasks: ['build', 'prettier', 'notify', 'test']
      },
      tests: {
        options: { spawn: false },
        files: ['test/**/*'],
        tasks: ['test']
      }
    },
    notify: {
      data: {
        title: 'Axe-core',
        message: 'Build complete',
        sound: 'Pop',
        timeout: 2
      }
    },
    bytesize: {
      all: {
        src: ['./axe.js', './axe.min.js']
      }
    }
  });

  grunt.registerTask('prettier', '', function () {
    const results = execSync('npm run postbuild');
    grunt.log.writeln(results);
  });

  grunt.registerTask('translate', [
    'validate',
    'esbuild',
    'add-locale:newLang'
  ]);
  grunt.registerTask('build', [
    'clean:core',
    'validate',
    'metadata-function-map',
    'esbuild',
    'babel',
    'langs',
    'babel:locale',
    'configure',
    'concat:engine',
    'uglify',
    'aria-supported',
    'add-locale:template',
    'prettier',
    'bytesize'
  ]);
  grunt.registerTask('default', ['build']);
  grunt.registerTask('dev', ['watch']);
};
