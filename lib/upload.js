'use strict';
const fs = require('fs');
const http = require('http');
const serverHost = 'rocksun.kf0309.3g.qq.com';
const serverPath = '/g/sampsonzhu_uploader.jsp';
let fileName = 'test.js';
let uploading = false;

var upload = function(path, filePath, sucCB, failCB) {
    uploading = true;
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
                uploading = false;
                doUp();
                sucCB();
            } else {
                data = data || '';
                if(failCB) failCB('err msg：' + data.toString().trim());
            }
        });
        res.on('error', function(data) {
            console.log('error!!!');
            req(options);
            if(failCB) failCB('up error：' + data.toString().trim());
        });
    });

    req.write(formStr);
    req.write(datas);
    req.write(formEnd);
    req.end();
};

let queue = [];
let doUp  = function() {
   if( !uploading && queue.length) {
      upload.apply(this, queue.shift());
   }
};
exports.upload = function() {
   var args = arguments;
   queue.push(args);
   doUp();
};