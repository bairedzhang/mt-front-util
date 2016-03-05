'use strict'
const uploader = require('./upload.js');
const chokidar = require('chokidar');
const fs = require('fs');
const del = require('del');
const Path = require('./path');
const util = require('./compile');

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

    upload(path) {
        log('changed'.yellow, path.yellow);
        path = Path.resolve(path);
        let config = this.config;
        let filePath = path.replace(config.proxyRoot, config.serverRoot);
        uploader.upload(path, filePath, function () {
            log('uploaded'.info, filePath.replace(config.serverRoot, '').yellow);
            event.emit('message', 'upload succeed', filePath.replace(config.serverRoot, ''));
        }.bind(this), noop);
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
