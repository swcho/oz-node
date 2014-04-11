/**
 * Created by sungwoo on 14. 2. 5.
 */

/// <reference path='../def/node.d.ts' />
/// <reference path='../def/colors.d.ts' />
/// <reference path='../def/sudo.d.ts' />

import fs = require('fs');
import path = require("path");
import child_process = require('child_process');
import readline = require('readline');
import sudo = require('sudo');
var colors = require('colors');

/**
 *
 *  Javascript string pad
 *  http://www.webtoolkit.info/
 *
 **/
export var STR_PAD_LEFT = 1;
export var STR_PAD_RIGHT = 2;
export var STR_PAD_BOTH = 3;

export function pad(aString: string, aLength: number, aDirection: number, aPaddingChar?: string) {

    if (typeof(aLength) == "undefined") { var len = 0; }
    if (typeof(aPaddingChar) == "undefined") { var pad = ' '; }
    if (typeof(aDirection) == "undefined") { var dir = STR_PAD_RIGHT; }
    var padlen;
    if (aLength + 1 >= aString.length) {

        switch (aDirection){

            case STR_PAD_LEFT:
                aString = Array(aLength + 1 - aString.length).join(aPaddingChar) + aString;
                break;

            case STR_PAD_BOTH:
                var right = Math.ceil((padlen = aLength - aString.length) / 2);
                var left = padlen - right;
                aString = Array(left+1).join(aPaddingChar) + aString + Array(right+1).join(aPaddingChar);
                break;

            default:
                aString = aString + Array(aLength + 1 - aString.length).join(aPaddingChar);
                break;

        } // switch

    }

    return aString;

};

export function rmdir(dir) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);

        if(filename == "." || filename == "..") {
            // pass these files
        } else if(stat.isDirectory()) {
            // rmdir recursively
            rmdir(filename);
        } else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);
};

interface TSignalHandlerInfo {
    holder: any;
    slotName: string;
}
export class CSignalSource {
    private _signalTypes: { [signalName: string]: TSignalHandlerInfo[]; } = {};
    constructor() {
    }
    destroy() {
        this._signalTypes = null;
    }
    registerSignal(aSignalList: string[]) {
        var i, len, signalName: string;
        for (i = 0, len = aSignalList.length; i < len; i++) {
            signalName = aSignalList[i];
            if (this._signalTypes[signalName]) {
                throw "Event [" + signalName + "] already exists";
            }

            this._signalTypes[signalName] = [];
        }
    }
    connect(aSignalName: string, aHolder: any, aSlotName: string) {

        if (!(aHolder[aSlotName] instanceof Function)) {
            throw "holder does not have the slot";
        }

        var signalHandlers: TSignalHandlerInfo[];
        var signalHandler: TSignalHandlerInfo;
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
    }
    disconnect(aHolder: {}) {
        var signalName: string;
        var signalHandlers: TSignalHandlerInfo[];
        var signalHandler: TSignalHandlerInfo;
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
    }
    length(aSignalName: string) {
        return this._signalTypes[aSignalName].length;
    }
    emit(...args: any[]) {
        var signalName: string;
        var i, len, handlerInfoList: TSignalHandlerInfo[], handlerInfo: TSignalHandlerInfo;
        var holder;
        signalName = args.shift();
        handlerInfoList = this._signalTypes[signalName];
        for (i = 0, len = handlerInfoList.length; i < len; i++) {
            handlerInfo = handlerInfoList[i];
            handlerInfo.holder[handlerInfo.slotName].apply(handlerInfo.holder, args);
        }
    }
}

export class CCmdRunner extends CSignalSource {

    private _child;
    private _cmd: string;
    private _args: string[];
    private _path: string;
    private _verbose: boolean;
    private _hiddenArgs: string[];

    constructor(aCmd: string, aArgs: string[], aPath?: string) {
        super();
        this._cmd = aCmd;
        this._args = aArgs;
        this._path = aPath;
        this.registerSignal(["Output", 'Closed']);
    }
    destroy() {
        super.destroy();
    }
    setVerbose(aHiddenArgs?: string[]) {
        this._hiddenArgs = aHiddenArgs;
        this._verbose = true;
    }
    // TODO: making exec function and execute series in command
    exec(): string {
        var command = [];
        if (this._args) {
            command = this._args.slice(0);
            if (this._hiddenArgs) {
                var i, len=command.length, arg, argPrev;
                for (i=len-1; i>=0; i--) {
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
        stdout.on('line', (aLine: string) => {
            if (this._verbose) {
                console.log('OUT: ' + aLine);
            }
            this._emitOutput(false, aLine);
        });
        stderr.on('line', (aLine: string) => {
            if (this._verbose) {
                console.log('ERR: ' + aLine.red);
            }
            this._emitOutput(true, aLine);
        });
        this._child.on('close', (aExitCode: number) => {
            this._emitClosed(aExitCode);
        });
        return path + '$ ' + command.join(' ');
    }
    connectOutput(aHolder: any, aSlotName: string, aSlot: (aErr: boolean, aLine: string) => void) {
        this.connect("Output", aHolder, aSlotName);
    }
    private _emitOutput(aErr: boolean, aLine: string) {
        this.emit.call(this, "Output", aErr, aLine);
    }
    connectClosed(aHolder: any, aSlotName: string, aSlot: (aErrCode: number) => void) {
        this.connect("Closed", aHolder, aSlotName);
    }
    private _emitClosed(aErrCode: number) {
        this.emit.call(this, "Closed", aErrCode);
    }
}

export interface TRunCmdOutput {
    err: boolean;
    line: string;
}

export interface TRunCmdResult {
    exitCode: number;
    out: TRunCmdOutput[];
}

export function runCmd(aCmd: string, aArgs: string[], aCallback: (aResult: TRunCmdResult) => void) {
    var cmdRunner = new CCmdRunner(aCmd, aArgs);
    var result: TRunCmdResult = {
        exitCode: 0,
        out: []
    };
    var handler = {
        output: (aErr: boolean, aLine: string) => {
            result.out.push({
                err: aErr,
                line: aLine
            });
        },
        closed: (aErrCode: number) => {
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
