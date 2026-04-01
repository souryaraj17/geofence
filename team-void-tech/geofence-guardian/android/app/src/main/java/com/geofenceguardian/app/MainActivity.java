package com.geofenceguardian.app;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;
import com.geofenceguardian.app.plugins.SmsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(SmsPlugin.class);
    }
}
