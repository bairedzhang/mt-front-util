'use strict';
const colors = require('colors');
const Project = require('./lib/project');
const proxy = require('./lib/proxy');
const util = require('util');
const fs = require('fs');
var EventEmitter = require('events').EventEmitter;
global.event = new EventEmitter();

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

process.on('uncaughtException', function (err) {
    console.log(err.stack);
});

global.log = function () {
    var args = [].slice.call(arguments);
    args.unshift('------------ ');
    console.log(args.join(' '));
};
var project = {
    projects: {},
    init: function () {
        this.proxy();
    },
    add: function (config, method) {
       method = method || 'watch';
       log(method);
       var project =  this.projects[config.name] = new Project(config);
       project[method]();
    },
    watch: function (config) {
        var name = config.name;
        if (!this.projects[name]) {
            this.add(config, 'watch');
        } else {
            this.projects[name].watch();
        }
    },
    proxy: function(config) {
        if (config.proxy.open) {
            log('open proxy'.info);
            proxy(config);
        }
    },
    close: function (config) {
        this.projects[config.name].close();
    },
    build: function (config) {
        var name = config.name;
        if (!this.projects[name]) {
            this.add(config, 'build');
        } else {
            this.projects[name].build();
        }
    }
};
module.exports = project;
