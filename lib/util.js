'use strict';
const fs = require('fs');
const path = require('path');
const jsfmt = require('jsfmt');
const mkdir = require('mkdirp');
module.exports = {
    readJSON (path) {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    },
    writeJSON (filePath, str) {
        let dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            mkdir.sync(dir);
        }
        str = this.transToJSON(str);
        fs.writeFileSync(filePath, str, {encoding: 'utf8'});
    },
    transToJSON (str) {
        return jsfmt.format('xxxx = ' + str).replace(/.*?xxxx.*?\=.*?\{/, '{');
    }
}