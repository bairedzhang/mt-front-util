'use strict';
var gulp = require('gulp');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var fs = require('fs');
var replace = require('gulp-replace');
var compile = function(path, config, cb) {
    log('compiling'.info, path.replace(config.localPath,'').yellow);
    var isFrontendMods = /frontend([\\/])mods\1([^\\/]+)\1\2\.js$/g.test(path);
    var prefix = isFrontendMods ? 'm_' : '';
    var mods = prefix + (isFrontendMods
            ? path.replace(/^.*?([^\\\/]+\.js)/g, '$1')
            : path.replace(config.localPath, '').replace(/\\/g, '/').substr(1)).replace(/\.js$/g, '');
    var file = fs.readFileSync(path, {encoding: 'utf8'});
    if (/\.js$/g.test(path) && !/define\(/g.test(file) && path.indexOf('core.js') < 0 && path.indexOf('inc.js') < 0) {
        var stream = gulp.src(path, {base: config.localPath})
            .pipe(sourcemaps.init())
            .pipe(babel(config.babelConfig))
            .pipe(sourcemaps.write())
            .pipe(replace(/'use strict';/g, ''))
            .pipe(replace(/(define\(.*?)[']*exports[']*,/g, '$1'))
            .pipe(replace(/(define\(.*?)exports,/g, '$1'))
            .pipe(replace(/(define\()([^\}]*?\)\s*\{)/g, "$1'" + mods + "', $2\n    'use strict';\n     var exports = {};\n"))
            .pipe(replace(/(}\);(.|\n|\r|\t)\/\/#.*?sourceMappingURL)/gm, 'return exports;\n$1'))
            .pipe(gulp.dest(config.glob.build));
        stream.on('end', function () {
            cb && cb(config.proxyRoot + config.serverPath + path.replace(config.localPath, ''));
        }.bind(this));
    } else {
        copy(path, config);
    }
};

var copy = function(path, config) {
    log('no compile'.info, path.replace(config.localPath, '').yellow);
    gulp.src(path, {base: config.localPath})
        .pipe(gulp.dest(config.glob.build));

};

exports.compile = compile;
exports.copy = copy;
