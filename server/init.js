
var imitator = require('./umock');
var path = require('path');
var fs = require('fs');

var main = {

    init: function(app, argv, cwd) {
        this.app = app;
        this.argv = argv;
        this.cwd = cwd;
        this.imitator = global.imitator = imitator;
        this.extend();
        this.customRoute();
        this.defaultRoute();
    },

    extend: function() {
        this.imitator.server = app;
    },

    customRoute: function() {
        var argv = this.argv;
        var home = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'PWD'];
        var defautImitatorFile = path.resolve(home, 'config.js');
        var imitatorFile;

        if (argv.f) {
            if (process.platform === 'win32') {
                imitatorFile = path.resolve(this.cwd, this.argv.f);
            } else {
                if (argv.f[0] === '/') {
                    imitatorFile = argv.f;
                } else if (argv.f[0] === '~') {
                    imitatorFile = path.resolve(home, argv.f.replace(/^~\//, ''));
                } else {
                    imitatorFile = path.resolve(this.cwd, this.argv.f);
                }
            }
        } else {
            imitatorFile = defautImitatorFile;
        }

        global.imitatorFilePath = path.resolve(__dirname);
        if (fs.existsSync(imitatorFile)) {
            global.config = require(imitatorFile);
            if (global.config.port) this.app.set('port', global.config.port);
        } else {
            throw Error(`配置文件未找到:${imitatorFile}`);
        }

        this.imitator.init();
    },

    defaultRoute: function() {
        var app = this.app;
        setTimeout(function() {
            app.use(function(req, res, next) {
                var err = new Error('Not Found');
                err.status = 404;
                next(err);
            });
            app.use(function(err, req, res, next) {
                res.json({
                    status: err.status || 500,
                    message: err.message,
                    err: err
                });
            });
        });
    }
};

module.exports = main.init.bind(main);