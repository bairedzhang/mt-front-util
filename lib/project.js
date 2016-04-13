'use strict';
const EventEmitter = require('events');
const Watch = require('./watch');
const Build = require('./build');
const path = require('./path');
const PATH = require('path');
class Project extends EventEmitter {
    constructor(opts) {
        super(opts);
        let config = this.config = opts;
        config.localPath = path.resolve(config.localPath);
        config.proxyRoot = path.resolve(config.proxyRoot);
        config.glob = {
            all: config.localPath + '/**/*',
            css: path.resolve(PATH.join(config.localPath, config.cssProPath, 'src')),
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
            if (typeof item == 'string') {
                return require('babel-plugin-' + item);
            } else {
                return [require('babel-plugin-' + item[0]), item[1]];
            }
        });
        config.babelConfig.sourceMaps = 'inline';
    }

    events() {
    }

    watch() {
        log('watch start'.red, this.config.name);
        let config = this.config;
        this.watcher = Watch.create(config);
    }

    close() {
        log('watch close'.red, this.config.name);
        this.watcher && this.watcher.close();
    }

    build() {
        this.builder.run();
    }

    compile() {
        this.builder.run(false);
    }
}

module.exports = Project;
