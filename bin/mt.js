#!/usr/bin/env node
'use strict';
const fs = require('fs');
const mt = require('../index');
const program = require('commander');
const Path = require('path');
const cwd = process.cwd();
const confPath = cwd + '/mt.conf';
const readJSON = function(path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const pkg =  readJSON(Path.join(__dirname, '../package.json'));
const version =  pkg.version;
program
    .version(version)
    .option('-p --proxy', '本地代理')
program.parse(process.argv);

let method = program.args[0] || 'watch';
if (fs.existsSync(confPath)) {
    let config = readJSON(confPath);
    mt.add(config, method);
    if(method == 'watch' && fs.existsSync(config.frontendModsPath)){
       let frontConf = readJSON(config.frontendModsPath + '/mt.conf');
       mt.add(frontConf, 'watch');
    }
    if(program.proxy) {
        mt.proxy(config);
    }
}
