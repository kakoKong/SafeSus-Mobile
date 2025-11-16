import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapComponent from '../components/MapComponent';
import { apiClient } from '../lib/api';
import { getPinColor, getPinIcon } from '../utils/pins';
import { extractCoordinates, calculateDistance } from '../utils/geo';
import { isBangkokDistrict } from '../utils/location';
import { createStyles } from './LiveScreen.styles';

const { height: screenHeight } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = 120;
const SHEET_DEFAULT_HEIGHT = screenHeight * 0.4;
const SHEET_MAX_HEIGHT = screenHeight * 0.7;
const styles = createStyles(SHEET_DEFAULT_HEIGHT);

export default function LiveScreen() {
  const [location, setLocation] = useState<any>(null);
  const [nearbyPins, setNearbyPins] = useState<any[]>([]);
  const [nearbyTips, setNearbyTips] = useState<any[]>([]);
  const [nearbyZones, setNearbyZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [currentCity, setCurrentCity] = useState<any>(null);
  const [detectedCityName, setDetectedCityName] = useState<string | null>(null);
  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(null);
  const [showAllPins, setShowAllPins] = useState(false);
  const [showAllTips, setShowAllTips] = useState(false);

  const sheetHeight = useRef(new Animated.Value(SHEET_DEFAULT_HEIGHT)).current;
  const [currentHeight, setCurrentHeight] = useState(SHEET_DEFAULT_HEIGHT);
  const mapRef = useRef<any>(null);

  // Memoized calculations
  const safeZones = useMemo(() => 
    nearbyZones.filter((z: any) => z.level === 'recommended') || [], 
    [nearbyZones]
  );
  const avoidZones = useMemo(() => 
    nearbyZones.filter((z: any) => z.level === 'avoid') || [], 
    [nearbyZones]
  );
  const cautionZones = useMemo(() => 
    nearbyZones.filter((z: any) => z.level === 'caution') || [], 
    [nearbyZones]
  );

  const isCitySupported = Boolean(currentCity);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (location && currentCity && cities.length > 0) {
      loadNearbyContent();
    }
  }, [location, currentCity]);

  useEffect(() => {
    if (cities.length > 0 && location && !currentCity) {
      detectCityFromLocation();
    }
  }, [cities, location]);

  const initialize = async () => {
    setLoading(true);
    try {
      await loadCities();
      await getCurrentLocation();
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const data = await apiClient.getCities();
      const cityList = data.cities || [];
      setCities(cityList);
      return cityList;
    } catch (err) {
      console.error('Failed to load cities:', err);
      setCities([]);
      return [];
    }
  };

  const normalize = (s: string | null | undefined) => (s || '').trim().toLowerCase();

  const detectCityFromLocation = async (locationData?: any) => {
    try {
      const loc = locationData || location;
      if (!loc) return null;

      const geos = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const first = geos?.[0];
      let locationName = first?.city || first?.subregion || first?.region || null;
      const district = (first as any)?.district || first?.subregion;

      setDetectedDistrict(district || null);

      if (district && isBangkokDistrict(district)) {
        locationName = 'Bangkok';
      }

      if (!locationName) {
        setCurrentCity(null);
        setDetectedCityName(null);
        return null;
      }

      setDetectedCityName(locationName);

      if (cities.length === 0) return null;

      const geoNorm = normalize(locationName);
      const matched =
        cities.find((c) => normalize(c.name) === geoNorm) ||
        cities.find((c) => normalize(c.slug) === geoNorm) ||
        cities.find((c) => geoNorm.includes(normalize(c.slug))) ||
        cities.find((c) => normalize(c.slug).includes(geoNorm)) ||
        cities.find((c) => normalize(c.name).startsWith(geoNorm.slice(0, 4)));

      setCurrentCity(matched || null);
      return matched || null;
    } catch (err) {
      console.error('City detection error:', err);
      setCurrentCity(null);
      setDetectedCityName(null);
      return null;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to use this feature');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);

      const lat = currentLocation.coords.latitude;
      const lng = currentLocation.coords.longitude;

      let currentCities = cities;
      if (!currentCities || currentCities.length === 0) {
        currentCities = await loadCities();
      }

      const detectedCity = await detectCityFromLocation(currentLocation);
      await loadNearbyContentForLocation(lat, lng, detectedCity);
    } catch (err) {
      console.error('Location error:', err);
      setError('Unable to get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyContentForLocation = async (latitude: number, longitude: number, city: any) => {
    try {
      if (city) {
        const cityData = await apiClient.getCity(city.slug);

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
        setNearbyZones(cityData.city?.zones || []);
      } else {
        const data = await apiClient.getNearbyPinsAndTips(latitude, longitude, {
          include: 'pins,tips',
          radius: 5000,
          limit: 100,
        });

        let pins = (data.pins || [])
          .map((pin: any) => {
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
          })
          .filter((p: any) => p.distance !== null)
          .sort((a: any, b: any) => a.distance - b.distance);

        let tips = (data.tips || [])
          .map((tip: any) => {
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
          })
          .sort((a: any, b: any) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });

        setNearbyPins(pins);
        setNearbyTips(tips);
        setNearbyZones([]);
      }
    } catch (err) {
      console.error('Nearby content error:', err);
      setNearbyPins([]);
      setNearbyTips([]);
      setNearbyZones([]);
    }
  };

  const loadNearbyContent = async () => {
    if (!location) return;
    const { latitude, longitude } = location.coords;
    await loadNearbyContentForLocation(latitude, longitude, currentCity);
  };

  const handlePinPress = (pin: any) => {
    const coords = extractCoordinates(pin);
    if (coords) {
      try {
        if (mapRef.current?.animateToRegion) {
          mapRef.current.animateToRegion(
            { latitude: coords.lat, longitude: coords.lng },
            800
          );
        }
      } catch {}
    }
    setSelectedItem({ type: 'pin', data: pin });
  };

  const handleZonePress = (zone: any) => {
    setSelectedItem({ type: 'zone', data: zone });
  };

  const handleTipPress = (tip: any) => {
    setSelectedItem({ type: 'tip', data: tip });
  };

  const closeModal = () => {
    setSelectedItem(null);
  };

  const centerToMyLocation = () => {
    if (location?.coords && mapRef.current?.animateToRegion) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        800
      );
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (location) {
      await loadNearbyContentForLocation(
        location.coords.latitude,
        location.coords.longitude,
        currentCity
      );
    }
    setRefreshing(false);
  }, [location, currentCity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = currentHeight - gestureState.dy;
        if (newHeight >= SHEET_MIN_HEIGHT && newHeight <= SHEET_MAX_HEIGHT) {
          sheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = currentHeight - gestureState.dy;
        let finalHeight = SHEET_DEFAULT_HEIGHT;

        if (gestureState.vy > 0.5 || newHeight < SHEET_DEFAULT_HEIGHT - 50) {
          finalHeight = SHEET_MIN_HEIGHT;
        } else if (gestureState.vy < -0.5 || newHeight > SHEET_DEFAULT_HEIGHT + 50) {
          finalHeight = SHEET_MAX_HEIGHT;
        }

        setCurrentHeight(finalHeight);
        Animated.spring(sheetHeight, {
          toValue: finalHeight,
          useNativeDriver: false,
          tension: 50,
          friction: 8,
        }).start();
      },
    })
  ).current;

  const getCenter = (): [number, number] => {
    if (location?.coords) {
      return [location.coords.longitude, location.coords.latitude];
    }
    return [100.5018, 13.7563];
  };

  const formatDistance = (meters: number | null) => {
    if (meters === null || meters === undefined) return null;
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading live safety data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="location-outline" size={64} color="#ccc" />
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <View style={styles.headerContent}>
          <View style={styles.locationInfo}>
            <View style={styles.locationIconWrapper}>
              <Ionicons name="navigate-circle" size={24} color="#667eea" />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.modernCityName}>
                {currentCity?.name || detectedCityName || 'Your Location'}
              </Text>
              {detectedDistrict && (
                <Text style={styles.modernDistrictName}>{detectedDistrict}</Text>
              )}
              {!isCitySupported && detectedCityName && !detectedDistrict && (
                <View style={styles.modernUnsupportedBadge}>
                  <Ionicons name="alert-circle" size={10} color="#f59e0b" />
                  <Text style={styles.modernUnsupportedLabel}>Not supported</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.modernRefreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapComponent
          ref={mapRef}
          zones={nearbyZones}
          pins={nearbyPins}
          onZonePress={handleZonePress}
          onPinPress={handlePinPress}
          initialCenter={getCenter()}
          initialZoom={13}
          bottomOffset={SHEET_DEFAULT_HEIGHT + 16}
        />
      </View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.modernBottomSheet, { height: sheetHeight }]}>
        <View {...panResponder.panHandlers} style={styles.modernDragHandleArea}>
          <View style={styles.modernDragHandle} />
        </View>

        {/* Quick Stats */}
        {isCitySupported && (
          <View style={styles.modernStatsBar}>
            <View style={styles.modernStatItem}>
              <View style={[styles.modernStatIcon, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
              </View>
              <Text style={styles.modernStatNumber}>{safeZones.length}</Text>
            </View>
            <View style={styles.modernStatDivider} />
            <View style={styles.modernStatItem}>
              <View style={[styles.modernStatIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="alert-circle" size={16} color="#f59e0b" />
              </View>
              <Text style={styles.modernStatNumber}>{cautionZones.length}</Text>
            </View>
            <View style={styles.modernStatDivider} />
            <View style={styles.modernStatItem}>
              <View style={[styles.modernStatIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="warning" size={16} color="#ef4444" />
              </View>
              <Text style={styles.modernStatNumber}>{avoidZones.length}</Text>
            </View>
            <View style={styles.modernStatDivider} />
            <View style={styles.modernStatItem}>
              <View style={[styles.modernStatIcon, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="location" size={16} color="#667eea" />
              </View>
              <Text style={styles.modernStatNumber}>{nearbyPins.length}</Text>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.modernListScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />
          }
        >
          {/* Incidents */}
          {nearbyPins.length > 0 && (
            <View style={styles.modernSection}>
              <View style={styles.modernSectionHeader}>
                <View>
                  <Text style={styles.modernSectionLabel}>🚨 NEARBY RISK</Text>
                  <Text style={styles.modernSectionTitle}>Incidents</Text>
                </View>
                <View style={styles.modernCountBadge}>
                  <Text style={styles.modernCountBadgeText}>{nearbyPins.length}</Text>
                </View>
              </View>
              {nearbyPins.slice(0, showAllPins ? nearbyPins.length : 4).map((pin: any) => (
                <TouchableOpacity
                  key={pin.id}
                  style={styles.modernListCard}
                  onPress={() => handlePinPress(pin)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.modernListIcon,
                      { backgroundColor: getPinColor(pin.type) },
                    ]}
                  >
                    <Ionicons
                      name={getPinIcon(pin.type) as any}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.modernListContent}>
                    <Text style={styles.modernListTitle} numberOfLines={1}>
                      {pin.title}
                    </Text>
                    <Text style={styles.modernListSubtitle} numberOfLines={1}>
                      {pin.summary}
                    </Text>
                    {pin.distance && (
                      <View style={styles.modernDistanceBadge}>
                        <Ionicons name="location" size={10} color="#667eea" />
                        <Text style={styles.modernDistanceText}>
                          {formatDistance(pin.distance)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
              {nearbyPins.length > 4 && (
                <TouchableOpacity
                  style={styles.modernShowMoreButton}
                  onPress={() => setShowAllPins(!showAllPins)}
                >
                  <Text style={styles.modernShowMoreText}>
                    {showAllPins ? 'Show Less' : `View ${nearbyPins.length - 4} More`}
                  </Text>
                  <Ionicons 
                    name={showAllPins ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#667eea" 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tips & Tricks */}
          {nearbyTips.length > 0 && (
            <View style={styles.modernSection}>
              <View style={styles.modernSectionHeader}>
                <View>
                  <Text style={styles.modernSectionLabel}>💡 STAY SMART</Text>
                  <Text style={styles.modernSectionTitle}>Tips & Tricks</Text>
                </View>
                <View style={[styles.modernCountBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.modernCountBadgeText, { color: '#16a34a' }]}>
                    {nearbyTips.length}
                  </Text>
                </View>
              </View>
              {nearbyTips.slice(0, showAllTips ? nearbyTips.length : 4).map((tip: any) => (
                <TouchableOpacity
                  key={tip.id}
                  style={styles.modernListCard}
                  onPress={() => handleTipPress(tip)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modernListIcon, { backgroundColor: '#22c55e' }]}>
                    <Ionicons name="bulb" size={20} color="#fff" />
                  </View>
                  <View style={styles.modernListContent}>
                    <Text style={styles.modernListTitle} numberOfLines={1}>
                      {tip.title}
                    </Text>
                    <Text style={styles.modernListSubtitle} numberOfLines={1}>
                      {tip.summary}
                    </Text>
                    {tip.distance && (
                      <View style={styles.modernDistanceBadge}>
                        <Ionicons name="location" size={10} color="#667eea" />
                        <Text style={styles.modernDistanceText}>
                          {formatDistance(tip.distance)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
              {nearbyTips.length > 4 && (
                <TouchableOpacity
                  style={styles.modernShowMoreButton}
                  onPress={() => setShowAllTips(!showAllTips)}
                >
                  <Text style={styles.modernShowMoreText}>
                    {showAllTips ? 'Show Less' : `View ${nearbyTips.length - 4} More`}
                  </Text>
                  <Ionicons 
                    name={showAllTips ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color="#667eea" 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {nearbyPins.length === 0 && nearbyTips.length === 0 && (
            <View style={styles.modernEmptyState}>
              <View style={styles.modernEmptyIcon}>
                <Ionicons name="checkmark-circle" size={56} color="#22c55e" />
              </View>
              <Text style={styles.modernEmptyTitle}>All Clear! ✨</Text>
              <Text style={styles.modernEmptyText}>
                No incidents or alerts in your area
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <Ionicons name="close-circle" size={32} color="#ffffff" />
            </TouchableOpacity>

            {selectedItem?.type === 'pin' && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIcon,
                      { backgroundColor: getPinColor(selectedItem.data.type) },
                    ]}
                  >
                    <Ionicons
                      name={getPinIcon(selectedItem.data.type) as any}
                      size={36}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.modalTitle}>{selectedItem.data.title}</Text>
                  {selectedItem.data.distance && (
                    <View style={styles.modalDistanceBadge}>
                      <Ionicons name="location" size={14} color="#667eea" />
                      <Text style={styles.modalDistanceText}>
                        {formatDistance(selectedItem.data.distance)}
                      </Text>
                    </View>
                  )}
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalDescription}>
                    {selectedItem.data.description || selectedItem.data.summary}
                  </Text>

                  <View style={styles.modalInfo}>
                    {selectedItem.data.type && (
                      <View style={styles.modalInfoItem}>
                        <View style={styles.modalInfoIcon}>
                          <Ionicons name="pricetag" size={18} color="#667eea" />
                        </View>
                        <View>
                          <Text style={styles.modalInfoLabel}>Type</Text>
                          <Text style={styles.modalInfoValue}>
                            {selectedItem.data.type.charAt(0).toUpperCase() + 
                             selectedItem.data.type.slice(1)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedItem.data.created_at && (
                      <View style={styles.modalInfoItem}>
                        <View style={styles.modalInfoIcon}>
                          <Ionicons name="time" size={18} color="#667eea" />
                        </View>
                        <View>
                          <Text style={styles.modalInfoLabel}>Reported</Text>
                          <Text style={styles.modalInfoValue}>
                            {new Date(selectedItem.data.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}

            {selectedItem?.type === 'zone' && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIcon,
                      {
                        backgroundColor:
                          selectedItem.data.level === 'recommended'
                            ? '#22c55e'
                            : selectedItem.data.level === 'caution'
                            ? '#f59e0b'
                            : '#ef4444',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        selectedItem.data.level === 'recommended'
                          ? 'checkmark-circle'
                          : selectedItem.data.level === 'caution'
                          ? 'alert-circle'
                          : 'warning'
                      }
                      size={36}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.modalTitle}>{selectedItem.data.label}</Text>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalDescription}>
                    {selectedItem.data.reason_long || selectedItem.data.reason_short}
                  </Text>
                </ScrollView>
              </>
            )}

            {selectedItem?.type === 'tip' && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIcon, { backgroundColor: '#22c55e' }]}>
                    <Ionicons name="bulb" size={36} color="#fff" />
                  </View>
                  <Text style={styles.modalTitle}>{selectedItem.data.title}</Text>
                  {selectedItem.data.distance && (
                    <View style={styles.modalDistanceBadge}>
                      <Ionicons name="location" size={14} color="#667eea" />
                      <Text style={styles.modalDistanceText}>
                        {formatDistance(selectedItem.data.distance)}
                      </Text>
                    </View>
                  )}
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalDescription}>
                    {selectedItem.data.description || selectedItem.data.summary}
                  </Text>

                  {selectedItem.data.city_name && (
                    <View style={styles.modalInfo}>
                      <View style={styles.modalInfoItem}>
                        <View style={styles.modalInfoIcon}>
                          <Ionicons name="location" size={18} color="#667eea" />
                        </View>
                        <View>
                          <Text style={styles.modalInfoLabel}>Location</Text>
                          <Text style={styles.modalInfoValue}>{selectedItem.data.city_name}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}