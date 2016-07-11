'use strict';
const fs = require('fs');
const http = require('http');
const request = require('request');
const mtConfig = require('../lib/config').getConfig();
const api = mtConfig.uploadApi || 'http://rocksun.kf0309.3g.qq.com/g/sampsonzhu_uploader.jsp';
let fileName = 'test.js';
let uploading = false;
let errors = {};

var upload = function (path, filePath, sucCB, failCB) {
    uploading = true;
    var formData = {
        filename: fileName,
        filePath: filePath,
        content: fs.createReadStream(path)
    };

    var options = {
        url: api,
        formData: formData
    };

    var req = function () {
        var errHandler = (err) => {
            if (errors[path]) {
                errors[path] = errors[path] + 1;
            } else {
                errors[path] = 1;
            }

            console.log(errors[path]);
            if (errors[path] > 1) {
                log('err more than 2 times, ingore'.red, path.warn, err);
                uploading = false;
                doUp();
            } else {
                log('err'.red, path.warn, err);
                req();
            }
            if (failCB) failCB('up error：' + err);
        };
        request.post(options, function (err, res, body) {
            if (err) {
                return errHandler(err);
            }
            if (res.statusCode == 200) {
                uploading = false;
                doUp();
                sucCB();
            } else {
                errHandler(res.statusCode);
            }
        });
    }

    req();
};

let queue = [];
let doUp = function () {
    if (!uploading && queue.length) {
        upload.apply(this, queue.shift());
    }
};
exports.upload = function () {
    var args = arguments;
    queue.push(args);
    doUp();
};