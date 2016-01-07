'use strict';
const http = require('http');
const request = require('request');
const fs = require('fs');
const stat = require('node-static');
const path = require('./path');
let config = {};
let server = null;
let start = function (conf) {
        config = conf;
        createServer();
    },

    close = function () {
        log('proxy close'.red);
        if (server) {
            server.close();
            server = null;
        }
    },

    redirect = function (req, res, body) {
        log(req.url.info);
        let opts = {
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
        if (server) {
            return;
        }
        let file = new stat.Server(path.resolve(config.proxyRoot));
        server = http.createServer(function (req, res) {
            let body = '';
            req.on('data', function (data) {
                body += data;
            });
            req.on('end', function () {
                proxy(file, req, res, body);
            }).resume();
        }).listen(config.proxy.port);
    };
module.exports = {
    start: start,
    close: close
};
