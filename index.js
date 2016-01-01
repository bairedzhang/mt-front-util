const config = require('./config');
const colors = require('colors');
const Project = require('./lib/project');
const proxy = require('./lib/proxy');
const fs = require('fs');
const argv = process.argv.slice(2);
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

process.on('uncaughtException', function (err) {
    console.log(err.stack);
});

var list = argv.map(function(item) {
   var arr = item.split(':')
   return {
       name: arr[0],
       method: arr[1] || 'watch'
   };
});
var project = {
    init: function (list) {
        this.projects = {};
        if(config.proxy.open) {
           proxy(Object.assign(config.proxy, config.global));
        }
        list.forEach(this.add.bind(this));
    },
    add: function (item) {
        var conf =  config.projects[item.name];
        if(typeof conf == 'string') {
           conf = JSON.parse(fs.readFileSync(conf, {encoding: 'utf8'}));
        }
        Object.assign(conf, config.global, {method: item.method});
        this.projects[item.name] = new Project(conf);
    },
    watch: function(name) {
       this.projects[name].watch();
    },
    close: function (name) {
        this.projects[name].stop();
    },
    build: function (name) {
        this.projects[name].build();
    }
};

if(list.length) {
   project.init(list);
};

module.exports = project;
