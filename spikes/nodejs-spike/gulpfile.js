'use strict';

let gulp = require('gulp');
let jasmine = require('gulp-jasmine');
//let nyc = require('nyc');
let istanbul = require('gulp-istanbul');
let eslint = require('gulp-eslint');

// Workaround to make sure gulp exits on successful test run.
// gulp.doneCallback = (err) => {
//     process.exit(err ? 1 : 0);
gulp.doneCallback = () => {
    process.kill(process.pid);
};

gulp.task('pre-test', () =>{
    return gulp.src(['core/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

// Run tests
gulp.task('run-tests-with-coverage', ['pre-test'], () => {
    return gulp.src('spec/**/*.js')
        .pipe(jasmine())
        .pipe(istanbul.writeReports());
        //.pipe(nyc({}));
});

gulp.task('run-tests', () => {
    return gulp.src('spec/**/*.js')
        .pipe(jasmine());
        //.pipe(nyc({}));
});

gulp.task('run-eslint', () => {
    return gulp.src(['*.js', 'core/**/*.js', 'spec/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});