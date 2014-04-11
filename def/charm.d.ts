// https://npmjs.org/package/charm

declare module "charm" {
    module c {
        export interface Charm {
            reset();
            destroy();
            end();
            write(aMsg);
            position(aX: number, aY: number);
            position(aCallback: (aX: number, aY: number) => void);
            move(aX: number, aY, number);
            up(aY: number);
            down(aY: number);
            left(aX: number);
            right(aX: number);
            push(withAttributes);
            pop(withAttributes);
            erase(s: string);
            //delete(s, n);
            cursor(visible: boolean);
        }
    }
    function c(): c.Charm;
    export = c;
}
