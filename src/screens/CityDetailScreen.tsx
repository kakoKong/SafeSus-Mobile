import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/api';
import MapComponent from '../components/MapComponent';
import type { City, CityDetail, Zone, Pin } from '../types';
import { getPinColor, getPinIcon } from '../utils/pins';
import styles from './CityDetailScreen.styles';

const { height } = Dimensions.get('window');
const SHEET_MIN_HEIGHT = 120;
const SHEET_MAX_HEIGHT = height * 0.75;
const SHEET_DEFAULT_HEIGHT = height * 0.4;

interface CityDetailProps {
  city: City;
  onClose: () => void;
}

export default function CityDetailScreen({ city, onClose }: CityDetailProps) {
  const [cityData, setCityData] = useState<CityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: 'pin' | 'zone'; data: Pin | Zone } | null>(null);

  const sheetHeight = useRef(new Animated.Value(SHEET_DEFAULT_HEIGHT)).current;
  const [currentHeight, setCurrentHeight] = useState(SHEET_DEFAULT_HEIGHT);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadCityData();
  }, [city]);

  const loadCityData = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCity(city.slug);
      if (data.city) {
        setCityData(data.city);
      } else {
        Alert.alert('Error', 'City data not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load city data. Please check your connection.');
      console.error('Error loading city data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCityData();
    setRefreshing(false);
  };

  const expandSheet = () => {
    setCurrentHeight(SHEET_MAX_HEIGHT);
    Animated.spring(sheetHeight, {
      toValue: SHEET_MAX_HEIGHT,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handlePinPress = (pin: Pin) => {
    setSelectedItem({ type: 'pin', data: pin });
    expandSheet();
  };

  const handleZonePress = (zone: Zone) => {
    setSelectedItem({ type: 'zone', data: zone });
    expandSheet();
  };

  const zoomToLocation = (coordinates: [number, number]) => {
    if (mapRef.current) {
      mapRef.current.animateToCoordinate(coordinates, 15);
      setCurrentHeight(SHEET_DEFAULT_HEIGHT);
      Animated.spring(sheetHeight, {
        toValue: SHEET_DEFAULT_HEIGHT,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }).start();
    }
  };

  const getCenterFromCity = (): [number, number] => {
    if (cityData && cityData.zones.length > 0) {
      const zone = cityData.zones[0];
      if (zone.geom && zone.geom.coordinates && zone.geom.coordinates[0]) {
        const coords = zone.geom.coordinates[0];
        const centerLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
        const centerLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
        return [centerLng, centerLat];
      }
    }
    // Default to Bangkok
    return [100.5018, 13.7563];
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = currentHeight - gestureState.dy;
        if (newHeight >= SHEET_MIN_HEIGHT && newHeight <= SHEET_MAX_HEIGHT) {
          sheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = currentHeight - gestureState.dy;
        let finalHeight = SHEET_DEFAULT_HEIGHT;

        if (gestureState.vy > 0.5) {
          finalHeight = SHEET_MIN_HEIGHT;
          setSelectedItem(null);
        } else if (gestureState.vy < -0.5) {
          finalHeight = SHEET_MAX_HEIGHT;
        } else {
          if (newHeight < SHEET_DEFAULT_HEIGHT - 50) {
            finalHeight = SHEET_MIN_HEIGHT;
            setSelectedItem(null);
          } else if (newHeight > SHEET_DEFAULT_HEIGHT + 50) {
            finalHeight = SHEET_MAX_HEIGHT;
          } else {
            finalHeight = SHEET_DEFAULT_HEIGHT;
          }
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

  // pin color/icon helpers moved to utils/pins

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading city data...</Text>
      </View>
    );
  }

  if (!cityData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
        <Text style={styles.loadingText}>City data not found</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const safeZones = cityData.zones?.filter((z) => z.level === 'recommended') || [];
  const avoidZones = cityData.zones?.filter((z) => z.level === 'avoid') || [];
  const cautionZones = cityData.zones?.filter((z) => z.level === 'caution') || [];
  const neutralZones = cityData.zones?.filter((z) => z.level === 'neutral') || [];
  const approvedPins = cityData.pins?.filter((p) => p.status === 'approved') || [];

  return (
    <View style={styles.container}>
      {/* City Header */}
      <View style={styles.cityHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.cityInfo}>
            <Text style={styles.cityName}>{cityData.name}</Text>
            <Text style={styles.cityCountry}>{cityData.country}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.cityStats}>
            <View style={styles.statBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.statText}>{safeZones.length}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="warning" size={16} color="#e74c3c" />
              <Text style={styles.statText}>{avoidZones.length}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="information-circle" size={16} color="#f39c12" />
              <Text style={styles.statText}>{approvedPins.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Map Component */}
      <View style={styles.mapContainer}>
        <MapComponent
          ref={mapRef}
          zones={cityData.zones || []}
          pins={approvedPins}
          onZonePress={handleZonePress}
          onPinPress={handlePinPress}
          initialCenter={getCenterFromCity()}
          initialZoom={12}
        />
      </View>

      {/* Draggable Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            height: sheetHeight,
          },
        ]}
      >
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
          <View style={styles.dragHandle} />
        </View>

        {/* Sheet Content */}
        {selectedItem ? (
          // Selected Item View
          <View style={styles.selectedItemContainer}>
            <TouchableOpacity
              style={styles.backToList}
              onPress={() => {
                setSelectedItem(null);
                setCurrentHeight(SHEET_DEFAULT_HEIGHT);
                Animated.spring(sheetHeight, {
                  toValue: SHEET_DEFAULT_HEIGHT,
                  useNativeDriver: false,
                  tension: 50,
                  friction: 8,
                }).start();
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#667eea" />
              <Text style={styles.backToListText}>Back to list</Text>
            </TouchableOpacity>

            <ScrollView style={styles.selectedContent} showsVerticalScrollIndicator={false}>
              {selectedItem.type === 'pin' ? (
                <View style={styles.detailCard}>
                  {(() => {
                    const pin = selectedItem.data as Pin;
                    return (
                      <>
                        <View
                          style={[
                            styles.detailIcon,
                            { backgroundColor: getPinColor(pin.type) },
                          ]}
                        >
                          <Ionicons
                            name={getPinIcon(pin.type) as any}
                            size={32}
                            color="#fff"
                          />
                        </View>
                        <Text style={styles.detailType}>
                          {pin.type.toUpperCase()}
                        </Text>
                        <Text style={styles.detailTitle}>{pin.title}</Text>
                        <Text style={styles.detailSummary}>{pin.summary}</Text>
                        {pin.details && (
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Details</Text>
                            <Text style={styles.detailText}>{pin.details}</Text>
                          </View>
                        )}
                        {pin.created_at && (
                          <Text style={styles.detailDate}>
                            Reported: {new Date(pin.created_at).toLocaleDateString()}
                          </Text>
                        )}
                        <TouchableOpacity
                          style={styles.zoomButton}
                          onPress={() => {
                            if (pin.location?.coordinates) {
                              zoomToLocation(pin.location.coordinates);
                            }
                          }}
                        >
                          <Ionicons name="locate" size={20} color="#667eea" />
                          <Text style={styles.zoomButtonText}>Zoom to Location</Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}
                </View>
              ) : (
                <View style={styles.detailCard}>
                  {(() => {
                    const zone = selectedItem.data as Zone;
                    return (
                      <>
                        <View
                          style={[
                            styles.detailIcon,
                            {
                              backgroundColor:
                                zone.level === 'recommended'
                                  ? '#27ae60'
                                  : zone.level === 'caution'
                                  ? '#f39c12'
                                  : zone.level === 'avoid'
                                  ? '#e74c3c'
                                  : '#3498db',
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              zone.level === 'recommended'
                                ? 'checkmark-circle'
                                : zone.level === 'caution'
                                ? 'warning'
                                : 'close-circle'
                            }
                            size={32}
                            color="#fff"
                          />
                        </View>
                        <Text style={styles.detailType}>
                          {zone.level === 'recommended'
                            ? 'SAFE ZONE'
                            : zone.level === 'caution'
                            ? 'CAUTION ZONE'
                            : zone.level === 'avoid'
                            ? 'AVOID ZONE'
                            : 'NEUTRAL ZONE'}
                        </Text>
                        <Text style={styles.detailTitle}>{zone.label}</Text>
                        <Text style={styles.detailSummary}>
                          {zone.reason_short}
                        </Text>
                        {zone.reason_long && (
                          <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>More Information</Text>
                            <Text style={styles.detailText}>
                              {zone.reason_long}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  })()}

                  {/* Zoom to Zone Button */}
                  <TouchableOpacity
                    style={styles.zoomButton}
                    onPress={() => {
                      const zone = selectedItem.data as Zone;
                      if (zone.geom && zone.geom.coordinates && zone.geom.coordinates[0]) {
                        const coords = zone.geom.coordinates[0];
                        const centerLng =
                          coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
                        const centerLat =
                          coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;
                        zoomToLocation([centerLng, centerLat]);
                      }
                    }}
                  >
                    <Ionicons name="locate" size={20} color="#667eea" />
                    <Text style={styles.zoomButtonText}>Zoom to Zone</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        ) : (
          // Default List View
          <>
            <View style={styles.sheetHeader}>
              <View style={styles.headerInfo}>
                <Text style={styles.sheetTitle}>{cityData.name}</Text>
                <Text style={styles.sheetSubtitle}>{cityData.country}</Text>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="shield-checkmark" size={16} color="#27ae60" />
                </View>
                <Text style={styles.statValue}>{safeZones.length}</Text>
                <Text style={styles.statLabel}>Safe</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#fff3e0' }]}>
                  <Ionicons name="alert-circle" size={16} color="#f39c12" />
                </View>
                <Text style={styles.statValue}>{cautionZones.length}</Text>
                <Text style={styles.statLabel}>Caution</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#ffebee' }]}>
                  <Ionicons name="warning" size={16} color="#e74c3c" />
                </View>
                <Text style={styles.statValue}>{avoidZones.length}</Text>
                <Text style={styles.statLabel}>Avoid</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#fff3e0' }]}>
                  <Ionicons name="information-circle" size={16} color="#f39c12" />
                </View>
                <Text style={styles.statValue}>{approvedPins.length}</Text>
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {/* Safe Areas */}
              {safeZones.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="checkmark-circle" size={18} color="#27ae60" />
                    <Text style={styles.sectionTitle}>Safe Areas</Text>
                  </View>

                  {safeZones.map((zone) => (
                    <TouchableOpacity
                      key={zone.id}
                      style={styles.card}
                      onPress={() => handleZonePress(zone)}
                    >
                      <View style={[styles.cardIndicator, { backgroundColor: '#27ae60' }]} />
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{zone.label}</Text>
                        <Text style={styles.cardDescription}>{zone.reason_short}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Caution Areas */}
              {cautionZones.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="alert-circle" size={18} color="#f39c12" />
                    <Text style={styles.sectionTitle}>Caution Areas</Text>
                  </View>

                  {cautionZones.map((zone) => (
                    <TouchableOpacity
                      key={zone.id}
                      style={styles.card}
                      onPress={() => handleZonePress(zone)}
                    >
                      <View style={[styles.cardIndicator, { backgroundColor: '#f39c12' }]} />
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{zone.label}</Text>
                        <Text style={styles.cardDescription}>{zone.reason_short}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Avoid Areas */}
              {avoidZones.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="warning" size={18} color="#e74c3c" />
                    <Text style={styles.sectionTitle}>Areas to Avoid</Text>
                  </View>

                  {avoidZones.map((zone) => (
                    <TouchableOpacity
                      key={zone.id}
                      style={styles.card}
                      onPress={() => handleZonePress(zone)}
                    >
                      <View style={[styles.cardIndicator, { backgroundColor: '#e74c3c' }]} />
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{zone.label}</Text>
                        <Text style={styles.cardDescription}>{zone.reason_short}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Safety Alerts */}
              {approvedPins.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="alert-circle" size={18} color="#f39c12" />
                    <Text style={styles.sectionTitle}>Safety Alerts</Text>
                  </View>

                  {approvedPins.map((pin) => (
                    <TouchableOpacity
                      key={pin.id}
                      style={styles.card}
                      onPress={() => handlePinPress(pin)}
                    >
                      <View
                        style={[
                          styles.cardIcon,
                          { backgroundColor: getPinColor(pin.type) + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getPinIcon(pin.type) as any}
                          size={16}
                          color={getPinColor(pin.type)}
                        />
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{pin.title}</Text>
                        <Text style={styles.cardDescription} numberOfLines={2}>
                          {pin.summary}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </>
        )}
      </Animated.View>
    </View>
  );
}

// styles moved to ./CityDetailScreen.styles
