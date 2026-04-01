package com.geofenceguardian.app.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import com.geofenceguardian.app.plugins.SmsPlugin;

public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null) return;

        for (Object pdu : pdus) {
            SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
            String body = smsMessage.getMessageBody();
            String sender = smsMessage.getOriginatingAddress();
            long timestamp = smsMessage.getTimestampMillis();

            // Notify the Capacitor Plugin
            SmsPlugin.onSmsReceived(body, sender, timestamp);
        }
    }
}
