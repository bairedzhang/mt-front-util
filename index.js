'use strict'
var gulp = require('gulp');
var babel = require('gulp-babel');
var uploader = require('./lib/upload.js');
var chokidar = require('chokidar');
var sourcemaps = require('gulp-sourcemaps');
var fs = require('fs');
var del = require('del');
var path = require('path');
var walk = require('walk');
var replace = require('gulp-replace');
var mkdir = require('mkdirp');
var proxy = require('./lib/proxy.js');
var colors = require('colors');
var serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

var send = noop;
var project = {
    'name': 'test',
    'localPath': '',
    'serverPath': '',
    'proxyRootPath': '',
    'require': {
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
           upload: true,
           configPath : ''
       },
       proxy: {
           port: 8088,
           map: {
               'g': 'info|webapp_info'
           }
       }
    }
}
var noop = function () {
};
class Watcher {
    constructor(data) {
        this.config = {};
        Object.assign(this.config, data);
        this.init();
    }

    init() {
        var config = this.config;
        this.glob = {
            all: config.rootPath + '/**/*',
            src: config.rootPath + '/**/*.js',
            build: config.proxyRoot + config.fullServerPath.replace(/.*\/webapps/g, '')
        };
        console.log('-----build path-----'.debug, this.glob.build);
        mkdir(this.glob.build);
        config.babelConfig = {
            "presets": ['es2015'],
            "plugins": ['transform-react-jsx', 'transform-es2015-modules-amd']
        };
        config.babelConfig.presets = config.babelConfig.presets.map(function (item) {
            return require('babel-preset-' + item);
        });
        config.babelConfig.plugins = config.babelConfig.plugins.map(function (item) {
            return require('babel-plugin-' + item);
        });
        this.watchStatus = false;
        return this;
    }

    start() {
        console.log('-------watch start---------'.debug, this.config.name);

        this.watcher = chokidar.watch(this.glob.all, {ignoreInitial: true});
        this.watchStatus = true;
        this.events();
    }

    stop() {
        console.log('-------stop watch------', this.config.name)
        this.watcher && this.watcher.close();
        this.watchStatus = false;
    }

    compile(path) {
        var config = this.config;
        var glob = this.glob;
        var isFrontendMods = /frontend([\\/])mods\1([^\\/]+)\1\2\.js$/g.test(path);
        var prefix = isFrontendMods ? 'm_' : '';
        var mods = prefix + (isFrontendMods
                        ? path.replace(/^.*?([^\\\/]+\.js)/g, '$1')
                        : path.replace(config.rootPath, '').replace(/\\/g, '/').substr(1)).replace(/\.js$/g, '');
        console.log(path, prefix, mods);
        var file = fs.readFileSync(path, {encoding: 'utf8'});
        if (/\.js$/g.test(path) && !/define\(/g.test(file) && path.indexOf('core.js') < 0 && path.indexOf('inc.js') < 0) {
            //send('file:status', {path: path, status: 'compiling', name: this.config.name});
            var stream = gulp.src(path, {base: config.rootPath})
                .pipe(sourcemaps.init())
                .pipe(babel(config.babelConfig))
                .pipe(sourcemaps.write())
                .pipe(replace(/'use strict';/g, ''))
                .pipe(replace(/(define\(.*?)[']*exports[']*,/g, '$1'))
                .pipe(replace(/(define\(.*?)exports,/g, '$1'))
                .pipe(replace(/(define\()([^\}]*?\)\s*\{)/g, "$1'" + mods + "', $2\n    'use strict';\n     var exports = {};\n"))
                .pipe(replace(/(}\);(.|\n|\r|\t)\/\/#.*?sourceMappingURL)/gm, 'return exports;\n$1'))
                .pipe(gulp.dest(glob.build));
            stream.on('end', function () {
              //  send('file:status', {path: path, status: 'compiled', name: this.config.name});
            }.bind(this));
        } else {
            console.log('----- no babel -----', path);
            gulp.src(path, {base: config.rootPath})
                .pipe(gulp.dest(glob.build));
        }
    }

    build() {
        del(this.glob.build + '/**/*');
        var self = this;
        var options = {
            listeners: {
                file: function (root, fileStats, next) {
                    var filePath = path.join(root, fileStats.name);
                    self.compile(filePath);
                    console.log('-----file path -----', path.join(root, fileStats.name));
                    next();
                }
            }
        };
        var walker = walk.walk(this.config.rootPath, options);
    }

    uploadAll() {
        var self = this;
        var options = {
            listeners: {
                file: function (root, fileStats, next) {
                    var filePath = path.join(root, fileStats.name);
                    self.upload(filePath);
                    console.log('-----file path -----', path.join(root, fileStats.name));
                    next();
                }
            }
        };
        var walker = walk.walk(this.config.rootPath, options);
    }

    upload(path) {
        var filePath = serverRealPath(path.replace(this.config.rootPath, this.config.fullServerPath));
        //send('file:status', {path: path, status: 'uploading', name: this.config.name});
        uploader.upload(path, filePath, function () {
            console.log('upload succeed');
            //send('file:status', {path: path, status: 'uploaded', name: this.config.name});
        }.bind(this), noop);
    }

    del(path) {
        //fs.unlinkSync(path.replace('src', 'build'));
    }

    rmdir(path) {
        //fs.rmdirSync(path.replace('src', 'build'));
    }

    change(path) {
        this.compile(path);
    }

    events() {
        var watcher = this.watcher;

        watcher.on('add', this.change.bind(this));

        watcher.on('change', this.change.bind(this));

        watcher.on('unlink', this.del.bind(this));

        watcher.on('addDir', function () {
        });

        watcher.on('unlinkDir', this.rmdir.bind(this));
    }
}

exports.create = function (data) {
    return new Watcher(data);
};

exports.proxy = proxy;
proxy.start({
   uploadRootPath: '/usr/local/app/resin_bairedzhang/webapps',
   localRootPath: '/tmp/tencent_proxy'
});

var config = {
  "name":"悦图4.0",
  "serverPath":"/frontend/apps/photo",
  "serverFullPath":"",
  "rootPath":"/Users/bairedzhang/Dropbox/tencent/frontend/apps/photo",
  "babelConfig":{"presets":["es2015"],"plugins":["transform-react-jsx","mt-amd"]},
  "fullServerPath":"/usr/local/app/resin_bairedzhang/webapps/frontend/apps/photo",
  "proxyRoot": "/tmp/tencent_proxy"
};

new Watcher(config).start();
