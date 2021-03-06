var _ = require('lodash');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');

var logger = require("../utils/logger")("local");

var LOCAL_SETTINGS_DIR = path.join(
    process.env.HOME,
    '.codebox'
);

var SETTINGS_FILE = process.env.WORKSPACE_CODEBOX_DIR || path.join(LOCAL_SETTINGS_DIR, 'settings.json')

// Base structure for a local workspace
// Store the workspace configuration in a file, ...
module.exports = function(options) {
    options = _.defaults(options, {

    });

    options.hooks = _.defaults(options.hooks, {
        'settings.get': function(args) {
            return Q.nfcall(fs.readFile, SETTINGS_FILE, "utf-8")
            .then(JSON.parse)
            .fail(_.constant({}))
            .then(function(config) {
                if (!config[options.id]) config[options.id] = {};
                return config[options.id][args.user] || {};
            });
        },

        'settings.set': function(args) {
            return Q.nfcall(fs.readFile, SETTINGS_FILE, "utf-8")
            .then(JSON.parse)
            .fail(_.constant({}))
            .then(function(config) {
                if (!config[options.id]) config[options.id] = {};
                config[options.id][args.user] = args.settings;

                return Q.nfcall(fs.writeFile, SETTINGS_FILE, JSON.stringify(config))
                .thenResolve(config);
            })
            .then(function(config) {
                return config[options.id][args.user] || {};
            });
        }
    });

    options.packages = _.defaults(options.packages, {
        'root': process.env.WORKSPACE_ADDONS_DIR || path.resolve(LOCAL_SETTINGS_DIR, 'packages')
    });

    // Create .codebox folder
    logger.log("Creating", LOCAL_SETTINGS_DIR);
    wrench.mkdirSyncRecursive(LOCAL_SETTINGS_DIR);

    return options;
};
