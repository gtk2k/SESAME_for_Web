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
                userId: txtUserId.value
            });

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