// https://www.npmjs.org/package/ncp

declare module "ncp" {
    export function ncp(source: string, destination: string, callback: (err: any) => void): any;
}
