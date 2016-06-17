'use strict';
const babel = require('babel-core');
const fs = require('fs');
const Path = require('path');
const mkdir = require('mkdirp');
const PATH = require('./path');
const md5 = require('blueimp-md5');
const release = require('./release');
const del = require('del');
const walk = require('walk');
let queue = [];
let compiling = false;
let bundle = function (config) {
    let dist = config.localPath + '/.tmp';
    log('js changed bundling.....'.yellow);
    let setMTConfig = (jsmap) => {
        let reg = /[\r\t\n](.*)\/\/release-js-map/gi;
        let configPath = Path.join(config.localPath, config.release.page_conf);
        let data = fs.readFileSync(configPath, {encoding: 'utf8'}).replace(reg, `\njsmap:${JSON.stringify(jsmap)},//release-js-map`);
        fs.writeFileSync(configPath, data, {encoding: 'utf8'});
    };

    let options = {
        listeners: {
            file: function (root, fileStats, next) {
                let filePath = Path.resolve(PATH.join(root, fileStats.name));
                log(filePath);
                copy(filePath, config, file=> {
                }, dist, config.glob.build + '/js');
                next();
            }
        }
    };
    release(config, dist, (data) => {
        setMTConfig(data.jsMap);
        walk.walk(dist, options);
    });
};

let compile = function (path, config, cb) {
    compiling = true;
    let dist = PATH.resolve(path.replace(config.localPath, config.glob.build));
    let cssProPath = PATH.resolve(Path.join(config.localPath, config.cssProPath));
    let dir = Path.dirname(dist);
    if (!fs.existsSync(dir)) {
        mkdir.sync(dir);
    }
    if (/\.js$/g.test(path) && path.indexOf('core.js') < 0 && path.indexOf('inc.js') < 0 && path.indexOf(cssProPath) < 0) {
        if (config.release && config.bundle) {
            bundle(config);
        } else {
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
                fs.writeFileSync(dist, result.code);
                log('compiled'.red, path.replace(config.localPath, '').warn);
                cb && cb(dist);
            } catch (e) {
                console.log(e.stack);
            }
        }
    } else if (path.indexOf(cssProPath + '/src') < 0 && path.indexOf(cssProPath + '/dest/src') < 0 && path.indexOf(cssProPath + '/dest/js') < 0) {
        copy(path, config, cb);
    }
    compiling = false;
    doCompile();
};

let checkSame = function (src, dist) {
    return fs.existsSync(dist) && (md5(src) == md5(fs.readFileSync(dist)));
};

let copy = function (path, config, cb, src, dest) {
    if (/(\.DS_Store$)/.test(path)) {
        return;
    }
    let dist = path.replace(src || config.localPath, dest || config.glob.build);
    let dir = Path.dirname(dist);
    if (!fs.existsSync(dir)) {
        mkdir.sync(dir);
    }
    let data = fs.readFileSync(path);
    let realChange = checkSame(data, dist);
    if (!realChange) {
        log('copy'.prompt, path.replace(src || config.localPath, '').yellow);
        fs.writeFileSync(dist, data);
        cb && cb(dist);
    }
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
