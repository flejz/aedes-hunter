'use strict';
const
  gulp    = require('gulp'),
  eslint  = require('gulp-eslint'),
  notify  = require('gulp-notify'),
  plumber = require('gulp-plumber'),
  mocha   = require('gulp-mocha');


gulp.task('test', function() {
  return gulp.
    src(['../test/**/*.js'])
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(mocha())
    .once('error', function(err) {
      this.emit('end');
    });
});

gulp.task('watch', function() {
  gulp.watch(['./*.js', './**/*.js', '../test/**/*.js'], ['test']);
})

gulp.task('lint', function () {
  return gulp.src(['!vendor/**/*.js', './*.js', './**/*.js', '../test/**/*.js'])
      // eslint() attaches the lint output to the eslint property
      // of the file object so it can be used by other modules.
      .pipe(eslint())
      // eslint.format() outputs the lint results to the console.
      // Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      // To have the process exit with an error code (1) on
      // lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError());
});
