'use strict';
var http = require('http');
var request = require('request');
var fs = require('fs');
var stat = require('node-static');
var path = require('./path');
var config = {};
var created = false;
var start = function (conf) {
        config = conf;
        createServer();
    },

    redirect = function (req, res, body) {
        log(req.url);
        var opts = {
            uri: req.url,
            jar: true,
            headers: req.headers
        };

        if (body) {
            opts.uri = req.url + '&' + body;
        }
        request(opts).pipe(res);
    },

    proxy = function (file, req, res, body) {
        Object.keys(config.proxy.map).forEach(function (key) {
            req.url = req.url.replace('/' + key + '/', '/' + config.proxy.map[key] + '/');
        });
        file.serve(req, res, function (e) {
            if (e && (e.status === 404)) {
                Object.keys(config.proxy.map).forEach(function (key) {
                    req.url = req.url.replace('/' + config.proxy.map[key] + '/', '/' + key + '/');
                });
                redirect(req, res, body);
            }
        });
    },
    createServer = function () {
        if (created) {
            return;
        }
        created = true;
        var file = new stat.Server(path.resolve(config.proxyRoot));
        http.createServer(function (req, res) {
            var body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                proxy(file, req, res, body);
            }).resume();
        }).listen(config.proxy.port);
    };
module.exports = start;
