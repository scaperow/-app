cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/org.apache.cordova.splashscreen/www/splashscreen.js",
        "id": "org.apache.cordova.splashscreen.SplashScreen",
        "clobbers": [
            "navigator.splashscreen"
        ]
    },
    {
        "file": "plugins/cn.jpush.phonegap.JPushPlugin/www/JPushPlugin.js",
        "id": "cn.jpush.phonegap.JPushPlugin.JPushPlugin",
        "clobbers": [
            "window.plugins.jPushPlugin"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.device/www/device.js",
        "id": "org.apache.cordova.device.device",
        "clobbers": [
            "device"
        ]
    },
    {
        "file": "plugins/org.apache.cordova.inappbrowser/www/inappbrowser.js",
        "id": "org.apache.cordova.inappbrowser.inappbrowser",
        "clobbers": [
            "window.open"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "org.apache.cordova.splashscreen": "0.3.5",
    "cn.jpush.phonegap.JPushPlugin": "1.5.4",
    "org.apache.cordova.device": "0.2.13",
    "org.apache.cordova.inappbrowser": "0.5.4"
}
// BOTTOM OF METADATA
});