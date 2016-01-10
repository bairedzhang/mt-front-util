'use strict';
const babel = require('babel-core');
const fs = require('fs');
const Path = require('path');
const mkdir = require('mkdirp');
let queue = [];
let compiling = false;
let compile = function (path, config, cb) {
    compiling = true;
    let dist = path.replace(config.localPath, config.glob.build);
    let dir = Path.dirname(dist);
    if (!fs.existsSync(dir)) {
        mkdir.sync(dir);
    }
    if (/\.js$/g.test(path) && path.indexOf('core.js') < 0 && path.indexOf('inc.js') < 0) {
        var result = babel.transformFileSync(path, config.babelConfig);
        fs.writeFileSync(dist, result.code, {encoding: 'utf8'});
        log('compiled'.red, path.replace(config.localPath, '').warn);
        cb && cb(dist);
        //let stream = gulp.src(path, {base: config.localPath})
        //    .pipe(sourcemaps.init())
        //    .pipe(babel(config.babelConfig))
        //    .pipe(sourcemaps.write())
        //    .pipe(gulp.dest(config.glob.build));
        //stream.on('end', function () {
        //    cb && cb(config.proxyRoot + config.serverPath + path.replace(config.localPath, ''));
        //}.bind(this));
    } else {
        copy(path, config);
    }
    compiling = false;
    doCompile();
};

let copy = function (path, config) {
    if (/\.DS_Store$/.test(path)) {
        return;
    }
    let dist = path.replace(config.localPath, config.glob.build);
    let dir = Path.dirname(dist);
    log('copy'.prompt, path.replace(config.localPath, '').yellow);
    fs.writeFileSync(dist, fs.readFileSync(path, {encoding: 'utf8'}), {encoding: 'utf8'});
};

let doCompile = function () {
    if (queue.length && !compiling) {
        compile.apply(this, queue.shift());
    }
}
exports.compile = function () {
    var args = [].slice.call(arguments);
    queue.push(args);
    doCompile();
};
exports.copy = copy;
