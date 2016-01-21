'use strict';
const path = require('path');
const fs = require('fs');
const mkdir = require('mkdirp');
const jsfmt = require('jsfmt');
const walk = require('walk');
const dir = process.cwd();
const treePrinter = require('./treePrint');
const writeJSON = (str) => jsfmt.format('xxxx = ' + str).replace(/.*?xxxx.*?\=.*?\{/, '{');
const readJSON = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));

class Init {
    constructor(name, type) {
        this.name = name;
        this.rootPath = dir + '/' + name;
        this.type = type || 'jsp';
    }

    get ftlMTConfTpl() {
        return `
<#if isDevEnv>
    <script>
        var g_config = {
            jsmap: {
                'init':             '/init.js',
            },
            testEnv: true,
            noTS: true,
            staticPath: '',
            buildType: 'project',
            storeInc: {
                'store': false,
                'inc': false,
                'debug': true
            }
        };
    </script>
<#else>
    <script type="text/javascript" id="file_config">
        var g_config = {
            jsmap: {
                'init':                     '/base.js',
                'home':                     '/pages/home.js'
            },
            testEnv: false,
            staticPath: '',
            serverDomain: 'http://infocdn.3g.qq.com/g/storeinc',
            buildType: 'project',
            ver: '\${jsVer}',
            storeInc: {
                'store': true,
                'inc': true,
                'debug': false
            }
        };
    </script>
</#if>
<script>
    MT.config(g_config);
</script>
    `
    }

    get jspMTConfTpl() {
        return `
<% if (!isTest) { %>
<script type="text/javascript" id="file_config">
    var g_config = {
        jsmap: {
            "init": "/base.js",
        },
        testEnv: false,
        staticPath: "/infocdn/wap30/info_app/",
        serverDomain: "http://infocdn.3g.qq.com/g/storeinc",
        buildType: "project",
        ver: "<%= jsVer %>",
        storeInc: {
            "store": true,
            "inc": true,
            "debug": false
        }
    };
</script>
<% } else { %>
<script>
    var g_config = {
        jsmap: {
            "init": "/init.js",
        },
        testEnv: true,
        staticPath: "",
        buildType: "project",
        storeInc: {
            "store": false,
            "inc": false,
            "debug": true
        }
    };
</script>
<% } %>
        `
    }

    get jspIndexTpl() {
        return `
<%@ page contentType="text/html; charset=utf-8" language="java"%>
<%@ page import="com.qq.conf.ProfileManager"%>
<%@ page import="com.qq.infoutil.json.JSONObject"%>
<%@ include file="/for_include/head.jsp"%>

<%
    String jsVer=ProfileManager.getStringByKey("infoapp", "");
    String cssVer=ProfileManager.getStringByKey("infoapp", "");

    boolean isTest = false;
    if (request.getServerName().contains("kf0309")) {
        isTest = true;
    }
%>

<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>玫瑰直播</title>
    <meta name="x5-page-mode" content="no-title" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no,shrink-to-fit=no" />
    <meta name="description" content="手机腾讯网" />
    <meta name="format-detection" content="telephone=no" />
    <%@include file="/info_common_pages/rem_script.jsp"%>

    <% if (!isTest) { %>
        <link rel="stylesheet" type="text/css" href="http://3gimg.qq.com/wap30/infoapp/touch/rose_live/css/home-<%=cssVer%>.css" />
    <% } else { %>
        <link rel="stylesheet" type="text/css" href="http://gavinning.kf0309.3g.qq.com/work/live/dest/css/home.css" />
    <% } %>
</head>

<body>

<div class="lincowebapp-wrapper" id="wrapper"></div>

<script type="text/javascript" src="http://3gimg.qq.com/wap30/info/inc-core_v2.js"></script>

<%@include file="./common/mtConfig.jsp"%>
<script>
    MT.config(g_config);
    require('init');
</script>
</body>
</html>
       `
    }

