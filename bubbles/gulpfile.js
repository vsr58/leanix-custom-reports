var gulp = require('gulp');
var serve = require('gulp-serve');
var concat = require('gulp-concat');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('copy', function() {
  return gulp.src(['./src/index.html', './src/index.js'])
    .pipe(gulp.dest('./dist/'));
});

gulp.task('dist', ['copy'], function() {
  return gulp.src([
      './node_modules/jquery/dist/jquery.js',
      './node_modules/lodash/index.js',
      './node_modules/d3/d3.js'
    ])
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', ['dist'], function() {

    browserSync({
        notify: false,
        logPrefix: 'BS',
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: ['dist']
    });

    // Watch .html files
    gulp.watch('src/*.*', ['dist', reload]);
});