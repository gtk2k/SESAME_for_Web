import Utils from './utils.js';

export default class Pasori {
    constructor(opts) {
        this.device = null;
        Object.assign(this, opts);
    }

    async requestDevice() {
        try {
            // PaSoriデバイス取得
            this.device = await navigator.usb.requestDevice({ filters: [{ vendorId: 0x054c, productId: 0x06C1 }] });
        } catch (err) {
            throw err;
        }
    }

    async connect() {
        try {
            await this.device.open();
            await this.device.selectConfiguration(1);
            await this.device.claimInterface(0);
            console.log('PaSoRi connected.');
        } catch (err) {
            throw err;
        }
    }

    async sleep(msec) {
        return new Promise(resolve => setTimeout(resolve, msec));
    }

    async send(data) {
        await this.device.transferOut(2, Utils.toBin(data));
        await this.sleep(10);
    }

    async receive(device, len) {
        let data = await this.device.transferIn(1, len);
        await this.sleep(10);
        let arr = [];
        for (let i = data.data.byteOffset; i < data.data.byteLength; i++) {
            arr.push(data.data.getUint8(i));
        }
        return arr;
    }

    async polling() {
        let idm = '';
        while (!(idm = await this.getIdm()));
        if (this.onIdmReceived) {
            this.onIdmReceived(idm);
        }
    }

    async getIdm() {
        const rec = async (type = 0) => {
            await this.receive(this.device, 6);
            if (type === 0)
                await this.receive(this.device, 13);
        }
        await this.send('0000ff00ff00');
        await this.send('0000ffffff0300fdd62a01ff00');
        await rec();
        await this.send('0000ffffff0300fdd606002400');
        await rec();
        await this.send('0000ffffff0300fdd606002400');
        await rec();
        await this.send('0000ffffff0600fad60001010f011800');
        await rec();
        await this.send('0000ffffff2800d8d60200180101020103000400050006000708080009000a000b000c000e040f0010001100120013064b00');
        await rec();
        await this.send('0000ffffff0400fcd60200181000');
        await rec();
        await this.send('0000ffffff0a00f6d6046e000600ffff0100b300');
        await rec(1);
        let idm = (await this.receive(this.device, 37)).slice(17, 25);
        if (idm.length > 0) {
            const idmStr = Utils.toStr(idm);
            console.log(idmStr);
            return idmStr;
        } else {
            return '';
        }
    }
}