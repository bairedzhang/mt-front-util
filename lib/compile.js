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
        try {
            var sourceRoot = 'MT:///sourcemap/' + Path.dirname(Path.relative(config.localPath, path));
            var babelConfig = Object.assign({}, config.babelConfig, {
                sourceRoot: sourceRoot,
                compact: false
            });
            var result = babel.transformFileSync(path, babelConfig);
            if (!result.code) {
                return copy(path, config);
            }
            fs.writeFileSync(dist, result.code, {encoding: 'utf8'});
            log('compiled'.red, path.replace(config.localPath, '').warn);
            cb && cb(dist);
        } catch (e) {
            console.log(e.stack);
        }
    } else {
        copy(path, config, cb);
    }
    compiling = false;
    doCompile();
};

let copy = function (path, config, cb) {
    if (/(\.DS_Store$)/.test(path)) {
        return;
    }
    let dist = path.replace(config.localPath, config.glob.build);
    log('copy'.prompt, path.replace(config.localPath, '').yellow);
    fs.writeFileSync(dist, fs.readFileSync(path, {encoding: 'utf8'}), {encoding: 'utf8'});
    cb && cb(dist);
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
