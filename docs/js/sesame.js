import Utils from './utils.js';

// SESAMEは何もしていない状態が1分続くと自動的に切断される
export default class Sesame {
    constructor(opts = {}) {
        opts = {
            ...opts,
            ...{
                serviceUUID: '00001523-1212-efde-1523-785feabcd123',
                commandUUID: '00001524-1212-efde-1523-785feabcd123',
                angleUUID: '00001525-1212-efde-1523-785feabcd123',
                statusUUID: '00001526-1212-efde-1523-785feabcd123',
                lockMinAngle: 10,
                lockMaxAngle: 270,
                keepConnection: false
            }
        };
        if (!opts.password || !opts.userId || !opts.macData) {
            throw 'address, password, manufacturerDataMacData and userId are required.';
        }
        opts.password = Utils.toBin(opts.password);
        Object.assign(this, opts);
    }

    async requestDevice() {
        try {
            // SESAMEデバイス取得
            this.device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: false,
                filters: [{ services: ['00001523-1212-efde-1523-785feabcd123'] }]
            });
        } catch (err) {
            throw err;
        }
    }

    async connect() {
        try {
            // GATTサーバーからの切断イベントハンドラー設定 
            this.device.ongattserverdisconnected = this.onDisconnected.bind(this);

            if (!this.device.gatt.connected) {
                // GATTサーバーに接続
                this.server = await this.device.gatt.connect();
            }

            // サービス取得
            this.service = await this.server.getPrimaryService(this.serviceUUID);
            if (!this.service) throw 'Could not get service.';

            // コマンド実行キャラクタリスティック取得
            this.commandCharcteristic = await this.service.getCharacteristic(this.commandUUID);
            if (!this.commandCharcteristic) throw 'Could not get command characteristic.';

            // 角度取得キャラクタリスティック取得
            this.angleCharacteristic = await this.service.getCharacteristic(this.angleUUID);
            if (!this.angleCharacteristic) throw 'Could not get angle characteristic.';

            // ステータス取得キャラクタリスティック取得
            this.statusCharacteristic = await this.service.getCharacteristic(this.statusUUID);
            if (!this.statusCharacteristic) throw 'Could not get status characteristic.';

            // 角度取得キャラクタリスティックからの通知イベントハンドラー設定
            this.angleCharacteristic.oncharacteristicvaluechanged = evt => {
                const dv = evt.target.value;
                const angleRaw = dv.getUint16(2, true);
                const angle = Math.floor(angleRaw / 1024 * 360);
                const lockStatus = angle < this.lockMinAngle || angle > this.lockMaxAngle;
                console.log(`angle [angle: ${angle}, lockStatus: ${lockStatus}]`);
                // event.emit('lock_status_set');
            };

            // ステータス取得キャラクタリスティックからの通知イベントハンドラー取得
            this.statusCharacteristic.oncharacteristicvaluechanged = evt => {
                const dv = evt.target.value;
                const sn = dv.getUint32(6, true);
                const err = dv.getUint8(14);
                const errMsg = [
                    'Timeout',
                    'Unsupported',
                    'Success',
                    'Operating',
                    'ErrorDeviceMac',
                    'ErrorUserId',
                    'ErrorNumber',
                    'ErrorSignature',
                    'ErrorLevel',
                    'ErrorPermission',
                    'ErrorLength',
                    'ErrorUnknownCmd',
                    'ErrorBusy',
                    'ErrorEncryption',
                    'ErrorFormat',
                    'ErrorBattery',
                    'ErrorNotSend'
                ][err + 1];
                console.log(`status update [sn=${sn}, err=${errMsg}]`);
            };

            // startNotifications()を実行しないとデバイスからの通知が開始されない(oncharacteristicvaluechangedイベントが発生しない)
            // 角度取得キャラクタリスティック通知開始
            await this.angleCharacteristic.startNotifications();
            // ステータス取得キャラクタリスティック通知開始
            await this.statusCharacteristic.startNotifications();

            console.log('SESAME connected.');
        } catch (err) {
            if (err.code === 8) {
                console.log('user cancelled.');
            }
            throw err;
        }
    }

    disconnect() {
        if (this.server) {
            this.server.disconnect();
        }
    }

    onDisconnected(evt) {
        //this.device = null;
        console.log('==> disconnect');
    }

    async sign(code, payload, nonce) {
        const buf = new Buffer(payload.length + 59);
        buf.set(32, this.macData);
        buf.set(38, Utils.toBin(md5(this.userId)));
        buf.setUint32LE(54, nonce);
        buf.setUint8(58, code);
        if (payload) this.setArr(59, [...encoder.encode(payload)]); // payloadのデータ形式が不明なのでUTF-8の文字列と仮定して実装
        const cryptoKey = await crypto.subtle.importKey('raw', this.password, { name: 'HMAC', hash: 'SHA-256' }, true, ['sign']);
        const sign = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, buf.subarray(32)));
        buf.set(0, sign);

        return buf.arr;
    };

    async control(cmdValue, payload = '') {
        try {
            const data = await this.statusCharacteristic.readValue();
            const sn = data.getUint32(6, true) + 1;
            const buf = await this.sign(cmdValue, payload, sn);
            console.log(`==> cmdValue:${cmdValue}, ${sn}`);
            await this.write(buf);
        } catch (err) {
            throw err;
        }
    }

    async write(payload) {
        for (let i = 0; i < payload.byteLength; i += 19) {
            const sz = Math.min(payload.byteLength - i, 19);
            const buf = new Buffer(sz + 1);
            const header = i === 0 ? 1 : sz === 19 ? 2 : 4;
            buf.setUint8(0, header);
            buf.set(1, [...payload.subarray(i, i + 19)]);
            console.log(`write: ${Utils.toStr(buf)}`);
            await this.commandCharcteristic.writeValue(buf.arr);
        }
    }

    async lock() {
        try {
            if (!this.device || !this.device.gatt.connected) {
                await this.connect();
            }
            await this.control(1);
        } catch (err) {
            console.log(err);
        }
    }

    async unlock() {
        try {
            if (!this.device || !this.device.gatt.connected) {
                await this.connect();
            }
            await this.control(2);
        } catch (err) {
            console.log(err);
        }
    }
}

class Buffer {
    constructor(size) {
        this.arr = new Uint8Array(size);
        this.dv = new DataView(this.arr.buffer);
    }

    subarray(start, end) {
        return this.arr.subarray(start, end);
    }

    set(byteOffset, data) {
        this.arr.set(data, byteOffset);
    }

    setUint8(byteOffset, val) {
        this.dv.setUint8(byteOffset, val);
    }

    setUint32LE(byteOffset, val) {
        this.dv.setUint32(byteOffset, val, true);
    }
}