'use strict';
 
const gulp = require('gulp');
const sass = require('gulp-sass');
const watchSass = require("gulp-watch-sass");
 
gulp.task('sass', function () {
  return gulp.src('./www/scss/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./www/css'));
});
 
gulp.task("sass:watch", () => watchSass([
  "./www/scss/**/*.{scss,css}",
  "!./public/libs/**/*"
])
  .pipe(sass())
  .pipe(gulp.dest("./www/css/")));

gulp.task('default', ['sass'], function() {
  //other stuff
});