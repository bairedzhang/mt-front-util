#!/usr/bin/env node
'use strict';
const fs = require('fs');
const mt = require('../index');
const program = require('commander');
const Path = require('path');
const cwd = Path.resolve(process.cwd());
const confPath = cwd + '/mt.conf';
const jsfmt = require('jsfmt');
const readJSON = function (path) {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

const pkg = readJSON(Path.join(__dirname, '../package.json'));
const version = pkg.version;
program
    .version(version)
    .usage(`
     watch          监控&编译&上传到测试环境
     build          编译整个项目&上传到测试环境
     compile        编译整个项目到本地代理路径`)
    .option('-p --proxy', '本地代理')
program.parse(process.argv);

let method = program.args[0] || 'watch';

const configMods = function (conf) {
    //log(jsfmt.format(conf));
    conf = Object.assign({}, conf, {localPath: conf.frontendModsPath, name: '组件库', serverPath: '/frontend/mods'});
    delete conf.frontendModsPath;
    var str = JSON.stringify(conf);
    str = jsfmt.format('a = ' + str).replace(/.*?a.*?\=.*?\{/, '{');
    fs.writeFileSync(conf.localPath + '/mt.conf', str, {encoding: 'utf8'});
}
if (fs.existsSync(confPath)) {
    let config = readJSON(confPath);
    config.localPath = Path.resolve(cwd);

    if (/frontend\/(?!mods)/g.test(cwd)) {
        config.frontendModsPath = cwd.replace(/^(.*frontend\/).*$/g, '$1mods');
        configMods(config);
    }
    mt.add(config, method);
    if (method == 'watch' && fs.existsSync(config.frontendModsPath)) {
        let frontConf = readJSON(config.frontendModsPath + '/mt.conf');
        mt.add(frontConf, 'watch');
    }
    if (program.proxy) {
        mt.proxy(config);
    }
}
