'use strict'
const uploader = require('./upload.js');
const chokidar = require('chokidar');
const fs = require('fs');
const del = require('del');
const PATH = require('path');
const Path = require('./path');
const util = require('./compile');
const mtUZ = require('mt-uz');
const release = require('./release');

const noop = function () {
};
var ignoreExp = /[\/\\]\./;
class Watcher {
    constructor(data) {
        this.config = {};
        Object.assign(this.config, data);
        this.init();
    }

    init() {
        this.watchDir = {};
        this.watchCompile();
        this.watchUpload();
        if (this.config.watch.indexOf('css') > -1) {
            this.watchCss();
        }
        this.state = true;
    }

    watchCompile() {
        log('watch compile'.info, this.config.glob.all.yellow);
        let watcher = this.watchDir.compile = chokidar.watch(this.config.glob.all, {
            ignoreInitial: true,
            ignored: ignoreExp
        });

        watcher.on('add', this.change.bind(this));

        watcher.on('change', this.change.bind(this));

        watcher.on('unlink', this.del.bind(this));

        watcher.on('addDir', noop);

        watcher.on('unlinkDir', this.rmdir.bind(this));
    }

    watchUpload() {
        log('watch build'.info, this.config.glob.build.yellow);
        let watcher = this.watchDir.upload = chokidar.watch(this.config.glob.build + '/**/*', {
            ignoreInitial: true
        });
        watcher.on('add', this.upload.bind(this));
        watcher.on('change', this.upload.bind(this));
    }

    watchCss() {
        log('watch css'.info, this.config.glob.css.yellow);
        let watcher = this.watchDir.css = chokidar.watch(this.config.glob.css + '/**/*', {
            ignoreInitial: true
        });
        watcher.on('add', this.cssChange.bind(this));
        watcher.on('change', this.cssChange.bind(this));
    }

    upload(path) {
        log('changed'.yellow, path.yellow);
        path = Path.resolve(path);
        let config = this.config;
        let flag = false;
        let up = function (filePath) {
            uploader.upload(path, filePath, function () {
                log('uploaded'.info, filePath.replace(config.serverRoot, '').yellow);
                event.emit('message', 'upload succeed', filePath.replace(config.serverRoot, ''));
            }.bind(this), noop);
        };
        if (config.filter && config.filter.length) {
            config.filter.forEach((item) => {
                if (new RegExp(item.reg).test(path)) {
                    flag = true;
                    up(config.serverRoot + item.dist + '/' + PATH.basename(path));
                    if (item.local) {
                        let dist = item.local + '/' + PATH.basename(path);
                        fs.writeFileSync(dist, fs.readFileSync(path));
                        log('async to'.red, dist.green);
                    }
                }
            })
        }
        if (!flag) {
            let filePath = path.replace(config.proxyRoot, config.serverRoot);
            up(filePath);
        }
    }

    del(path) {
        var config = this.config;
        var dist = path.replace(config.localPath, config.glob.build)
        fs.unlinkSync(dist);
    }

    rmdir(path) {
        var config = this.config;
        var dist = path.replace(config.localPath, config.glob.build)
        fs.rmdirSync(dist);
    }

    change(path) {
        path = Path.resolve(path);
        if (this.config.watch.indexOf('compile') > -1) {
            util.compile(path, this.config);
        } else {
            util.copy(path, this.config);
        }
    }

    cssChange(path) {
        path = Path.resolve(path);
        log('static change'.info, path.warn);
        let cwd = Path.resolve(PATH.join(this.config.localPath, this.config.cssProPath));
        let onClose = (code) => {
            log(`uz release success & exited with code ${code}`.info);
        };
        mtUZ(cwd, onClose);
    }

    close() {
        for (let key in this.watchDir) {
            this.watchDir[key].close();
            this.state = false;
        }
    }
}

exports.create = function (data) {
    return new Watcher(data);
};
