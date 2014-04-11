/**
* Created by sungwoo on 14. 2. 5.
*/
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path='../def/node.d.ts' />
/// <reference path='../def/colors.d.ts' />
/// <reference path='../def/sudo.d.ts' />
var fs = require('fs');
var path = require("path");
var child_process = require('child_process');
var readline = require('readline');
var sudo = require('sudo');
var colors = require('colors');

/**
*
*  Javascript string pad
*  http://www.webtoolkit.info/
*
**/
exports.STR_PAD_LEFT = 1;
exports.STR_PAD_RIGHT = 2;
exports.STR_PAD_BOTH = 3;

function pad(aString, aLength, aDirection, aPaddingChar) {
    if (typeof (aLength) == "undefined") {
        var len = 0;
    }
    if (typeof (aPaddingChar) == "undefined") {
        var pad = ' ';
    }
    if (typeof (aDirection) == "undefined") {
        var dir = exports.STR_PAD_RIGHT;
    }
    var padlen;
    if (aLength + 1 >= aString.length) {
        switch (aDirection) {
            case exports.STR_PAD_LEFT:
                aString = Array(aLength + 1 - aString.length).join(aPaddingChar) + aString;
                break;

            case exports.STR_PAD_BOTH:
                var right = Math.ceil((padlen = aLength - aString.length) / 2);
                var left = padlen - right;
                aString = Array(left + 1).join(aPaddingChar) + aString + Array(right + 1).join(aPaddingChar);
                break;

            default:
                aString = aString + Array(aLength + 1 - aString.length).join(aPaddingChar);
                break;
        }
    }

    return aString;
}
exports.pad = pad;
;

function rmdir(dir) {
    var list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);

        if (filename == "." || filename == "..") {
            // pass these files
        } else if (stat.isDirectory()) {
            // rmdir recursively
            exports.rmdir(filename);
        } else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);
}
exports.rmdir = rmdir;
;

var CSignalSource = (function () {
    function CSignalSource() {
        this._signalTypes = {};
    }
    CSignalSource.prototype.destroy = function () {
        this._signalTypes = null;
    };
    CSignalSource.prototype.registerSignal = function (aSignalList) {
        var i, len, signalName;
        for (i = 0, len = aSignalList.length; i < len; i++) {
            signalName = aSignalList[i];
            if (this._signalTypes[signalName]) {
                throw "Event [" + signalName + "] already exists";
            }

            this._signalTypes[signalName] = [];
        }
    };
    CSignalSource.prototype.connect = function (aSignalName, aHolder, aSlotName) {
        if (!(aHolder[aSlotName] instanceof Function)) {
            throw "holder does not have the slot";
        }

        var signalHandlers;
        var signalHandler;
        signalHandlers = this._signalTypes[aSignalName];
        var i, len;
        for (i = 0, len = signalHandlers.length; i < len; i++) {
            signalHandler = signalHandlers[i];
            if (signalHandler.holder == aHolder) {
                signalHandler.slotName = aSlotName;
                return;
            }
        }
        signalHandlers.push({
            holder: aHolder,
            slotName: aSlotName
        });
    };
    CSignalSource.prototype.disconnect = function (aHolder) {
        var signalName;
        var signalHandlers;
        var signalHandler;
        var i;
        for (signalName in this._signalTypes) {
            if (this._signalTypes.hasOwnProperty(signalName)) {
                signalHandlers = this._signalTypes[signalName];
                for (i = signalHandlers.length - 1; i >= 0; i--) {
                    signalHandler = signalHandlers[i];
                    if (signalHandler.holder == aHolder) {
                        signalHandlers.splice(i, 1);
                        break;
                    }
                }
            }
        }
    };
    CSignalSource.prototype.length = function (aSignalName) {
        return this._signalTypes[aSignalName].length;
    };
    CSignalSource.prototype.emit = function () {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        var signalName;
        var i, len, handlerInfoList, handlerInfo;
        var holder;
        signalName = args.shift();
        handlerInfoList = this._signalTypes[signalName];
        for (i = 0, len = handlerInfoList.length; i < len; i++) {
            handlerInfo = handlerInfoList[i];
            handlerInfo.holder[handlerInfo.slotName].apply(handlerInfo.holder, args);
        }
    };
    return CSignalSource;
})();
exports.CSignalSource = CSignalSource;

