package com.adventurequest;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.ProductDetailsResponseListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesResponseListener;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {
    private static final String TAG = "AdventureQuest";
    private static final String BRIDGE_NAME = "AndroidBridge";

    private WebView webView;
    private BillingClient billingClient;
    private Map<String, ProductDetails> productDetailsMap = new HashMap<>();
    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;
    private String pendingRewardedType = null;
    private ExecutorService executor = Executors.newSingleThreadExecutor();
    private boolean billingReady = false;
    private boolean adsInitialized = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );

        // Disable WebView debugging in release builds
        if (!BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(false);
        }

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        setupWebView();
        setupBilling();
        setupAds();
        loadGame();
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface", "AddJavascriptInterface"})
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.NORMAL);
        settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        settings.setEnableSmoothTransition(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectBridge();
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                super.onReceivedError(view, errorCode, description, failingUrl);
                if (BuildConfig.DEBUG) {
                    Log.e(TAG, "WebView error: " + description);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                if (BuildConfig.DEBUG) {
                    Log.d("WebView", consoleMessage.message() + " (" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber() + ")");
                }
                return true;
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        webView.addJavascriptInterface(new WebAppInterface(this), BRIDGE_NAME);
    }

    private void injectBridge() {
        String js = "window.AndroidBridge = {" +
            "onPurchaseSuccess: function(productId, purchaseToken, orderId) {}," +
            "onPurchaseFailure: function(productId, errorCode, errorMessage) {}," +
            "onPurchaseCancelled: function(productId) {}," +
            "onPurchasesRestored: function(products) {}," +
            "onAdLoaded: function(adType) {}," +
            "onAdFailed: function(adType, errorCode) {}," +
            "onRewardedAdComplete: function(rewardType) {}," +
            "onBackPressed: function() { return false; }" +
        "};";
        webView.evaluateJavascript(js, null);
    }

    private void loadGame() {
        webView.loadUrl("file:///android_asset/game/index.html");
    }

    private void setupBilling() {
        billingClient = BillingClient.newBuilder(this)
            .setListener(new PurchasesUpdatedListener() {
                @Override
                public void onPurchasesUpdated(@NonNull BillingResult billingResult, @NonNull List<Purchase> purchases) {
                    handlePurchasesUpdated(billingResult, purchases);
                }
            })
            .enablePendingPurchases()
            .build();

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    billingReady = true;
                    queryProductDetails();
                    queryPurchases();
                } else {
                    if (BuildConfig.DEBUG) {
                        Log.e(TAG, "Billing setup failed: " + billingResult.getDebugMessage());
                    }
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                billingReady = false;
            }
        });
    }

    private void setupAds() {
        MobileAds.initialize(this, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                adsInitialized = true;
                loadInterstitialAd();
                loadRewardedAd();
            }
        });
    }

    private void queryProductDetails() {
        List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
        for (String productId : CONFIG.SHOP_PRODUCT_IDS) {
            productList.add(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.INAPP)
                .build());
        }

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(productList)
            .build();

        billingClient.queryProductDetailsAsync(params, new ProductDetailsResponseListener() {
            @Override
            public void onProductDetailsResponse(@NonNull BillingResult billingResult, @NonNull List<ProductDetails> productDetailsList) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    for (ProductDetails details : productDetailsList) {
                        productDetailsMap.put(details.getProductId(), details);
                    }
                    sendProductDetailsToJS();
                }
            }
        });
    }

    private void sendProductDetailsToJS() {
        try {
            JSONArray products = new JSONArray();
            for (ProductDetails details : productDetailsMap.values()) {
                JSONObject obj = new JSONObject();
                obj.put("productId", details.getProductId());
                obj.put("title", details.getTitle());
                obj.put("description", details.getDescription());
                obj.put("price", details.getPrice());
                obj.put("priceAmountMicros", details.getPriceAmountMicros());
                obj.put("priceCurrencyCode", details.getPriceCurrencyCode());
                products.put(obj);
            }

            String js = String.format("window.AndroidBridge.onProductDetailsLoaded(%s);", products.toString());
            webView.evaluateJavascript(js, null);
        } catch (JSONException e) {
            if (BuildConfig.DEBUG) {
                Log.e(TAG, "Error sending product details", e);
            }
        }
    }

    private void queryPurchases() {
        executor.execute(() -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();

            BillingResult result = billingClient.queryPurchases(params);
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                // Handle existing purchases - acknowledged automatically by Play
            }
        });
    }

    private void handlePurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        int responseCode = billingResult.getResponseCode();

        if (responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    if (!verifyPurchase(purchase)) {
                        if (BuildConfig.DEBUG) {
                            Log.e(TAG, "Purchase verification failed: " + purchase.getOrderId());
                        }
                        continue;
                    }

                    String productId = purchase.getProducts().get(0);
                    String purchaseToken = purchase.getPurchaseToken();
                    String orderId = purchase.getOrderId();

                    String js = String.format(
                        "window.AndroidBridge.onPurchaseSuccess('%s', '%s', '%s');",
                        productId, purchaseToken, orderId
                    );
                    webView.evaluateJavascript(js, null);

                    if (!purchase.isAcknowledged()) {
                        acknowledgePurchase(purchase);
                    }
                } else if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                    String productId = purchase.getProducts().get(0);
                    String js = String.format(
                        "window.AndroidBridge.onPurchaseFailure('%s', %d, '%s');",
                        productId, BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED, "Purchase pending"
                    );
                    webView.evaluateJavascript(js, null);
                }
            }
        } else if (responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            String js = "window.AndroidBridge.onPurchaseCancelled('');";
            webView.evaluateJavascript(js, null);
        } else if (responseCode == BillingClient.BillingResponseCode.NETWORK_ERROR) {
            String js = "window.AndroidBridge.onPurchaseFailure('', " + responseCode + ", 'Network error');";
            webView.evaluateJavascript(js, null);
        } else if (responseCode == BillingClient.BillingResponseCode.BILLING_UNAVAILABLE) {
            String js = "window.AndroidBridge.onPurchaseFailure('', " + responseCode + ", 'Billing unavailable');";
            webView.evaluateJavascript(js, null);
        } else {
            if (BuildConfig.DEBUG) {
                Log.e(TAG, "Purchase error: " + billingResult.getDebugMessage());
            }
        }
    }

    private boolean verifyPurchase(Purchase purchase) {
        // In production, verify purchase signature with your backend
        // For offline-first game, we trust Play's local verification
        return purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED
            && purchase.getPurchaseToken() != null
            && !purchase.getPurchaseToken().isEmpty();
    }

    private void acknowledgePurchase(Purchase purchase) {
        billingClient.acknowledgePurchase(
            com.android.billingclient.api.AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build(),
            billingResult -> {
                if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    if (BuildConfig.DEBUG) {
                        Log.e(TAG, "Acknowledge failed: " + billingResult.getDebugMessage());
                    }
                }
            }
        );
    }

    public void launchPurchaseFlow(String productId) {
        if (!billingReady || !productDetailsMap.containsKey(productId)) {
            runOnUiThread(() -> Toast.makeText(this, "Billing not ready", Toast.LENGTH_SHORT).show());
            return;
        }

        ProductDetails details = productDetailsMap.get(productId);
        BillingFlowParams params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(java.util.Collections.singletonList(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details)
                    .build()
            ))
            .build();

        BillingResult result = billingClient.launchBillingFlow(this, params);
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            if (BuildConfig.DEBUG) {
                Log.e(TAG, "Launch billing flow failed: " + result.getDebugMessage());
            }
        }
    }

    public void restorePurchases() {
        if (!billingReady) return;

        executor.execute(() -> {
            QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();

            BillingResult result = billingClient.queryPurchases(params);
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                // Restored purchases are handled via PurchasesUpdatedListener
            }
        });
    }

    private String getInterstitialAdUnitId() {
        return BuildConfig.USE_TEST_ADS
            ? "ca-app-pub-3940256099942544/1033173712"
            : getString(R.string.admob_interstitial_id);
    }

    private String getRewardedAdUnitId() {
        return BuildConfig.USE_TEST_ADS
            ? "ca-app-pub-3940256099942544/5224354917"
            : getString(R.string.admob_rewarded_id);
    }

    private void loadInterstitialAd() {
        if (!adsInitialized) return;

        AdRequest adRequest = new AdRequest.Builder().build();
        InterstitialAd.load(this, getInterstitialAdUnitId(), adRequest, new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull InterstitialAd ad) {
                interstitialAd = ad;
                interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        loadInterstitialAd();
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(@NonNull LoadAdError loadAdError) {
                        if (BuildConfig.DEBUG) {
                            Log.e(TAG, "Interstitial failed to show: " + loadAdError.getMessage());
                        }
                        loadInterstitialAd();
                    }
                });
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                if (BuildConfig.DEBUG) {
                    Log.e(TAG, "Interstitial ad failed to load: " + loadAdError.getMessage());
                }
            }
        });
    }

    public void showInterstitialAd() {
        runOnUiThread(() -> {
            if (interstitialAd != null) {
                interstitialAd.show(this);
            } else {
                loadInterstitialAd();
            }
        });
    }

    private void loadRewardedAd() {
        if (!adsInitialized) return;

        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, getRewardedAdUnitId(), adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd ad) {
                rewardedAd = ad;
                rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        loadRewardedAd();
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(@NonNull LoadAdError loadAdError) {
                        if (BuildConfig.DEBUG) {
                            Log.e(TAG, "Rewarded ad failed to show: " + loadAdError.getMessage());
                        }
                        loadRewardedAd();
                    }
                });
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                if (BuildConfig.DEBUG) {
                    Log.e(TAG, "Rewarded ad failed to load: " + loadAdError.getMessage());
                }
            }
        });
    }

    public void showRewardedAd(String rewardType) {
        pendingRewardedType = rewardType;
        runOnUiThread(() -> {
            if (rewardedAd != null) {
                rewardedAd.show(this, rewardItem -> {
                    String js = String.format("window.AndroidBridge.onRewardedAdComplete('%s');", rewardType);
                    webView.evaluateJavascript(js, null);
                });
            } else {
                loadRewardedAd();
                if (BuildConfig.DEBUG) {
                    Toast.makeText(this, "Ad not ready", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    @Override
    public void onBackPressed() {
        String js = "window.AndroidBridge.onBackPressed();";
        webView.evaluateJavascript(js, value -> {
            if ("false".equals(value)) {
                super.onBackPressed();
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executor.shutdown();
        if (billingClient != null && billingClient.isReady()) {
            billingClient.endConnection();
        }
        webView.destroy();
    }

    public static class CONFIG {
        public static final String[] SHOP_PRODUCT_IDS = {
            "coins_small", "coins_medium", "coins_large", "coins_mega",
            "skin_red", "skin_blue", "skin_gold",
            "trail_fire", "trail_ice", "trail_shadow",
            "outfit_ninja", "outfit_knight",
            "powerup_life", "powerup_shield", "powerup_boost",
            "bundle_starter", "bundle_pro"
        };
    }

    public class WebAppInterface {
        private Context context;

        public WebAppInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void purchaseProduct(String productId) {
            runOnUiThread(() -> launchPurchaseFlow(productId));
        }

        @JavascriptInterface
        public void restorePurchases() {
            runOnUiThread(() -> MainActivity.this.restorePurchases());
        }

        @JavascriptInterface
        public void showInterstitialAd() {
            runOnUiThread(() -> MainActivity.this.showInterstitialAd());
        }

        @JavascriptInterface
        public void showRewardedAd(String rewardType) {
            runOnUiThread(() -> MainActivity.this.showRewardedAd(rewardType));
        }

        @JavascriptInterface
        public void vibrate(long duration) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // VibrationEffect API (API 26+)
            } else {
                // Legacy vibrate (API 1+)
                android.os.Vibrator vibrator = (android.os.Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
                if (vibrator != null) {
                    vibrator.vibrate(duration);
                }
            }
        }

        @JavascriptInterface
        public void setKeepScreenOn(boolean keepOn) {
            runOnUiThread(() -> {
                if (keepOn) {
                    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                } else {
                    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
        }

        @JavascriptInterface
        public void exitGame() {
            runOnUiThread(() -> finish());
        }
    }
}