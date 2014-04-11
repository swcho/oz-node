// https://npmjs.org/package/minimist
/// <reference path='../def/node.d.ts' />

declare module "sudo" {
    function sudo(aArg: string[], aOptions: any): any;
    export = sudo;
}