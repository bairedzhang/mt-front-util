'use strict';

var path = require('path');

if (!/\\/.test(path.resolve())) {
    module.exports = path;
} else {
    var oldPath = path,
        newPath = Object.create(oldPath);

    var proxy = function(name) {
        return function() {
            var value = oldPath[name].apply(oldPath, arguments);
            if (typeof value === 'string') {
                value = value.split(oldPath.sep).join('/');
            }
            return value;
        };
    };

    for (var name in newPath) {
        if (typeof oldPath[name] === 'function') {
            newPath[name] = proxy(name);
        }
    }

    module.exports = newPath;
}