var CCmdRunner = (function (_super) {
    __extends(CCmdRunner, _super);
    function CCmdRunner(aCmd, aArgs, aPath) {
        _super.call(this);
        this._cmd = aCmd;
        this._args = aArgs;
        this._path = aPath;
        this.registerSignal(["Output", 'Closed']);
    }
    CCmdRunner.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
    };
    CCmdRunner.prototype.setVerbose = function (aHiddenArgs) {
        this._hiddenArgs = aHiddenArgs;
        this._verbose = true;
    };

    // TODO: making exec function and execute series in command
    CCmdRunner.prototype.exec = function () {
        var _this = this;
        var command = [];
        if (this._args) {
            command = this._args.slice(0);
            if (this._hiddenArgs) {
                var i, len = command.length, arg, argPrev;
                for (i = len - 1; i >= 0; i--) {
                    arg = command[i];
                    if (this._hiddenArgs.indexOf(arg) != -1) {
                        if (argPrev && argPrev.charAt(0) == '-') {
                            command.splice(i, 1);
                        } else {
                            command.splice(i, 2);
                        }
                    }
                    argPrev = arg;
                }
            }
        }
        if (this._cmd) {
            command.unshift(this._cmd);
        } else {
            command.unshift('sudo');
        }
        if (this._verbose) {
            console.log('CMD: ' + command.join(' ').green);
        }

        var options = {};

        var newEnv = process.env;

        //        LANGUAGE = "ko_KR",
        //            LC_ALL = (unset),
        //            LC_MESSAGES = "en_US",
        //            LANG = "en_US.UTF-8"
        newEnv['LANGUAGE'] = 'en_US.UTF-8';
        newEnv['LANG'] = 'en_US.UTF-8';
        newEnv['LC_MESSAGES'] = 'en_US.UTF-8';
        newEnv['LC_ALL'] = 'en_US.UTF-8';
        options['env'] = newEnv;

        var path = process.cwd();
        if (this._path) {
            options['cwd'] = process.cwd() + '/' + this._path;
            path = this._path;
        }

        if (this._cmd) {
            if (this._args) {
                this._child = child_process.spawn(this._cmd, this._args, options);
            } else {
                this._child = child_process.exec(this._cmd, options, null);
            }
        } else {
            this._child = sudo(this._args, options);
        }
        var stdout = readline.createInterface({
            input: this._child.stdout,
            output: this._child.stdin
        });
        var stderr = readline.createInterface({
            input: this._child.stderr,
            output: this._child.stdin
        });
        stdout.on('line', function (aLine) {
            if (_this._verbose) {
                console.log('OUT: ' + aLine);
            }
            _this._emitOutput(false, aLine);
        });
        stderr.on('line', function (aLine) {
            if (_this._verbose) {
                console.log('ERR: ' + aLine.red);
            }
            _this._emitOutput(true, aLine);
        });
        this._child.on('close', function (aExitCode) {
            _this._emitClosed(aExitCode);
        });
        return path + '$ ' + command.join(' ');
    };
    CCmdRunner.prototype.connectOutput = function (aHolder, aSlotName, aSlot) {
        this.connect("Output", aHolder, aSlotName);
    };
    CCmdRunner.prototype._emitOutput = function (aErr, aLine) {
        this.emit.call(this, "Output", aErr, aLine);
    };
    CCmdRunner.prototype.connectClosed = function (aHolder, aSlotName, aSlot) {
        this.connect("Closed", aHolder, aSlotName);
    };
    CCmdRunner.prototype._emitClosed = function (aErrCode) {
        this.emit.call(this, "Closed", aErrCode);
    };
    return CCmdRunner;
})(CSignalSource);
exports.CCmdRunner = CCmdRunner;

function runCmd(aCmd, aArgs, aCallback) {
    var cmdRunner = new CCmdRunner(aCmd, aArgs);
    var result = {
        exitCode: 0,
        out: []
    };
    var handler = {
        output: function (aErr, aLine) {
            result.out.push({
                err: aErr,
                line: aLine
            });
        },
        closed: function (aErrCode) {
            cmdRunner.destroy();
            cmdRunner = null;
            result.exitCode = aErrCode;
            aCallback(result);
        }
    };
    cmdRunner.connectOutput(handler, 'output', handler.output);
    cmdRunner.connectClosed(handler, 'closed', handler.closed);

    //    if (sVerbose) {
    //        cmdRunner.setVerbose(KHiddenArgs);
    //    }
    cmdRunner.exec();
}
exports.runCmd = runCmd;
//# sourceMappingURL=common.js.map
