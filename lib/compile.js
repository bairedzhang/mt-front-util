'use strict';
const babel = require('babel-core');
const fs = require('fs');
const Path = require('path');
const mkdir = require('mkdirp');
let compile = function (path, config, cb) {
    if (/\.js$/g.test(path) && path.indexOf('core.js') < 0 && path.indexOf('inc.js') < 0) {
        log('compiling'.info, path.replace(config.localPath, '').yellow);
        babel.transformFile(path, config.babelConfig, function (err, result) {
            let dist = path.replace(config.localPath, config.glob.build);
            let dir = Path.dirname(dist);
            if(!fs.existsSync(dir)) {
               mkdir(dir);
            }
            fs.writeFileSync(dist, result.code, {encoding: 'utf8'});
            log('compile success'.info, dist.warn);
            cb && cb(dist);
        })

        //let stream = gulp.src(path, {base: config.localPath})
        //    .pipe(sourcemaps.init())
        //    .pipe(babel(config.babelConfig))
        //    .pipe(sourcemaps.write())
        //    .pipe(gulp.dest(config.glob.build));
        //stream.on('end', function () {
        //    cb && cb(config.proxyRoot + config.serverPath + path.replace(config.localPath, ''));
        //}.bind(this));
    } else {
        copy(path, config);
    }
};

let copy = function (path, config) {
    if (/\.DS_Store$/.test(path)) {
        return;
    }
    log(path.info);
    var dist = path.replace(config.localPath, config.glob.build);
    log('no compile'.info, path.replace(config.localPath, '').yellow);
    fs.writeFileSync(dist, fs.readFileSync(path, {encoding: 'utf8'}), {encoding: 'utf8'});
};

exports.compile = compile;
exports.copy = copy;
