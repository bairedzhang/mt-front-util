'use strict';
const fs = require('fs');
const util = require('./util');
const location = process.env.HOME + '/.mtrc';

const getConfig = function () {
    if (fs.existsSync(location)) {
        return util.readJSON(location);
    } else {
        return {
            user: 'bairedzhang',
            proxyRoot: '/tmp/tencent_proxy',
            uploadApi: 'http://rocksun.kf0309.3g.qq.com/g/sampsonzhu_uploader.jsp',
            localFrontendMods: '/Users/bairedzhang/Dropbox/tencent/frontend/mods'
        };
    }
};

const setConfig = function (opts) {
    let config = JSON.stringify(Object.assign({}, getConfig(), opts || {}));
    util.writeJSON(location, config);
};

if (!fs.existsSync(location)) {
    setConfig();
}

exports.setConifg = setConfig;
exports.getConfig = getConfig;

