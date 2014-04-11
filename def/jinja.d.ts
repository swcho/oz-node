// https://npmjs.org/package/jinja

interface SwigTemplate {
    render(param): string;
}

declare module "jinja" {
    export function compileFile(fileName: string): SwigTemplate;
    export function compile(template: string): any;
}
