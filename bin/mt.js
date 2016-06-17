#!/usr/bin/env node
'use strict';
const fs = require('fs');
const mt = require('../index');
const program = require('commander');
const Path = require('path');
const cwd = Path.resolve(process.cwd());
const confPath = cwd + '/mt.conf';
const newProject = require('../lib/init');
const util = require('../lib/util');
const config = require('../lib/config');
const pkg = util.readJSON(Path.join(__dirname, '../package.json'));
const version = pkg.version;
const mtConfig = require('../lib/config').getConfig();

program
    .version(version)
    .usage(`
     watch          监控&编译&上传到测试环境
     build          编译整个项目&上传到测试环境
     init           脚手架 init projectName [jsp/ftl] 默认jsp
     release        产出上线代码 
     compile        编译整个项目到本地代理路径`)
    .option('-p --proxy', '本地代理')
    .option('-c, --ver [type]', 'release ver')
    .option('-b --bundle', '监控时合并压缩代码')

program.parse(process.argv);

let method = program.args[0] || 'watch';

let setConfig = function (cwd, confPath) {
    let conf = util.readJSON(confPath);
    let serverPath = '';
    if (/frontend/g.test(cwd)) {
        serverPath = cwd.replace(/.*?(\/frontend)/, '$1');
    }
    conf = Object.assign({}, {
        localPath: Path.resolve(cwd),
        serverRoot: `/usr/local/app/resin_${mtConfig.user}/webapps`,
        proxyRoot: mtConfig.proxyRoot,
        serverPath: serverPath,
        cssProPath: './static/',
        localFrontendMods: mtConfig.localFrontendMods
    }, conf);
    if (program.bundle) {
        conf.bundle = true;
    }

    if (program.ver) {
        conf.releaseVer = program.ver;
    }
    return conf;
};

if (method == 'init') {
    new newProject(program.args[1], program.args[2] || '').init();
}

if (fs.existsSync(confPath)) {
    let config = setConfig(cwd, confPath);
    mt.add(config, method);
    let localMods = mtConfig.localFrontendMods;
    if (method == 'watch') {
        if (fs.existsSync(localMods)) {
            let frontConf = setConfig(localMods, localMods + '/mt.conf');
            mt.add(frontConf, 'watch');
        } else {
            log(`can't find mods in your local, please config your localFrontendMods in ${process.env.HOME}/.mtrc`.red);
        }
    }
    if (program.proxy) {
        mt.proxy(config);
    }
}