    get ftlIndexTpl() {
        return `
<#assign jsVer = getStringByKey("infoapp.")>
<#assign cssVer = getStringByKey("infoapp.")>
<#assign incCoreVer = getStringByKey("infoapp.js_core_ver")>
<!DOCTYPE HTML>
<html>
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" name="viewport" />
    <title>手机腾讯网</title>
    <meta name="format-detection" content="telephone=no"/>
    <#include "/common/html/remScript.ftl">
    <#if isDevEnv>
        <link href="http://haixialiu.kf0309.3g.qq.com/work/newarticle/dest/css/home.css" rel="stylesheet" type="text/css" />
    <#else>
        <link rel="stylesheet" type="text/css" href="http://3gimg.qq.com/wap30/infoapp/touch/newarticle/css/home-\${cssVer}.css" />
    </#if>
</head>
<body class="skin">
    <#if isDevEnv>
        <script type="text/javascript" src="/frontend/core/dev/inc.js"></script>
        <script type="text/javascript" src="/frontend/core/dev/core.js"></script>
    <#else>
        <script type="text/javascript" src="http://3gimg.qq.com/wap30/info/inc-core_v2\${incCoreVer!''}.js"></script>
    </#if>
    <#include "./common/mtConfig.ftl" />
    <script>
     require('init');
    </script>
</body>
</html>
        `
    }

    init() {
        let list = ['BuildConf', 'MTConf', 'Init', 'Index', 'JSMap'];
        list.forEach((item) => {
            this['write' + item]()
        });
        mkdir.sync(path.join(this.rootPath, 'js/mods'));
        mkdir.sync(path.join(this.rootPath, 'js/pages'));
        console.log(('build ' + this.name + ' success!!').info);
        console.log(treePrinter(
            [
                {
                    name: 'common',
                    children: [
                        {name: 'mtConfig.' + this.type},
                    ]
                },
                {
                    name: 'js',
                    children: [
                        {name: 'init.js'},
                        {name: 'mods'},
                        {name: 'pages'}
                    ]
                },
                {name: 'index.' + this.type},
                {name: 'build.conf'},
                {name: 'mt.conf'}
            ], {root: this.name}
        ).blue);

    }

    writeBuildConf() {
        let json = {
            './release/{v}/base-{v}.js': {
                'files': [
                    'js/init.js'
                ],
                'fvName': 'base.js'
            },
            'pages': {
                dir: './js/pages',
                releaseDir: './release/{v}/pages/'
            }
        };

        let dist = path.join(this.rootPath, 'build.conf');
        this.write(dist, writeJSON(JSON.stringify(json)));
    }

    writeMTConf() {
        let json = {
            "name": "项目名称",
            "localPath": this.rootPath,
            "proxy": {
                "port": "8088",
                "map": {
                    "g": "info",
                    "infoapp": "infoapp"
                },
            },
            "serverRoot": "/usr/local/app/resin_bairedzhang/webapps",
            "serverPath": "",
            "proxyRoot": "",
            "compile": {
                "babel": {
                    "presets": ["es2015"],
                    "plugins": ["transform-react-jsx", "transform-es2015-modules-mt-amd"]
                }
            },
            "build": ["upload", "compile"],
            "watch": ["upload", "compile"]
        };

        let dist = path.join(this.rootPath, 'mt.conf');
        this.write(dist, writeJSON(JSON.stringify(json)))
    }

    writeInit() {
        let dist = path.join(this.rootPath, 'js', 'init.js');
        this.write(dist, '/*init*/')
    }

    writeJSMap() {
        let dist = path.join(this.rootPath, 'common', 'mtConfig.' + this.type);
        this.write(dist, this[this.type + 'MTConfTpl']);
    }

    writeIndex() {
        let dist = path.join(this.rootPath, 'index.' + this.type);
        this.write(dist, this[this.type + 'IndexTpl']);
    }

    write(file, fileData) {
        let dir = path.dirname(file);
        if (!fs.existsSync(dir)) {
            mkdir.sync(dir);
        }
        fs.writeFileSync(file, fileData, {encoding: 'utf8'});
    }
}

module.exports = Init;