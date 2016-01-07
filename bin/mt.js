#!/usr/bin/env node
'use strict';
const fs = require('fs');
const mt = require('../index');
const program = require('commander');
const path = process.cwd();
const confPath = path + '/mt-conf.js';
program
    .version('0.1.2)
    .option('-p --proxy', '本地代理');
program.parse(process.argv);

if (fs.existsSync(confPath)) {
    let config = require(confPath);
    mt.add(config, program.args[0] || 'watch');
    if(program.proxy) {
        mt.proxy(config);
    }
}
