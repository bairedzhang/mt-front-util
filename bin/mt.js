#!/usr/bin/env node
'use strict';
const fs = require('fs');
const mt = require('../index');
const program = require('commander');
const Path = require('path');
const cwd = Path.resolve(process.cwd());
const confPath = cwd + '/mt.conf';
const jsfmt = require('jsfmt');
const newProject = require('../lib/init');
const util = require('../lib/util');
const pkg = util.readJSON(Path.join(__dirname, '../package.json'));
const mtConfig = util.readJSON(Path.join(__dirname, '../.mt'));
const version = pkg.version;

program
    .version(version)
    .usage(`
     watch          监控&编译&上传到测试环境
     build          编译整个项目&上传到测试环境
     init           脚手架 init projectName [jsp/ftl] 默认jsp
     compile        编译整个项目到本地代理路径`)
    .option('-p --proxy', '本地代理')
    .option('--user [type]', 'config user')
    .option('--proxyRoot [type]', 'config proxyRoot');

program.parse(process.argv);

let method = program.args[0] || 'watch';

let setConfig = function (cwd, confPath) {
    let config = util.readJSON(confPath);
    let serverPath = '';
    if (/frontend/g.test(cwd)) {
        serverPath = cwd.replace(/.*?(\/frontend)/, '$1');
    }
    if (/frontend\/(?!mods)/g.test(cwd)) {
        config.frontendModsPath = cwd.replace(/^(.*frontend\/).*$/g, '$1mods');
    }
    config = Object.assign({}, {
        localPath: Path.resolve(cwd),
        serverRoot: `/usr/local/app/resin_${mtConfig.user}/webapps`,
        proxyRoot: mtConfig.proxyRoot,
        serverPath: serverPath
    }, config);
    return config;
};

if (program.user) {
    mtConfig.user = program.user;
    util.writeJSON(Path.join(__dirname, '../.mt'), JSON.stringify(mtConfig));
}

if (method == 'init') {
    new newProject(program.args[1], program.args[2] || '').init();
}

if (fs.existsSync(confPath)) {
    let config = setConfig(cwd, confPath);
    mt.add(config, method);
    if (method == 'watch' && fs.existsSync(config.frontendModsPath)) {
        let frontConf = setConfig(config.frontendModsPath, config.frontendModsPath + '/mt.conf');
        mt.add(frontConf, 'watch');
    }
    if (program.proxy) {
        mt.proxy(config);
    }
}
