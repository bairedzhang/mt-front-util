'use strict';
const fs = require('fs');
const http = require('http');
const serverHost = 'rocksun.kf0309.3g.qq.com';
const serverPath = '/g/sampsonzhu_uploader.jsp';
var fileName = 'test.js';

var upload = function(path, filePath, sucCB, failCB) {
    var datas = fs.readFileSync(path);

    var boundary = "---------------------------leon";
    var formStr = '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="filePath"' + '\r\n\r\n'
        + filePath + '\r\n'
        + '--' + boundary + '\r\n'
        + 'Content-Disposition: form-data; name="content"; filename="'+ fileName +'"' + '\r\n'
        + 'Content-Type: application/octet-stream' + '\r\n\r\n';
    var formEnd = '\r\n--' + boundary + '--\r\n';
    var options = {
        host : serverHost,
        port : 80,
        method : "POST",
        path : serverPath,
        headers : {
            "Content-Type" : "multipart/form-data; boundary=" + boundary,
            "Content-Length" : formStr.length + datas.length + formEnd.length
        }
    };

    var req = http.request(options, function(res) {
        var txt = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            txt += chunk;
        });
        res.on('end', function (data) {
            if(res.statusCode == 200) {
                sucCB();
            } else {
                data = data || '';
                if(failCB) failCB('err msg：' + data.toString().trim());
            }
        });
        res.on('error', function(data) {
            console.log('error!!!');
            if(failCB) failCB('up error：' + data.toString().trim());
        });
    });

    req.write(formStr);
    req.write(datas);
    req.write(formEnd);
    req.end();
};

exports.upload = upload;