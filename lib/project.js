'use strict';
const EventEmitter = require('events');
const Watch = require('./watch');
const Build = require('./build');
class Project extends EventEmitter {
    constructor(opts) {
        super(opts);
        let config = this.config = opts;
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
        this.initCompileConfig();
        this.events();
    }

    initCompileConfig() {
        let config = this.config;
        let babelConfig = config.compile.babel;
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
        let config = this.config;
        this.watcher = Watch.create(config);
    }

    close() {
        log('watch close'.red, this.config.name);
        this.watcher.close();
    }

    build() {
        this.builder.run();
    }

    upload() {

    }
}

module.exports = Project;
