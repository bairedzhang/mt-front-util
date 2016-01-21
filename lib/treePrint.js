var _isFunction = require('lodash.isfunction');
var _merge = require('lodash.merge');

var getDepthMarker = function(settings) {
    var depthMarker = '';
    for (var d = 0; d < settings.depth; d++) {
        if (settings.depths[d]) {
            depthMarker += settings.format.depthLast;
        } else {
            depthMarker += settings.format.depth;
        }
    }
    return depthMarker;
};

var treePrinter = function treePrinter(tree, options) {
    var settings = {
        depth: 0,
        depths: [false],
        format: {
            root: options.root,
            branchNoChildren: '├── {{name}}',
            branchChildren: '├─┬ {{name}}',
            branchNoChildrenLast: '└── {{name}}',
            branchChildrenLast: '└─┬ {{name}}',
            depth: '│ ',
            depthLast: '  ',
            eol: '\n',
        },
        fields: {
            name: 'name',
            children: 'children',
        },
        autoPrint: false,
    };
    _merge(settings, options);

    var out = '';
    var depthMarker = '';

    if (settings.depth) {
        depthMarker = getDepthMarker(settings);
    } else { // Root node
        out += settings.format.root + settings.format.eol;
    }

    tree.forEach(function(branch, offset) {
        var isLast = offset == tree.length - 1;
        if (isLast) { // If last swap the last depth marker and recalc the marker string
            settings.depths.pop();
            settings.depths.push(true);
            depthMarker = getDepthMarker(settings);
        }

        // Determine name {{{
        var name;
        if (_isFunction(settings.fields.name)) {
            name = settings.fields.name(branch);
        } else {
            name = branch[settings.fields.name];
        }
        // }}}

        if (branch[settings.fields.children] && branch[settings.fields.children].length > 0) {
            out += depthMarker + settings.format[isLast ? 'branchChildrenLast' : 'branchChildren'].replace('{{name}}', name) + settings.format.eol;
            var newSettings = {};
            _merge(newSettings, settings);
            _merge(newSettings, {
                autoPrint: false,
                depth: settings.depth + 1,
                depths: settings.depths.concat([isLast]),
            });
            out += treePrinter(branch[settings.fields.children], newSettings);
        } else { // No children
            out += depthMarker + settings.format[isLast ? 'branchNoChildrenLast' : 'branchNoChildren'].replace('{{name}}', name) + settings.format.eol;
        }
    });

    if (settings.autoPrint) console.log(out);
    return out;
};

module.exports = treePrinter;