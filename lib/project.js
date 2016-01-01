'use strict';
var EventEmitter = require('events');
var path = require('./path');
var gulp = require('gulp');
var babel = require('gulp-babel');
var Watch = require('./watch');
var chokidar = require('chokidar');
var sourcemaps = require('gulp-sourcemaps');
var fs = require('fs');
var del = require('del');
var path = require('path');
var walk = require('walk');
var replace = require('gulp-replace');
var mkdir = require('mkdirp');
var colors = require('colors');
var serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};
var defaultConfig = {
    name: '悦图',
    proxyRoot: '',
    localPath: '/Users/bairedzhang/Dropbox/tencent/frontend/apps/photo',
    serverPath: '/frontend/apps/photo',
    require: {
        babel: {
            "presets": ['es2015'],
            "plugins": ['transform-react-jsx', 'transform-es2015-modules-amd']
        },
        watch: {
            upload: true,
            babel: true
        },
        build: {
            babel: true,
            upload: true
        }
    },
    method: 'watch'
};
class Project extends EventEmitter {
    constructor(opts) {
        super(opts);
        var config = Object.create(defaultConfig);
        this.config = Object.assign(config, opts);
        this.config.glob = {
            all: config.localPath + '/**/*',
            src: config.localPath + '/**/*.js',
            build: config.proxyRoot + config.serverPath
        };
        EventEmitter.call(this);
        this.init();
    }

    init() {
        var config = this.config;
        this.initCompileConfig();
        console.log(config.method);
        this[config.method]();
        this.events();
    }

    initCompileConfig() {
        var config = this.config;
        var babelConfig = config.compile.babel;
        (config.babelConfig = {}).presets = babelConfig.presets.map(function (item) {
            return require('babel-preset-' + item);
        });
        config.babelConfig.plugins = babelConfig.plugins.map(function (item) {
            return require('babel-plugin-' + item);
        });
    }

    events() {
        this.on('start', function () {
            console.log('------ start ------');
        });
    }

    watch() {
        console.log('watch start'.red, this.config);
        var config = this.config;
        this.watcher = Watch.create(config);
    }

    build() {

    }
}

module.exports = Project;
