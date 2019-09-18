# 開けゴマ！ for Web
Web Bluetooth API と WebUSB API を使ってブラウザーからBluetooth接続でSESAMEをコントロールするというものです。

# はじめに
この「開けゴマ！ for Web」は、Root化したAndroidを使用してパスワードを取得して、そのパスワードを使って開錠するというハードルが高いものとなっております。申し訳ございません。詳しくは ode (@odetarou) さんの[SESAMEハック記事](https://qiita.com/odetarou/items/9628d66d4d94290b5f2d)を見てください。

# Special Thanx!!
ode (@odetarou) さん  
べあのはし (@@beahashy) さん  
O. TOBE as わーぷ (@warp185) さん  

# PaSoRi
WindowsでPaSoRiをWebUSBで認識させるには[Zadig](https://zadig.akeo.ie/)をつかってドライバーをWinUSBに切り替える必要があります。

# きっかけ
ode (@odetarou) さんが、Bluetooth をハックして実装中という[ツイート](https://twitter.com/odetarou/status/1150098558328041472)を拝見したのおおもとのきっかけでした。  
その後、SESAMEハックの[記事](https://qiita.com/odetarou/items/9628d66d4d94290b5f2d)を書かれており、Node.js のソースも載せてありましたので、これなら Web Bluetooth API でも行けるんじゃね？ということで実装しました。ですのでこれは、ode さんのプロジェクトのWeb移植版
という形となります。

# 操作方法
まず、MACアドレスとパスワードを入力しなければなりません。

### MACアドレス
MACアドレスは odeさん の Qiita の[記事](https://qiita.com/odetarou/items/9628d66d4d94290b5f2d)にも紹介されている [BLE Scanner](https://play.google.com/store/apps/details?id=com.macdom.ble.blescanner&hl=ja) などを使用して、デバイスのMACアドレス(Manufacturer Data)を調べて":"(コロン)を外した形で入力します。(12文字)

### パスワード
パスワードは、SESAMEハックの[記事](https://qiita.com/odetarou/items/9628d66d4d94290b5f2d)を参考に Root化 した Android を使用して、SESAMEアプリからパスワードを取得し、こちらも記号なしで16進数文字列を入力します。(64文字)

# デバイスアクセスリクエストダイアログ
MACアドレス、パスワードともに入力したら「デバイスアクセスリクエスト」ボタンをクリックすると、  
まずはWebUSBのデバイスアクセスリクエストダイアログが表示されますのでPaSoRiのデバイス名(RC-S380/*など)がリストに表示されたらそれを選択し、ダイアログの「接続」ボタンをクリックします。  
続けざまに次にWeb Bluetooth のデバイスアクセスリクエストダイアログが表示されますのでSESAMEのデバイス名が表示されたらそれを選択し、ダイアログの「接続ボタン」をクリックします。  
(※セサミのデバイス名が表示されるまで結構時間がかかる場合があります)

# スイカで開錠

### スイカ登録
あらかじめ、スイカを登録しておきます。登録は js/idmlist.js で行います。デフォルトでは '*'(ワイルドカード) が登録されており、すべてのスイカで開錠することができますが、限定させる場合は、ワイルドカードを削除して、idm を文字列で登録します。(複数登録可)
```
export default [
    'xxxxxxxxxxxxxxxx',
    'yyyyyyyyyyyyyyyy'
]
```

あとは、PaSoRi にスイカをかざせばSESAMEがアンロックされます。また、「Lock」/「Unlock」ボタンでも操作できます。

# 注意
私の手元にある PaSoRi は RC-S380/S で、これをもとにコードを組んでおります。もしかすると違うバージョンの PaSoRi だとデバイスがリストに表示されない可能性がありますのでその場合は、js/pasori.js の  requestDevice() を実行している filtersプロパティ の条件を確認して下さい。
