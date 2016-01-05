'use strict';
const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const fs = require('fs');
const replace = require('gulp-replace');
let compile = function(path, config, cb) {
    if (/\.js$/g.test(path) && path.indexOf('core.js') < 0 && path.indexOf('inc.js') < 0) {
        log('compiling'.info, path.replace(config.localPath,'').yellow);
        let stream = gulp.src(path, {base: config.localPath})
            .pipe(sourcemaps.init())
            .pipe(babel(config.babelConfig))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(config.glob.build));
        stream.on('end', function () {
            cb && cb(config.proxyRoot + config.serverPath + path.replace(config.localPath, ''));
        }.bind(this));
    } else {
        copy(path, config);
    }
};

let copy = function(path, config) {
    if(/\.DS_Store$/.test(path)) {
        return ;
    }
    log('no compile'.info, path.replace(config.localPath, '').yellow);
    gulp.src(path, {base: config.localPath})
        .pipe(gulp.dest(config.glob.build));

};

exports.compile = compile;
exports.copy = copy;
