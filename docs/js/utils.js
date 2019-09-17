export default class Utils {
    static toBin(val) {
        return new Uint8Array(val.split(/(.{2})/).filter(x => x).map(x => parseInt(x, 16)));
    }

    static toStr(val) {
        return [...(val.arr || val)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
}