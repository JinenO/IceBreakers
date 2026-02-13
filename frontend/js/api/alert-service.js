/* frontend/js/api/alert-service.js */

export const AlertService = {
    // 1. 发送简单指令 (Roll, Head, Legs)
    // 返回一个 Promise，模拟网络请求
    async sendSimpleAlert(commandId, details = '') {
        console.log(`📡 [API] Sending Alert: ${commandId} (${details})`);

        // 模拟网络延迟 0.5秒
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ [API] Alert Sent Successfully!');
                resolve({ status: 'success' });
            }, 500);
        });
    },

    // 2. 发送同步请求 (Temp, Itchy)
    // 这需要进入“等待模式”
    async requestCaregiverAssist(commandId) {
        console.log(`📡 [API] Requesting Assistance for: ${commandId}`);
        console.log('⏳ [API] Waiting for Caregiver App response...');

        // 这里我们用一个“模拟器”：
        // 在真实项目中，这里会监听 WebSocket
        // 在开发模式下，我们设置一个 3秒 的自动回复，或者你可以手动触发
        return new Promise((resolve) => {
            // 模拟：3秒后，监护人点击了手机上的 "Handle Request"
            setTimeout(() => {
                console.log(`📱 [Mock App] Caregiver clicked "Handle ${commandId}"`);
                resolve({ status: 'ready_to_interact' });
            }, 3000);
        });
    }
};
