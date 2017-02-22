// (c) 2013 Manuel Braun (mb@w69b.com)
'use strict';
require('harmonize')();
var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var debug = require('gulp-debug');
var format = require('gulp-clang-format');
var karma = require('karma');
var concat = require('gulp-concat');
var size = require('gulp-size');
var sort = require('gulp-sort');
var through = require('through2');
var shader2js = require('./tasks/shader2js');
var webserver = require('gulp-webserver');
var closureDeps = require('gulp-closure-deps');
var closureList = require('gulp-closure-builder-list');
var wrap = require('gulp-wrap');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var plovr = require('gulp-plovr');
var gulp = require('gulp');
// Adds gulp tag, and gulp bump tasks,
// see https://github.com/lfender6445/gulp-release-tasks
require('gulp-release-tasks')(gulp);


var PATHS = {
  src: {
    js: ['src/**/*.js'],
    checkFormat: [
      'src/**/*.js'
    ],
    shaders: ['src/w69b/webgl/shaders/*.{vs,fs}'],
    closureBase: 'node_modules/google-closure-library/closure/goog/base.js',
    closure: [
      'node_modules/google-closure-library/closure/goog/**/*.js',
      'node_modules/google-closure-library/third_party/**/*.js',
      'src/**/*.js'
    ],
    plovr: ['plovr-decodeworker-productive.json', 'plovr-productive.json'],
  },
  dst: {
    shaders: 'src/w69b/webgl/shaders/'
  }
};

gulp.task('clean', function() {
  return del(['dist']);
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


function buildDebug(module) {
  var bundleStream = through.obj();
  var fileList;

  var getFiles = through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      cb(new gutil.PluginError('buildDebug', 'Streaming not supported'));
      return;
    }
    fileList = file.contents.toString().split('\n');
    cb();
  });

  var es = require('event-stream');

  var str = gulp.src(PATHS.src.closure)
    .pipe(closureDeps({
      prefix: '',
      baseDir: '.'
    }))
    .pipe(closureList({
      entryPoint: module,
    }))
    .pipe(getFiles)
    .on('end', function() {
      gulp.src([PATHS.src.closureBase].concat(fileList), { base: '.' })
        .pipe(bundleStream);
    });
  return es.duplex(str, es.merge(bundleStream, str));
}

var closureDebugWrapper = 'self.CLOSURE_NO_DEPS = true;\n<%= contents %>';
/**
 * Build library simply by concatenating all files.
 */
gulp.task('buildDebug:main', ['shader2js'], function() {
  return buildDebug('main')
    .pipe(sourcemaps.init())
    .pipe(concat('w69b.qrcode.js'))
    .pipe(wrap(closureDebugWrapper))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildDebug:worker', ['shader2js'], function() {
  return buildDebug('w69b.qr.DecodeWorker')
    .pipe(sourcemaps.init())
    .pipe(concat('w69b.qrcode.decodeworker.js'))
    .pipe(wrap(closureDebugWrapper))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('buildDebug', ['buildDebug:main', 'buildDebug:worker']);


gulp.task('compile', function() {
  // It might look odd to use plovr instead of using closure compiler directly here.
  // However there is no easy way to disable some advanced compilation options that degrate
  // performance significantly with closure compiler directy.
  return gulp.src(PATHS.src.plovr)
    .pipe(plovr({
      plovr_path: 'node_modules/plovr/bin/plovr.jar',
      debug: true
    }));
});

gulp.task('all', function(cb) {
  runSequence('shader2js', 'compile', 'test', cb);
});

gulp.task('default', function(cb) {
  runSequence('clean', 'all', cb);
});
