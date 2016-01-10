'use strict';
const walk = require('walk');
const uploader = require('./upload');
const compiler = require('./compile');
const p = require('./path');
const path = require('path');
const del = require('del');
const noop = function () {
};
const serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};

class Build {
    constructor(data) {
        this.config = data;
    }

    run() {
        let config = this.config;
        del(config.glob.build + '/**/*', {force: true});
        let self = this;
        let options = {
            listeners: {
                file: function (root, fileStats, next) {
                    let filePath = p.resolve(path.join(root, fileStats.name));
                    compiler.compile(filePath, config, self.upload.bind(self));
                    next();
                }
            }
        };
        let walker = walk.walk(config.localPath, options);
    }

    upload(path) {
        path = p.resolve(path);
        let config = this.config;
        let filePath = path.replace(config.proxyRoot, config.serverRoot);
        uploader.upload(path, filePath, function () {
            log('uploaded'.info, filePath.replace(config.localPath, '').yellow);
            event.emit('message', 'upload success', filePath.replace(config.localPath, ''));
        }.bind(this), noop);
    }
}

module.exports = Build;
