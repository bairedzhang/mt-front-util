'use strict';
const EventEmitter = require('events');
const Watch = require('./watch');
const Build = require('./build');
const path = require('./path');
const PATH = require('path');
const release = require('./release');
const walk = require('walk');
const fs = require('fs');
class Project extends EventEmitter {
    constructor(opts) {
        super(opts);
        let config = this.config = opts;
        config.localPath = path.resolve(config.localPath);
        config.proxyRoot = path.resolve(config.proxyRoot);
        config.watching = false;
        config.building = false;
        config.glob = {
            all: config.localPath + '/**/*',
            css: path.resolve(PATH.join(config.localPath, config.cssProPath, 'src')),
            build: config.proxyRoot + config.serverPath
        };
        config.release = Object.assign({}, config.release, {
            mods_path: config.localFrontendMods
        });
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
            let plugin_name = item, plugin_opts = {mods_path: config.localFrontendMods};
            if (typeof item != 'string') {
               plugin_name = item[0];
               plugin_opts = Object.assign(plugin_opts, item[1] || {});
            }
            return [require('babel-plugin-' + plugin_name), plugin_opts];
        });
        config.babelConfig.sourceMaps = 'inline';
    }

    events() {
    }

    watch() {
        log('watch start'.red, this.config.name);
        let config = Object.assign(this.config, {watching: true});
        this.watcher = Watch.create(config);
    }

    release() {
        let dist = this.config.localPath + '/release';
        let ver = this.config.releaseVer;
        let options = {
            listeners: {
                file: function (root, fileStats, next) {
                    let filePath = path.resolve(PATH.join(root, fileStats.name));
                    if (ver) {
                        fs.renameSync(filePath, filePath.replace(/(.*)\.js$/g, `$1-${ver}.js`));
                    }
                    next();
                }
            }
        };

        release(this.config, dist, (data) => {
            log('release success\n'.green, ((ver ? `${ver}@` : '') + JSON.stringify(data.jsMap)).yellow);
            walk.walk(dist, options);
        });
    }

    close() {
        log('watch close'.red, this.config.name);
        this.watcher && this.watcher.close();
    }

    build() {
        this.config.building = true;
        this.builder.run();
    }

    compile() {
        this.config.building = true;
        this.builder.run(false);
    }
}

module.exports = Project;
