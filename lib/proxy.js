'use strict';
var chokidar = require('chokidar');
var uploader = require('./upload.js');
var http = require('http');
var request = require('request');
var url = require('url');
var fs = require('fs');
var stat = require('node-static');
var mkdir = require('mkdirp');
var serverRealPath = function (path) {
    return path.replace(/\\/g, '/');
};
var watcher = null;
var config = {};
var noop = function () {};
var created = false;
var send = noop;
var start = (conf) => {
        config = conf;
        watcher = chokidar.watch(config.localRootPath + '/**/*', {ignoreInitial: true});
        events();
        createServer();
    },

    redirect = (req, res, body) => {
        delete req.headers['proxy-connection'];
        req.headers['connection'] = 'keep-alive';
        console.log(req.url);
        var opts = {
            uri: req.url,
            jar: true,
            headers: req.headers
        };

        if(body) {
            opts.uri = req.url + '&' + body;
        }
        request(opts).pipe(res);
    },

    createServer = () => {
        if (created) {
            return;
        }
        var infoPath = 'webapp_info';
        var info2 = 'info';
        if(fs.existsSync(config.localRootPath + '/' + info2)) {
            infoPath = info2
        }
        created = true;
        var file = new stat.Server(config.localRootPath);
        console.log(infoPath);
        http.createServer(function (req, res) {
            var body = '';
            req.on('data', function(data) {
               body += data;
            });
            req.on('end', function () {
                req.url = req.url.replace('/g/', '/' + infoPath + '/');
                file.serve(req, res, function (e, response) {
                    if (e && (e.status === 404)) {
                        var path = url.parse(req.url, true).path;
                        req.url = req.url.replace('/info/', '/g/');
                        redirect(req, res, body);
                    }
                });
            }).resume();
        }).listen(8088);
    },

    upload = (path) => {
        var filePath = serverRealPath(path.replace(config.localRootPath, config.uploadRootPath));
        //send('file:status', {path: path, status: 'uploading', name: 'test'});
        console.log('----up path------', filePath);
        uploader.upload(path, filePath, function () {
         //   send('file:status', {path: path, status: 'uploaded', name: 'test'});
        }.bind(this), noop);
    },

    events = () => {
        watcher.on('add', upload);
        watcher.on('change', upload);
    },

    close = () => {
        watcher.close();
    };

exports.start = start;
