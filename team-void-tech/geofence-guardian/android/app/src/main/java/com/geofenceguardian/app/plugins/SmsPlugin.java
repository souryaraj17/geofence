package com.geofenceguardian.app.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SmsListener")
public class SmsPlugin extends Plugin {
    private static SmsPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    /**
     * Called when an SMS is received to notify the JS layer.
     */
    public static void onSmsReceived(String body, String sender, long timestamp) {
        if (instance == null) return;

        JSObject ret = new JSObject();
        ret.put("body", body);
        ret.put("sender", sender);
        ret.put("timestamp", timestamp);

        // Notify Listeners
        instance.notifyListeners("smsReceived", ret);
    }
}
