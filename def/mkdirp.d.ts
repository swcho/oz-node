// https://www.npmjs.org/package/mkdirp

declare module "mkdirp" {
    function mkdirp(aArg: any): any;
    module mkdirp {
        export function sync(dir: any, mode?: any);
    }
    export = mkdirp;
}