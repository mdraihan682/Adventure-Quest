package com.adventurequest;

import android.app.Application;
import android.content.Context;
import android.util.Log;
import android.webkit.WebView;

public class AdventureQuestApplication extends Application {
    private static final String TAG = "AdventureQuestApp";

    @Override
    public void onCreate() {
        super.onCreate();

        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        Log.d(TAG, "Adventure Quest Application started");
    }
}