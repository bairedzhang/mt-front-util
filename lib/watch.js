'use strict'
const gulp = require('gulp');
const babel = require('gulp-babel');
const uploader = require('./upload.js');
const chokidar = require('chokidar');
const fs = require('fs');
const del = require('del');
const path = require('./path');
const util = require('./compile');
const replace = require('gulp-replace');
const serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};
const noop = function () {
};
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
        let watcher = this.watchDir.compile = chokidar.watch(this.config.glob.all, {ignoreInitial: true});

        watcher.on('add', this.change.bind(this));

        watcher.on('change', this.change.bind(this));

        watcher.on('unlink', this.del.bind(this));

        watcher.on('addDir', noop);

        watcher.on('unlinkDir', this.rmdir.bind(this));
    }

    watchUpload() {
        log('watch build'.info, this.config.glob.build.yellow);
        let watcher = this.watchDir.upload = chokidar.watch(this.config.glob.build + '/**/*', {ignoreInitial: true});
        watcher.on('add', this.upload.bind(this));
        watcher.on('change', this.upload.bind(this));
    }

    upload(path) {
        let config = this.config;
        let filePath = serverRealPath(path.replace(config.proxyRoot, config.serverRoot));
        uploader.upload(path, filePath, function () {
            log('upload succeed'.info, filePath.replace(config.serverRoot, '').yellow);
            event.emit('message', 'upload', filePath.replace(config.serverRoot, ''));
        }.bind(this), noop);
    }

    del(path) {
        fs.unlinkSync(path.replace(this.glob.src, this.glob.build));
    }

    rmdir(path) {
        fs.rmdirSync(path.replace(this.glob.src, this.glob.build));
    }

    change(path) {
        if (this.config.watch.indexOf('compile') > -1) {
            util.compile(path, this.config);
        } else {
            util.copy(path, this.config);
        }
    }

    close() {
        for(let key in this.watchDir) {
            this.watchDir[key].close();
            this.state = false;
        }
    }
}

exports.create = function (data) {
    return new Watcher(data);
};
