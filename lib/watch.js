'use strict'
var gulp = require('gulp');
var babel = require('gulp-babel');
var uploader = require('./upload.js');
var chokidar = require('chokidar');
var fs = require('fs');
var del = require('del');
var path = require('./path');
var util = require('./compile');
var replace = require('gulp-replace');
var serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};
var noop = function () {
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
    }

    watchCompile() {
        console.log('watch compile'.red, this.config.glob.all.yellow);
        var watcher = this.watchDir.compile = chokidar.watch(this.config.glob.all, {ignoreInitial: true});

        watcher.on('add', this.change.bind(this));

        watcher.on('change', this.change.bind(this));

        watcher.on('unlink', this.del.bind(this));

        watcher.on('addDir', noop);

        watcher.on('unlinkDir', this.rmdir.bind(this));
    }

    watchUpload() {
        console.log('watch build'.red, this.config.glob.build.yellow);
        var watcher = this.watchDir.upload = chokidar.watch(this.config.glob.build + '/**/*', {ignoreInitial: true});
        watcher.on('add', this.upload.bind(this));
        watcher.on('change', this.upload.bind(this));
    }

    upload(path) {
        var config = this.config;
        var filePath = serverRealPath(path.replace(config.porxyRoot, config.severRoot));
        console.log('upload'.red, path.yellow);
        uploader.upload(path, filePath, function () {
            console.log('upload succeed');
        }.bind(this), noop);
    }

    del(path) {
        fs.unlinkSync(path.replace(this.glob.src, this.glob.build));
    }

    rmdir(path) {
        fs.rmdirSync(path.replace(this.glob.src, this.glob.build));
    }

    change(path) {
        console.log('file change'.red, path.yellow);
        if (this.config.watch.indexOf('compile') > -1) {
            util.compile(path, this.config);
        } else {
            util.copy(path, this.config);
        }
    }
}

exports.create = function (data) {
    return new Watcher(data);
};
