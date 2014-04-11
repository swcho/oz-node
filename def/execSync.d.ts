// https://npmjs.org/package/minimist

declare module "execSync" {
    export function sh(aArg: any): any;
    export function exec(aArg: any): any;
}