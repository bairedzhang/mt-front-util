const fs = require('fs');
const Path = require('path');
let queue = [];
let compiling = false;
let doMap = function (path, config, cb) {
    let moduleName = path.match(/\/js\/(.*)\.js/),
        modulePath = '';
    compiling = false;
    doTask();
};

let doTask= function () {
    if (queue.length && !compiling) {
        doMap.apply(this, queue.shift());
    }
};
exports.compile = function () {
    var args = [].slice.call(arguments);
    queue.push(args);
    doTask();
};
exports.copy = copy;
