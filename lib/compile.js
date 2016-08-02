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
const uploader = require('./upload');
const noop = function () {
};
let queue = [];
let compiling = false;
let bundle = function (config) {
    //TODO 这里的一坨需要整理优化
    log('buiding:    '.red, config.building);
    log('watching:    '.red, config.watching || '');
    let dist = PATH.resolve(config.localPath + '/.tmp');
    let releaseConfigPath = config.release.configPath;
    log('js changed bundling.....'.yellow);

    let up = function (localPath, filePath) {
        uploader.upload(localPath, filePath, function () {
            log('uploaded'.info, filePath.replace(config.serverRoot, '').yellow);
            event.emit('message', 'upload succeed', filePath.replace(config.serverRoot, ''));
        }.bind(this), noop);
    };

    let setMTConfig = (jsmap) => {
        // let reg = /[\r\t\n](.*)\/\/release-js-map/gi;
        let releaseConfig = `
            jsmap:${JSON.stringify(jsmap)},
            staticPath: '${Path.join(config.serverPath, 'release')}',
        `;
        let configPath = Path.join(config.localPath, releaseConfigPath);
        let serverPath = Path.join(config.serverRoot, config.serverPath, releaseConfigPath);
        fs.writeFileSync(configPath, releaseConfig, {encoding: 'utf8'});
        copy(configPath, config, file=> {
        });
        if (config.building) {
            if (config.filter && config.filter.length) {
                config.filter.forEach((item) => {
                    let path = configPath.replace(config.localPath, '');
                    if (new RegExp(item.reg).test(path)) {
                        up(configPath, config.serverRoot + item.dist + '/' + Path.basename(path));
                        if (item.local) {
                            let dist = item.local + '/' + Path.basename(path);
                            fs.writeFileSync(dist, fs.readFileSync(path));
                            log('async to'.red, dist.green);
                        }
                    }
                })
            } else {
                up(configPath, serverPath);
            }
        }
    };

    let options = {
        listeners: {
            file: function (root, fileStats, next) {
                let filePath = PATH.resolve(Path.join(root, fileStats.name));
                let serverPath = PATH.resolve(Path.join(config.serverRoot, config.serverPath, 'release', filePath.replace(dist, '')));
                copy(filePath, config, file=> {
                }, dist, config.glob.build + '/release');
                if (config.building) {
                    up(filePath, serverPath);
                }
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
    } else if (path.indexOf(cssProPath + '/src') < 0 && path.indexOf(cssProPath + '/dest/src') < 0) {
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
    let realChange = !checkSame(data, dist);
    if (realChange && data.length) {
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
