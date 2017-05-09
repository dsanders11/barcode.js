// (c) 2013 Manuel Braun (mb@w69b.com)
'use strict';
var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var format = require('gulp-clang-format');
var karma = require('karma');
var concat = require('gulp-concat');
var sort = require('gulp-sort');
var shader2js = require('./tasks/shader2js');
var sourcemaps = require('gulp-sourcemaps');
var webserver = require('gulp-webserver');
var closureCompiler = require('google-closure-compiler').gulp(
  {extraArguments: ['-XX:+TieredCompilation']});
// Adds gulp tag, and gulp bump tasks,
// see https://github.com/lfender6445/gulp-release-tasks
require('gulp-release-tasks')(gulp);


var PATHS = {
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
      'src/**/*.js'
    ],
  },
  dst: {
    shaders: 'src/w69b/webgl/shaders/'
  }
};

var CLOSURE_CONFIG = {
  assume_function_wrapper: true,
  externs: [
    'externs/iconv.js',
    'externs/canvas_image_source.js'
  ],
  generate_exports: true,
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  language_in: 'ECMASCRIPT6_STRICT',
  language_out: 'ECMASCRIPT5_STRICT',
  dependency_mode: 'STRICT',
  hide_warnings_for: [
    'node_modules/',
    '[synthetic',
    'spellcheck',
    'ui'
  ],
  isolation_mode: 'IIFE',
  warning_level: 'VERBOSE',
  jscomp_warning: [
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
    'nonStandardJsDocs',
    // 'reportUnknownTypes',
    'undefinedNames',
    'undefinedVars',
    'unknownDefines',
    'unusedLocalVariables',
    'unusedPrivateMembers',
    'uselessCode',
    'underscore',
    'visibility'
  ]
};

var CLOSURE_DEBUG_CONFIG = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
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

gulp.task('coverage', ['buildDebug'], function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true,
    preprocessors: {
      '**/*.js': ['sourcemap'],
      'dist/**/*.js': ['sourcemap', 'coverage']
    },
    reporters: ['progress', 'coverage', 'karma-remap-istanbul']
  }, done).start();
});

gulp.task('test', ['buildDebug'], function(done) {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('shader2js', function() {
  return gulp.src(PATHS.src.shaders, {base: 'src'})
    .pipe(sort())
    .pipe(shader2js())
    .pipe(concat('compiled.js'))
    .pipe(gulp.dest(PATHS.dst.shaders))
});

gulp.task('watch', ['buildDebug'], function() {
  gulp.watch(PATHS.src.shaders.concat(PATHS.src.closure), ['buildDebug']);
  gulp.src('.')
    .pipe(webserver({
      host: '0.0.0.0',
      livereload: false,
      directoryListing: true
    }));
});

gulp.task('buildDebug:main', ['shader2js'], function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_DEBUG_CONFIG));
  config['js_output_file'] = 'w69b.barcode.js';
  config['entry_point'] = 'main';

  return gulp.src(PATHS.src.closure)
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(config))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildDebug:worker', ['shader2js'], function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_DEBUG_CONFIG));
  config['js_output_file'] = 'w69b.barcode.decodeworker.js';
  config['entry_point'] = 'worker';

  return gulp.src(PATHS.src.closure)
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(config))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildDebug', ['buildDebug:main', 'buildDebug:worker']);

gulp.task('compile:main', function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
  config['js_output_file'] = 'w69b.barcode.min.js';
  config['entry_point'] = 'main';

  return gulp.src(PATHS.src.closure)
    .pipe(closureCompiler(config))
    .pipe(gulp.dest('dist'));
});

gulp.task('compile:worker', function() {
  var config = JSON.parse(JSON.stringify(CLOSURE_CONFIG));
  config['js_output_file'] = 'w69b.barcode.decodeworker.min.js';
  config['entry_point'] = 'worker';

  return gulp.src(PATHS.src.closure)
    .pipe(closureCompiler(config))
    .pipe(gulp.dest('dist'));
});

gulp.task('compile', ['compile:main', 'compile:worker']);

gulp.task('all', function(cb) {
  runSequence('shader2js', 'compile', 'test', cb);
});

gulp.task('default', function(cb) {
  runSequence('clean', 'all', cb);
});
