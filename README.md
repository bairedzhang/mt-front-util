#手腾前端工具集

##Installing

```sh
  npm install -g mt-front-util
```
##Configuring

###配置文件，统一规范文件名为mt.conf 放到项目根目录下
```javascript
  {
    "name": "悦图",  //项目名称
    "proxyRoot": "/tmp/tencent_proxy", //本地build&proxy根路径,对应测试环境webapps/
    "localPath": "/users/bairedzhang/dropbox/tencent/frontend/apps/photo", //项目本地根路径
    "frontendModsPath": "/users/bairedzhang/dropbox/tencent/frontend/mods", //组件库本地路径
    "serverPath": "/frontend/apps/photo",//项目测试环境相对于webapps路径
    "serverRoot": "/usr/local/app/resin_bairedzhang/webapps", //测试环境根路径
    "compile": { //编译任务
        "babel":{
            "presets": ["es2015"], //es6 -> es5
            "plugins": ["transform-react-jsx", "transform-es2015-modules-mt-amd"] // react, 手腾amd定制
        }
    },
    "watch": ["upload", "compile"], //默认必填,为后续扩展需要
    "build": ["compile", "upload"], //默认必填,为后续扩展需要
    "proxy": { //本地代理配置
        "port": 8088, //端口
         "map": { //映射别名配置
           "g": 'info'
        }
    }
  }
```
##command line
```sh
  cd /Users/bairedzhang/Dropbox/tencent/frontend/apps/photo;
  mt   //默认watch 等同于 mt watch
  mt -p //开启本地代理 + watch 等同于 mt watch -p
  mt init [project-name] [type] // 构建新项目脚手架，type 可选 jsp/ftl 默认jsp
  mt build //构建项目，编译整个项目的js文件 并将项目所有文件上传到测试环境对应路径
```
