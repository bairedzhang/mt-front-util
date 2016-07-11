'use strict';
const walk = require('walk');
const uploader = require('./upload');
const compiler = require('./compile');
const p = require('./path');
const PATH = require('path');
const del = require('del');
const mtUZ = require('mt-uz');
const fs = require('fs');
const noop = function () {
};
const serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};

class Build {
    constructor(data) {
        this.config = data;
    }

    run(isUpload) {
        isUpload = typeof isUpload == 'undefined' ? true : isUpload;
        let config = this.config;
        del(config.glob.build + '/**/*', {force: true});
        let self = this;
        let options = {
            listeners: {
                file: function (root, fileStats, next) {
                    let filePath = p.resolve(PATH.join(root, fileStats.name));
                    let ignoreExp = /(\.svn|\.DS_Store$|\.git|\.idea|\.tmp)/g;
                    if (ignoreExp.test(filePath)) {
                        return next();
                    }
                    compiler.compile(filePath, config, isUpload ? self.upload.bind(self) : noop);
                    next();
                }
            }
        };
        if (config.watch.indexOf('css') > 0) {
            let cwd = p.resolve(PATH.join(config.localPath, config.cssProPath));
            let onClose = (code) => {
                log(`uz release success & exited with code ${code}`.info);
                let walker = walk.walk(config.localPath, options);
            };
            mtUZ(cwd, onClose);
        } else {
            let walker = walk.walk(config.localPath, options);
        }
    }

    upload(path) {
        log('changed'.yellow, path.yellow);
        let config = this.config;
        let flag = false;
        let up = function (filePath) {
            uploader.upload(path, filePath, function () {
                log('uploaded'.info, filePath.replace(config.serverRoot, '').yellow);
                event.emit('message', 'upload succeed', filePath.replace(config.serverRoot, ''));
            }.bind(this), noop);
        };
        if (config.filter && config.filter.length) {
            config.filter.forEach((item) => {
                if (new RegExp(item.reg).test(path)) {
                    flag = true;
                    up(config.serverRoot + item.dist + '/' + PATH.basename(path));
                    if (item.local) {
                        let dist = item.local + '/' + PATH.basename(path);
                        fs.writeFileSync(dist, fs.readFileSync(path));
                        log('async to'.red, dist.green);
                    }
                }
            })
        }
        if (!flag) {
            let filePath = path.replace(config.proxyRoot, config.serverRoot);
            up(filePath);
        }
    }
}

module.exports = Build;
