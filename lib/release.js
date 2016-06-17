'use strict';
const mtBuild = require('mt-build');
const del = require('del');
const fs = require('fs');
let timer = null;
let building = false;
module.exports = function (config, dest, cb) {
    clearTimeout(timer);
    if (building) {
        return false;
    }
    timer = setTimeout(function () {
        building = true;
        log('releasing...'.info);
        let proPath = config.localPath,
            destDir = dest,
            tempDir = destDir + '/temp',
            options = config.release,
            callback = function (err, data) {
                // console.log('callback!!!!!', data);
                del.sync(tempDir + '/**/*', {force: true});
                fs.rmdirSync(tempDir);
                cb && cb(data);
                building = false;
            };
        mtBuild.build(proPath, destDir, options, callback);
    }, 200);
};
