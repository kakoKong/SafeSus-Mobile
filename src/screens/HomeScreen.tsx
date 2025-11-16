import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
  ImageBackground,
} from 'react-native';
import styles from './HomeScreen.styles';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import type { City } from '../types';
import { supabase } from '../lib/supabase';
import CityDetailScreen from './CityDetailScreen';
import * as Location from 'expo-location';
import { extractCoordinates, calculateDistance } from '../utils/geo';
import { isBangkokDistrict, findMatchingCity } from '../utils/location';

const MAX_ITEMS_TO_SHOW = 4; // Show 4 items for both incidents and tips

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  // Core state
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Location state
  const [location, setLocation] = useState<any>(null);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [detectedCityName, setDetectedCityName] = useState<string | null>(null);

  // Content state
  const [nearbyPins, setNearbyPins] = useState<any[]>([]);
  const [nearbyTips, setNearbyTips] = useState<any[]>([]);
  const [featuredTips, setFeaturedTips] = useState<any[]>([]);

  // Modal state
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedTip, setSelectedTip] = useState<any>(null);

  // Initial load
  useEffect(() => {
    initialize();
  }, []);

  // Re-fetch nearby content when location or city changes
  useEffect(() => {
    if (location && currentCity) {
      loadNearbyContent();
    }
  }, [location, currentCity]);

  // Re-detect city when cities list loads
  useEffect(() => {
    if (cities.length > 0 && location && !currentCity) {
      detectCityFromLocation();
    }
  }, [cities, location]);

  const initialize = async () => {
    setLoading(true);
    try {
      await loadCities();
      await checkAuth();
      await loadFeaturedTips();
      await requestLocationAndDetectCity();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadNearbyContent(),
        loadFeaturedTips(),
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [location]);

  const loadCities = async () => {
    try {
      const data = await apiClient.getCities();
      setCities(data.cities || []);
    } catch (error) {
      console.error('Error loading cities:', error);
      Alert.alert('Error', 'Failed to load cities');
    }
  };

  const getCityBackground = () => {
    if (!currentCity) return null;

    const name = currentCity.name?.toLowerCase() || '';
    const slug = (currentCity as any).slug?.toLowerCase?.() || '';

    const isBangkok =
      slug === 'bangkok' ||
      name.includes('bangkok') ||
      name.includes('krung thep');

    if (isBangkok) {
      return require('../../assets/cities/bangkok.png');
    }

    return null;
  };

  const requestLocationAndDetectCity = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDetectedCityName('Location permission denied');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(current);

      await detectCityFromLocation(current);
    } catch (error) {
      console.error('Location error:', error);
      setDetectedCityName('Location unavailable');
    }
  };

  const detectCityFromLocation = async (locationData?: any) => {
    try {
      const loc = locationData || location;
      if (!loc) return;

      const geos = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const first = geos?.[0];
      let locationName = first?.city || first?.subregion || first?.region || null;
      const district = (first as any)?.district || first?.subregion;

      if (district && isBangkokDistrict(district)) {
        locationName = 'Bangkok';
      }

      if (!locationName) {
        setDetectedCityName('Unknown location');
        return;
      }

      setDetectedCityName(locationName);

      if (cities.length > 0) {
        const matched = findMatchingCity(locationName, cities);
        setCurrentCity(matched);
      }
    } catch (error) {
      console.error('Detect city error:', error);
      setDetectedCityName('Location unavailable');
    }
  };

  const loadNearbyContent = async () => {
    if (!location) return;

    try {
      const { latitude, longitude } = location.coords;

      if (currentCity) {
        const cityData = await apiClient.getCity(currentCity.slug);

        let pins = (cityData.city?.pins || [])
          .filter((p: any) => p.status === 'approved')
          .map((pin: any) => {
            const coords = extractCoordinates(pin);
            if (coords) {
              return {
                ...pin,
                latitude: coords.lat,
                longitude: coords.lng,
                distance: calculateDistance(latitude, longitude, coords.lat, coords.lng),
              };
            }
            return { ...pin, distance: null };
          })
          .filter((p: any) => p.distance !== null)
          .sort((a: any, b: any) => a.distance - b.distance);

        let tips = (cityData.city?.tips || [])
          .filter((t: any) => t.status === 'approved')
          .map((tip: any) => {
            const coords = extractCoordinates(tip);
            if (coords) {
              return {
                ...tip,
                latitude: coords.lat,
                longitude: coords.lng,
                distance: calculateDistance(latitude, longitude, coords.lat, coords.lng),
              };
            }
            return { ...tip, distance: null };
          })
          .sort((a: any, b: any) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });

        setNearbyPins(pins);
        setNearbyTips(tips);
      } else {
        const data = await apiClient.getNearbyPinsAndTips(latitude, longitude, {
          include: 'pins,tips',
          radius: 5000,
          limit: 100,
        });

        let pins = (data.pins || []).map((pin: any) => {
          const coords = extractCoordinates(pin);
          if (coords && !pin.distance) {
            return {
              ...pin,
              latitude: coords.lat,
              longitude: coords.lng,
              distance: calculateDistance(latitude, longitude, coords.lat, coords.lng),
            };
          }
          return { ...pin, distance: pin.distance || null };
        }).filter((p: any) => p.distance !== null)
          .sort((a: any, b: any) => a.distance - b.distance);

        let tips = (data.tips || []).map((tip: any) => {
          const coords = extractCoordinates(tip);
          if (coords && !tip.distance) {
            return {
              ...tip,
              latitude: coords.lat,
              longitude: coords.lng,
              distance: calculateDistance(latitude, longitude, coords.lat, coords.lng),
            };
          }
          return { ...tip, distance: tip.distance || null };
        }).sort((a: any, b: any) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        setNearbyPins(pins);
        setNearbyTips(tips);
      }
    } catch (error) {
      console.error('Nearby content error:', error);
      setNearbyPins([]);
      setNearbyTips([]);
    }
  };

  const loadFeaturedTips = async () => {
    try {
      const data = await apiClient.getFeaturedTips?.(8) || { tips: [] };
      setFeaturedTips(data.tips || []);
    } catch (error) {
      console.error('Featured tips error:', error);
      try {
        const recent = await apiClient.getRecentTips();
        setFeaturedTips(recent.tips || []);
      } catch (e) {
        setFeaturedTips([]);
      }
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const signIn = async () => {
    Alert.alert(
      'Sign In',
      'Anonymous sign-ins are disabled. Please use a supported sign-in method when available.'
    );
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      console.error('Sign out error:', error);
    }
  };

  // Render city detail screen
  if (selectedCity) {
    return (
      <CityDetailScreen
        city={selectedCity}
        onClose={() => setSelectedCity(null)}
      />
    );
  }

  // Render loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading SafeSus...</Text>
      </View>
    );
  }

  const formatDistance = (meters: number | null) => {
    if (meters === null || meters === undefined) return null;
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const renderCity = ({ item }: { item: City }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => setSelectedCity(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cityIcon}>
        <Ionicons name="location" size={22} color="#667eea" />
      </View>
      <View style={styles.cityInfo}>
        <Text style={styles.cityName}>{item.name}</Text>
        <Text style={styles.citySlug}>{item.slug}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color="#ccc" />
    </TouchableOpacity>
  );

  const renderIncident = ({ item }: { item: any }) => {
    const distanceText = formatDistance(item.distance);

    return (
      <TouchableOpacity
        style={styles.modernIncidentCard}
        activeOpacity={0.6}
        onPress={() => setSelectedIncident(item)}
      >
        <View style={styles.incidentGradient}>
          <View style={styles.incidentHeader}>
            <View style={styles.incidentPulse}>
              <View style={styles.incidentPulseRing} />
              <Ionicons name="warning" size={20} color="#dc2626" />
            </View>
            {distanceText && (
              <View style={styles.distancePill}>
                <Ionicons name="location" size={12} color="#64748b" />
                <Text style={styles.distancePillText}>{distanceText}</Text>
              </View>
            )}
          </View>

          <Text style={styles.incidentTitle} numberOfLines={2}>
            {item.title || 'Incident near you'}
          </Text>

          <Text style={styles.incidentDesc} numberOfLines={2}>
            {item.summary || item.description || 'Stay alert in this area.'}
          </Text>

          {item.category && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{item.category}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTipItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.modernTipCard}
        activeOpacity={0.6}
        onPress={() => setSelectedTip(item)}
      >
        <View style={styles.tipGradient}>
          <View style={styles.tipIconCircle}>
            <Ionicons name="bulb" size={22} color="#22c55e" />
          </View>

          <View style={styles.tipContent}>
            <Text style={styles.tipTitle} numberOfLines={2}>
              {item.title || 'Safety Tip'}
            </Text>

            <Text style={styles.tipDesc} numberOfLines={2}>
              {item.summary || item.description || 'Stay safe'}
            </Text>

            <View style={styles.tipFooter}>
              {item.city_name && (
                <View style={styles.tipBadge}>
                  <Ionicons name="location-outline" size={12} color="#10b981" />
                  <Text style={styles.tipBadgeText}>{item.city_name}</Text>
                </View>
              )}
              {item.distance !== null && item.distance !== undefined && (
                <View style={[styles.tipBadge, { marginLeft: 8 }]}>
                  <Text style={styles.tipBadgeText}>{formatDistance(item.distance)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const pinsToShow = nearbyPins.slice(0, MAX_ITEMS_TO_SHOW);
  const tipsToShow = nearbyTips.length > 0 ? nearbyTips.slice(0, MAX_ITEMS_TO_SHOW) : featuredTips.slice(0, MAX_ITEMS_TO_SHOW);
  const cityBackground = getCityBackground();
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/safesusWithIcon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.modernHeaderTitle}>SafeSus</Text>
            {currentCity && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={12} color="#667eea" />
                <Text style={styles.locationBadgeText}>{currentCity.name}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.modernAuthButton}
          onPress={user ? signOut : signIn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={user ? "log-out-outline" : "person-circle-outline"}
            size={24}
            color="#667eea"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
          />
        }
      >
        {/* Current Location Card */}
        <View style={styles.modernLocationCard}>
          {cityBackground ? (
            <ImageBackground
              source={cityBackground}
              style={styles.locationBackgroundImage}
              imageStyle={styles.locationBackgroundImageInner}
              resizeMode="cover"
            >
              <View style={styles.locationOverlay}>
                <View style={styles.locationGradient}>
                  <Ionicons name="navigate-circle" size={32} color="#ffffff" />
                  <Text style={styles.modernLocationTitle}>
                    {currentCity ? currentCity.name : detectedCityName || 'Detecting...'}
                  </Text>
                  {!currentCity && detectedCityName && (
                    <View style={styles.modernWarningBadge}>
                      <Ionicons name="information-circle" size={14} color="#f59e0b" />
                      <Text style={styles.modernWarningText}>Not yet supported</Text>
                    </View>
                  )}
                </View>
              </View>
            </ImageBackground>
          ) : (
            <View style={styles.locationGradient}>
              <Ionicons name="navigate-circle" size={32} color="#667eea" />
              <Text style={styles.modernLocationTitle}>
                {currentCity ? currentCity.name : detectedCityName || 'Detecting...'}
              </Text>
              {!currentCity && detectedCityName && (
                <View style={styles.modernWarningBadge}>
                  <Ionicons name="information-circle" size={14} color="#f59e0b" />
                  <Text style={styles.modernWarningText}>Not yet supported</Text>
                </View>
              )}
            </View>
          )}
        </View>


        {/* Incidents Near You */}
        <View style={styles.section}>
          <View style={styles.modernSectionHeader}>
            <View>
              <Text style={styles.modernSectionLabel}>🚨 NEARBY RISK</Text>
              <Text style={styles.modernSectionTitle}>Incidents around you</Text>
            </View>
            {pinsToShow.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pinsToShow.length}</Text>
              </View>
            )}
          </View>

          {pinsToShow.length === 0 ? (
            <View style={styles.modernEmptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
              </View>
              <Text style={styles.modernEmptyTitle}>All clear! ✨</Text>
              <Text style={styles.modernEmptyText}>No incidents reported nearby</Text>
            </View>
          ) : (
            <View style={styles.modernCardGrid}>
              <FlatList
                data={pinsToShow}
                renderItem={renderIncident}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
              />

              {nearbyPins.length > pinsToShow.length && (
                <TouchableOpacity
                  style={styles.modernViewAllButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modernViewAllText}>
                    See all {nearbyPins.length} incidents
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#667eea" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.modernQuickActions}>
            <TouchableOpacity style={styles.modernActionButton} activeOpacity={0.7}>
              <View style={[styles.modernActionIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="map" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.modernActionText}>Live Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modernActionButton} activeOpacity={0.7}>
              <View style={[styles.modernActionIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="add-circle" size={28} color="#dc2626" />
              </View>
              <Text style={styles.modernActionText}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modernActionButton} activeOpacity={0.7}>
              <View style={[styles.modernActionIcon, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="chatbubbles" size={28} color="#667eea" />
              </View>
              <Text style={styles.modernActionText}>Community</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips & Tricks */}
        <View style={styles.section}>
          <View style={styles.modernSectionHeader}>
            <View>
              <Text style={styles.modernSectionLabel}>💡 STAY SMART</Text>
              <Text style={styles.modernSectionTitle}>Tips & Tricks</Text>
            </View>
            {tipsToShow.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.countBadgeText, { color: '#16a34a' }]}>{tipsToShow.length}</Text>
              </View>
            )}
          </View>

          {tipsToShow.length === 0 ? (
            <View style={styles.modernEmptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="bulb-outline" size={48} color="#94a3b8" />
              </View>
              <Text style={styles.modernEmptyText}>No tips available yet</Text>
            </View>
          ) : (
            <FlatList
              data={tipsToShow}
              renderItem={renderTipItem}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Explore Cities */}
        <View style={styles.section}>
          <View style={styles.modernSectionHeader}>
            <View>
              <Text style={styles.modernSectionLabel}>🌍 EXPLORE</Text>
              <Text style={styles.modernSectionTitle}>Cities</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: '#e0e7ff' }]}>
              <Text style={[styles.countBadgeText, { color: '#667eea' }]}>{cities.length}</Text>
            </View>
          </View>

          {cities.length === 0 ? (
            <View style={styles.modernEmptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="location-outline" size={48} color="#94a3b8" />
              </View>
              <Text style={styles.modernEmptyText}>No cities available</Text>
            </View>
          ) : (
            <FlatList
              data={cities}
              renderItem={renderCity}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Incident Detail Modal */}
      <Modal
        visible={!!selectedIncident}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIncident(null)}
      >
        <View style={styles.centeredModalOverlay}>
          <Pressable
            style={styles.centeredModalBackdrop}
            onPress={() => setSelectedIncident(null)}
          />
          <View style={styles.centeredModalContent}>
            <TouchableOpacity
              style={styles.centeredModalClose}
              onPress={() => setSelectedIncident(null)}
            >
              <Ionicons name="close-circle" size={32} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.centeredModalHeader}>
              <View style={styles.centeredModalIconWrapper}>
                <Ionicons name="warning" size={36} color="#dc2626" />
              </View>
              <Text style={styles.centeredModalTitle}>
                {selectedIncident?.title || 'Incident Details'}
              </Text>
              {selectedIncident?.distance !== null && (
                <View style={styles.centeredModalBadge}>
                  <Ionicons name="location" size={14} color="#667eea" />
                  <Text style={styles.centeredModalBadgeText}>
                    {formatDistance(selectedIncident?.distance)}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              style={styles.centeredModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.centeredModalDescription}>
                {selectedIncident?.description || selectedIncident?.summary || 'No additional details available.'}
              </Text>

              <View style={styles.centeredModalInfo}>
                {selectedIncident?.category && (
                  <View style={styles.centeredModalInfoItem}>
                    <View style={styles.centeredModalInfoIcon}>
                      <Ionicons name="pricetag" size={18} color="#667eea" />
                    </View>
                    <View>
                      <Text style={styles.centeredModalInfoLabel}>Category</Text>
                      <Text style={styles.centeredModalInfoValue}>{selectedIncident.category}</Text>
                    </View>
                  </View>
                )}

                {selectedIncident?.city_name && (
                  <View style={styles.centeredModalInfoItem}>
                    <View style={styles.centeredModalInfoIcon}>
                      <Ionicons name="location" size={18} color="#667eea" />
                    </View>
                    <View>
                      <Text style={styles.centeredModalInfoLabel}>Location</Text>
                      <Text style={styles.centeredModalInfoValue}>{selectedIncident.city_name}</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tip Detail Modal */}
      <Modal
        visible={!!selectedTip}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTip(null)}
      >
        <View style={styles.centeredModalOverlay}>
          <Pressable
            style={styles.centeredModalBackdrop}
            onPress={() => setSelectedTip(null)}
          />
          <View style={styles.centeredModalContent}>
            <TouchableOpacity
              style={styles.centeredModalClose}
              onPress={() => setSelectedTip(null)}
            >
              <Ionicons name="close-circle" size={32} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.centeredModalHeader}>
              <View style={[styles.centeredModalIconWrapper, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="bulb" size={36} color="#22c55e" />
              </View>
              <Text style={styles.centeredModalTitle}>
                {selectedTip?.title || 'Safety Tip'}
              </Text>
              {selectedTip?.distance !== null && selectedTip?.distance !== undefined && (
                <View style={styles.centeredModalBadge}>
                  <Ionicons name="location" size={14} color="#667eea" />
                  <Text style={styles.centeredModalBadgeText}>
                    {formatDistance(selectedTip?.distance)}
                  </Text>
                </View>
              )}
            </View>

            <ScrollView
              style={styles.centeredModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.centeredModalDescription}>
                {selectedTip?.description || selectedTip?.summary || 'Stay safe and informed.'}
              </Text>

              <View style={styles.centeredModalInfo}>
                {selectedTip?.city_name && (
                  <View style={styles.centeredModalInfoItem}>
                    <View style={styles.centeredModalInfoIcon}>
                      <Ionicons name="location" size={18} color="#667eea" />
                    </View>
                    <View>
                      <Text style={styles.centeredModalInfoLabel}>Location</Text>
                      <Text style={styles.centeredModalInfoValue}>{selectedTip.city_name}</Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}