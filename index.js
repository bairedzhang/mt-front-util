'use strict';
const colors = require('colors');
const Project = require('./lib/project');
const proxy = require('./lib/proxy');
const util = require('util');
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
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
    console.error(err.stack);
});

let getTime = function () {
    var date = new Date();
    var fmt = function (num) {
        return num < 10 ? ('0' + num) : num
    };
    return '[ ' + [date.getHours(), date.getMinutes(), date.getSeconds()].map((item) => fmt(item)).join(':') + ' ]';
};
global.log = function () {
    let args = [].slice.call(arguments);
    args.unshift(getTime().debug);
    console.log(args.join(' '));
};
let project = {
    projects: {},
    init: function () {
        this.proxy();
    },
    add: function (config, method) {
        method = method || 'watch';
        let project = this.projects[config.name] = new Project(config);
        project[method]();
    },
    watch: function (config) {
        let name = config.name;
        if (!this.projects[name]) {
            this.add(config, 'watch');
        } else {
            this.projects[name].watch();
        }
    },
    proxy: function (config) {
        proxy.start(config);
    },
    closeProxy: function () {
        proxy.close();
    },
    close: function (config) {
        this.projects[config.name].close();
    },
    closeAll: function () {
        Object.keys(this.projects).forEach(function (name) {
            this.projects[name].close();
        }.bind(this));
        this.closeProxy();
    },
    build: function (config) {
        let name = config.name;
        if (!this.projects[name]) {
            this.add(config, 'build');
        } else {
            this.projects[name].build();
        }
    }
};
module.exports = project;
