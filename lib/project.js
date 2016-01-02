'use strict';
var EventEmitter = require('events');
var Watch = require('./watch');
var Build = require('./build');
var serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};
class Project extends EventEmitter {
    constructor(opts) {
        super(opts);
        var config = this.config = opts;
        config.glob = {
            all: config.localPath + '/**/*',
            src: config.localPath + '/**/*.js',
            build: config.proxyRoot + config.serverPath
        };
        this.builder = new Build(config);
        EventEmitter.call(this);
        this.init();
    }

    init() {
        var config = this.config;
        this.initCompileConfig();
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
        });
    }

    watch() {
        log('watch start'.red, this.config.name);
        var config = this.config;
        this.watcher = Watch.create(config);
    }

    close() {
        log('watch close'.red, this.config.name);
        this.watcher.close();
    }

    build() {
        this.builder.run();
    }
}

module.exports = Project;
