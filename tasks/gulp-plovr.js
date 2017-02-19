'use strict';

var fs = require('fs');
var path = require('path');
var File = require('vinyl');
var through = require('through2');
var gutil = require('gulp-util');
var spawn = require('child_process').spawn;

// Consts
var PLUGIN_NAME = 'gulp-plovr';
var JAVA_PATH   = 'java';
var PLOVR_PATH   = path.join(__dirname, 'vendor/plovr-81ed862.jar');

// Plugin level function(dealing with files)
function gulpPlovr(opts) {
  opts = opts || { };
  
  if (!opts.java_path) opts.java_path = JAVA_PATH;
  if (!opts.plovr_path) opts.plovr_path = PLOVR_PATH;
  if (!opts.plovr_args) opts.plovr_args = {};
  if (opts.debug) gutil.log(PLUGIN_NAME + ':', 'debug mode is enabled!');

  // Creating a stream through which each file will pass
  function bufferContents(file, enc, cb) {
    var that = this;
    if (file.isNull()) {
      // return empty file
      cb(null, file);
    }
    
    //var baseDir = path.dirname(module.parent.filename);
    var filePath = path.dirname(file.path);
    var configPath = file.path;
    
    if (file.isBuffer()) {
      var args = [];
      args.push('-jar');
      args.push(opts.plovr_path);
            
      args.push('build');
      args.push(configPath);

      Object.keys(opts.plovr_args).forEach(function(key) {
        var value;
        value = opts.plovr_args[key];
        args.push("--" + key);
        return args.push(value);
      });

      var compiler = spawn(opts.java_path, args);
      var stdout = '';
      var stderr = '';
      compiler.stdout.setEncoding('utf8');
      compiler.stderr.setEncoding('utf8');
      compiler.stdout.on('data', function(data) {
        //if (opts.debug) gutil.log(PLUGIN_NAME + ':', data);
        return stdout += data;
      });
      
      compiler.stderr.on('data', function(data) {
        if (opts.debug) gutil.log(data);
        return stderr += data;
      });
      
      compiler.on('exit', function(code) {
        if (code !== 0) {
          this.emit('error', new gutil.PluginError(PLUGIN_NAME, stderr));
        }

        if (opts.out_path) {
            var outputFile = new File();
            outputFile.path = opts.out_path;
            outputFile.contents = new Buffer(stdout);
            that.push(outputFile);
        }

        cb();
      });
      
//      compiler.on('close', function(code) {
//        if (opts.debug) gutil.log(stderr);
//      });
    }
    
    if (file.isStream()) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      cb();
    }
  }

  function endStream(cb) {
    var outputFile = new File("fuck.out");
    cb();
  }

  return through.obj(bufferContents);
};

// Exporting the plugin main function
module.exports = gulpPlovr;
