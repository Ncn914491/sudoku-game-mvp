import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import mobileAds, { BannerAd, BannerAdSize, TestIds, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

// Test Ad Unit IDs (replace with your actual Ad Unit IDs in production)
const BANNER_AD_UNIT_ID = __DEV__ ? TestIds.BANNER : Platform.select({
  ios: 'your-ios-banner-ad-unit-id',
  android: 'your-android-banner-ad-unit-id',
}) as string;

const INTERSTITIAL_AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : Platform.select({
  ios: 'your-ios-interstitial-ad-unit-id',
  android: 'your-android-interstitial-ad-unit-id',
}) as string;

interface AdManagerProps {
  showBanner?: boolean;
  onAdError?: (error: string) => void;
}

let interstitialAd: InterstitialAd | null = null;

export const AdManager: React.FC<AdManagerProps> = ({ 
  showBanner = true, 
  onAdError 
}) => {
  const [isAdInitialized, setIsAdInitialized] = useState(false);

  useEffect(() => {
    initializeAds();
    return () => {
      // Cleanup
      if (interstitialAd) {
        interstitialAd = null;
      }
    };
  }, []);

  const initializeAds = async () => {
    try {
      await mobileAds().initialize();
      setIsAdInitialized(true);
      console.log('AdMob initialized successfully');
      
      // Pre-load interstitial ad
      loadInterstitialAd();
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
      onAdError?.('Failed to initialize ads');
    }
  };

  const loadInterstitialAd = () => {
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);
    
    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded');
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Interstitial ad error:', error);
      onAdError?.('Interstitial ad failed to load');
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      // Pre-load next interstitial ad
      loadInterstitialAd();
    });

    interstitialAd.load();
  };

  const handleBannerAdError = (error: Error) => {
    console.error('Banner ad error:', error);
    onAdError?.('Banner ad failed to load');
  };

  const handleBannerAdLoaded = () => {
    console.log('Banner ad loaded successfully');
  };

  if (!isAdInitialized) {
    return null;
  }

  if (!showBanner) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.FULL_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true, // For GDPR compliance
        }}
        onAdLoaded={handleBannerAdLoaded}
        onAdFailedToLoad={handleBannerAdError}
      />
    </View>
  );
};

// Static methods for interstitial ads
export const showInterstitialAd = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (interstitialAd && interstitialAd.loaded) {
      interstitialAd.show()
        .then(() => {
          console.log('Interstitial ad shown successfully');
          resolve(true);
        })
        .catch((error) => {
          console.error('Failed to show interstitial ad:', error);
          resolve(false);
        });
    } else {
      console.log('Interstitial ad not ready');
      resolve(false);
    }
  });
};

export const isInterstitialAdReady = (): boolean => {
  return interstitialAd ? interstitialAd.loaded : false;
};

// Ad frequency management
class AdFrequencyManager {
  private static instance: AdFrequencyManager;
  private lastInterstitialShown: number = 0;
  private gamesPlayedSinceLastAd: number = 0;
  private readonly MIN_TIME_BETWEEN_ADS = 180000; // 3 minutes
  private readonly GAMES_BETWEEN_ADS = 3; // Show ad every 3 games

  static getInstance(): AdFrequencyManager {
    if (!AdFrequencyManager.instance) {
      AdFrequencyManager.instance = new AdFrequencyManager();
    }
    return AdFrequencyManager.instance;
  }

  shouldShowInterstitialAd(): boolean {
    const now = Date.now();
    const timeSinceLastAd = now - this.lastInterstitialShown;
    
    return (
      timeSinceLastAd > this.MIN_TIME_BETWEEN_ADS &&
      this.gamesPlayedSinceLastAd >= this.GAMES_BETWEEN_ADS
    );
  }

  onGameCompleted() {
    this.gamesPlayedSinceLastAd++;
  }

  onInterstitialShown() {
    this.lastInterstitialShown = Date.now();
    this.gamesPlayedSinceLastAd = 0;
  }

  reset() {
    this.lastInterstitialShown = 0;
    this.gamesPlayedSinceLastAd = 0;
  }
}

export const adFrequencyManager = AdFrequencyManager.getInstance();

// Helper function to show interstitial with frequency control
export const showInterstitialWithFrequencyControl = async (): Promise<boolean> => {
  if (!adFrequencyManager.shouldShowInterstitialAd()) {
    console.log('Interstitial ad not shown due to frequency control');
    return false;
  }

  if (!isInterstitialAdReady()) {
    console.log('Interstitial ad not ready');
    return false;
  }

  const success = await showInterstitialAd();
  if (success) {
    adFrequencyManager.onInterstitialShown();
  }
  
  return success;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 5,
  },
});