'use strict';
const fs = require('fs');
const http = require('http');
const request = require('request');
const api = 'http://rocksun.kf0309.3g.qq.com/g/sampsonzhu_uploader.jsp';
let fileName = 'test.js';
let uploading = false;

var upload = function (path, filePath, sucCB, failCB) {
    uploading = true;
    var datas = fs.readFileSync(path);
    var boundary = "---------------------------leon";
    var formStr = '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="filePath"' + '\r\n\r\n'
        + filePath + '\r\n'
        + '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="content"; filename="' + fileName + '"' + '\r\n'
        + 'Content-Type: application/octet-stream' + '\r\n\r\n';
    var formEnd = '\r\n--' + boundary + '--\r\n';
    var options = {
        url: api,
        method: "POST",
        headers: {
            "Content-Type": "multipart/form-data; boundary=" + boundary,
            "Content-Length": formStr.length + datas.length + formEnd.length
        },
        body: [formStr, datas, formEnd].join('')
    };

    var req = function () {
        var errHandler = (err) => {
            log('err'.red, path.warn, err);
            req();
            if (failCB) failCB('up error：' + err);
        };
        request(options, function (err, res, body) {

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