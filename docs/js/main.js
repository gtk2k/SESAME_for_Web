import Sesame from './sesame.js';
import Pasori from './pasori.js';
import IdmList from './idmlist.js';
import Utils from './utils.js';

let sesame = null;
let pasori = null;

btnConnect.onclick = async _ => {
    try {
        if (/[0-9a-f]{12}/i.test(txtMacAddr.value) && /[0-9a-f]{64}/i.test(txtPassword.value)) {
            sesame = new Sesame({
                macData: Utils.toBin(txtMacAddr.value).reverse(),
                password: txtPassword.value,
                userId: 'tanaka.kenji@synamon.jp'
            });
            // sesame = new Sesame({
            //     macData: [0x5f, 0x7f, 0x60, 0x15, 0xfe, 0xf5],
            //     password: '0E39C9B3FB514825BE3C9F315764FFD0665EED28700842488ADF7DEC52FDEE96',
            //     userId: 'tanaka.kenji@synamon.jp'
            // });

            pasori = new Pasori({
                onIdmReceived: async idm => {
                    if (IdmList.includes('*') || IdmList.includes(idm)) {
                        await sesame.unlock();
                    }
                    setTimeout(async _ => {
                        await pasori.polling();
                    }, 10000);
                }
            });
            await pasori.requestDevice();
            await sesame.requestDevice();
            await pasori.connect();
            // await sesame.connect();
            await pasori.polling();
        } else {
            dispMsg.textContent = 'MACアドレス、パスワードが正しくありません';
            setTimeout(_=> dispMsg.innerHTML = '&nbsp;', 5000);
        }
    } catch (err) {
        console.error(err);
    }
}

btnLock.onclick = async _ => {
    await sesame.lock();
};

btnUnlock.onclick = async _ => {
    await sesame.unlock();
};