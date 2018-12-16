// (c) 2013 Manuel Braun (mb@w69b.com)
'use strict';
const gulp = require('gulp');
const del = require('del');
const format = require('gulp-clang-format');
const karma = require('karma');
const concat = require('gulp-concat');
const sort = require('gulp-sort');
const shader2js = require('./tasks/shader2js');
const sourcemaps = require('gulp-sourcemaps');
const webserver = require('gulp-webserver');
const closureCompiler = require('google-closure-compiler').gulp(
  {extraArguments: ['-XX:+TieredCompilation']});


const PATHS = {
  src: {
    checkFormat: [
      'src/**/*.js'
    ],
    shaders: ['src/w69b/webgl/shaders/*.{vs,fs}'],
    closure: [
      'node_modules/google-closure-library/closure/goog/**/*.js',
      '!node_modules/google-closure-library/closure/goog/**/*_test.js',
      'node_modules/google-closure-library/third_party/**/*.js',
      '!node_modules/google-closure-library/third_party/**/*_test.js',
      'src/**/*.js',
      'src/**/*.mjs'
    ],
  },
  dst: {
    shaders: 'src/w69b/webgl/shaders/'
  }
};

const CLOSURE_CONFIG = {
  assume_function_wrapper: true,
  externs: [
    'externs/iconv.js'
  ],
  generate_exports: true,
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  language_in: 'ECMASCRIPT_2018',
  language_out: 'ECMASCRIPT5_STRICT',
  dependency_mode: 'STRICT',
  hide_warnings_for: [
    'node_modules/',
    '[synthetic',
    'spellcheck',
    'ui',
    'style',
    'promise',
    'events',
    'dom',
    'object',
    'net',
    'math',
    'disposable',
    'debug',
    'reflect',
    'labs',
    'i18n',
    'array',
    'asserts',
    'crypt',
    'fs',
    'async',
    'html',
    'functions',
    'string/string.js',
    'string/const.js',
    'base.js',
    'google-closure-library',
    'node_modules/google-closure-library',
    'closure',
  ],
  isolation_mode: 'IIFE',
  warning_level: 'VERBOSE',
  jscomp_warning: [
    'accessControls',
    'const',
    'constantProperty',
    'deprecatedAnnotations',
    'extraRequire',
    'functionParams',
    'globalThis',
    'lintChecks',
    'missingProperties',
    'missingProvide',
    'missingOverride',
    'missingRequire',
    'missingReturn',
    'newCheckTypes',
    'nonStandardJsDocs',
    // 'reportUnknownTypes',
    'typeInvalidation',
    'undefinedNames',
    'undefinedVars',
    'unknownDefines',
    'unusedLocalVariables',
    'unusedPrivateMembers',
    'useOfGoogBase',
    'uselessCode',
    'underscore',
    'visibility'
  ]
};

const CLOSURE_DEBUG_CONFIG = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
delete CLOSURE_DEBUG_CONFIG['isolation_mode'];
CLOSURE_DEBUG_CONFIG['compilation_level'] = 'WHITESPACE_ONLY';
CLOSURE_DEBUG_CONFIG['force_inject_library'] = ['es6_runtime'];
CLOSURE_DEBUG_CONFIG['language_out'] = 'ECMASCRIPT5';
CLOSURE_DEBUG_CONFIG['formatting'] = 'PRETTY_PRINT';
CLOSURE_DEBUG_CONFIG['output_wrapper'] = 'self.CLOSURE_NO_DEPS = true;\n%output%';


gulp.task('clean', function() {
  return del(['dist', 'build', 'coverage']);
});

gulp.task('check-format', function() {
  return gulp.src(PATHS.src.checkFormat)
     .pipe(format.checkFormat(undefined, undefined, {verbose: true}));
});

gulp.task('format', function() {
  // The base option ensures the glob doesn't strip prefixes
  return gulp.src(PATHS.src.checkFormat, {base: '.'})
      .pipe(format.format())
      .pipe(gulp.dest('.'));
});

gulp.task('shader2js', function() {
  return gulp.src(PATHS.src.shaders, {base: 'src'})
    .pipe(sort())
    .pipe(shader2js())
    .pipe(concat('compiled.js'))
    .pipe(gulp.dest(PATHS.dst.shaders))
});

gulp.task('buildDebug:main', gulp.series('shader2js', function() {
  const config = JSON.parse(JSON.stringify(CLOSURE_DEBUG_CONFIG));
  config['js_output_file'] = 'w69b.barcode.js';
  config['entry_point'] = 'main';

  return gulp.src(PATHS.src.closure)
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(config))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
}));

gulp.task('buildDebug:worker', gulp.series('shader2js', function() {
  const config = JSON.parse(JSON.stringify(CLOSURE_DEBUG_CONFIG));
  config['js_output_file'] = 'w69b.barcode.decodeworker.js';
  config['entry_point'] = 'decodeworker';

  return gulp.src(PATHS.src.closure)
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(config))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
}));

gulp.task('buildDebug', gulp.parallel('buildDebug:main', 'buildDebug:worker'));

gulp.task('test', gulp.series('buildDebug', function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
}));

gulp.task('watch', gulp.series('buildDebug', function() {
  gulp.watch(PATHS.src.shaders.concat(PATHS.src.closure), ['buildDebug']);
  gulp.src('.')
    .pipe(webserver({
      host: '0.0.0.0',
      livereload: false,
      directoryListing: true
    }));
}));

gulp.task('coverage', gulp.series('buildDebug', function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true,
    preprocessors: {
      '**/*.js': ['sourcemap'],
      'dist/**/*.js': ['sourcemap', 'coverage']
    },
    reporters: ['progress', 'coverage', 'karma-remap-istanbul']
  }, done).start();
}));

gulp.task('compile:main', function() {
  const config = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
  config['js_output_file'] = 'w69b.barcode.min.js';
  config['entry_point'] = 'main';

  return gulp.src(PATHS.src.closure)
    .pipe(closureCompiler(config))
    .pipe(gulp.dest('dist'));
});

gulp.task('compile:worker', function() {
  const config = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
  config['js_output_file'] = 'w69b.barcode.decodeworker.min.js';
  config['entry_point'] = 'decodeworker';

  return gulp.src(PATHS.src.closure)
    .pipe(closureCompiler(config))
    .pipe(gulp.dest('dist'));
});

gulp.task('compile', gulp.parallel('compile:main', 'compile:worker'));

gulp.task('all', gulp.series('shader2js', 'compile', 'test'));

gulp.task('default', gulp.series('clean', 'all'));