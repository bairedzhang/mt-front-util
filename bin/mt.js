#!/usr/bin/env node
'use stirct';
var fs = require('fs'),
    mt = require('../index'),
    program = require('commander'),
    path = process.cwd(),
    confPath = path + '/mt-conf.js';
program
    .version('0.0.2')
    .option('-p --proxy', '本地代理');
program.parse(process.argv);

console.log(program);
if (fs.existsSync(confPath)) {
    var config = require(confPath);
    mt.add(config, program.args[0] || 'watch');
    if(program.proxy) {
        mt.proxy(config);
    }
}
