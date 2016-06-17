#手腾前端工具集

##Installing

```sh
  npm install -g mt-front-util
```
##Configuring

###添加.mtrc
```sh
   cd ~/
   touch .mtrc
```
####. mtrc配置项
```javascript
  {
    "user": "bairedzhang", //rtx id
    "proxyRoot": "/tmp/tencent_proxy", //本地编译后代码根路径
    "uploadApi": "http://samczhang.kf0309.3g.qq.com/infoManager/sampsonzhu_uploader.jsp",//上传接口
    "localFrontendMods": "/Users/bairedzhang/Dropbox/tencent/frontend/mods" //本地mods文件路径
  }
```

###配置文件，统一规范文件名为mt.conf 放到项目根目录下
```javascript
  {
    "name": "频道页", //项目名称
    "serverPath": "/frontend/apps/channel",//上传server路径
    "filter": [
      {
        "reg": "index.ftl",
        "dist": "/info/view/channel",
        "local": "/Users/bairedzhang/Dropbox/tencent/info/view/channel"
      },
      {
        "reg": "mtConfig.ftl",
        "dist": "/info/view/channel/common",
        "local": "/Users/bairedzhang/Dropbox/tencent/info/view/channel/common"
      }
    ],
    "compile": {
      "babel": {
        "presets": [
          "react",
          "stage-2",
          "es2015"
        ],
        "plugins": [
          [
            "transform-es2015-modules-mt-amd",
            {
              "commonjs": true
            }
          ]
        ]
      }
    },
    "build": [
      "upload",
      "compile"
    ],
    "watch": [
      "upload",
      "compile",
      "css"
    ],
    "release":{
      "page_conf": "common/mtConfig.ftl", //jsmap文件路径
      "jsDir": "js", //js文件路径
      "use_es6": true, //是否使用es6
      "use_react": true //是否使用react
    }
  }

```
##command line
```sh
  cd /Users/bairedzhang/Dropbox/tencent/frontend/apps/photo;
  mt //默认watch 等同于 mt watch
  mt -b (--bundle) //watch 文件改变时生成release代码并上传到测试环境
  mt -p //开启本地代理 + watch 等同于 mt watch -p
  mt init [project-name] [type] // 构建新项目脚手架，type 可选 jsp/ftl 默认jsp
  mt build //构建项目，编译整个项目的js文件 并将项目所有文件上传到测试环境对应路径
  mt release //产出打包代码到./release下
  mt release --ver 20160617001//为产出代码添加版本号 如 base-20160617001.js
```
