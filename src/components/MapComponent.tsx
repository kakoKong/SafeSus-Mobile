import React, { useState, useRef, useImperativeHandle, forwardRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import styles from './MapComponent.styles';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import type { Zone, Pin, GeoJSONPolygon } from '../types';
import { getPinColor, getPinIcon } from '../utils/pins';
import { getZoneColor } from '../utils/zones';

interface MapComponentProps {
  zones: Zone[];
  pins: Pin[];
  onZonePress?: (zone: Zone) => void;
  onPinPress?: (pin: Pin) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  bottomOffset?: number;
}

interface MapFilters {
  showZones: boolean;
  showSafeZones: boolean;
  showAvoidZones: boolean;
  showNeutralZones: boolean;
  showCautionZones: boolean;
  showScams: boolean;
  showHarassment: boolean;
  showOvercharge: boolean;
  showOther: boolean;
}

export default forwardRef(function MapComponent(
  {
    zones,
    pins,
    onZonePress,
    onPinPress,
    initialCenter = [100.5018, 13.7563],
    initialZoom = 12,
    bottomOffset = 20,
  }: MapComponentProps,
  ref: any
) {
  const [showLegend, setShowLegend] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [locating, setLocating] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    showZones: true,
    showSafeZones: true,
    showAvoidZones: true,
    showNeutralZones: true,
    showCautionZones: true,
    showScams: true,
    showHarassment: true,
    showOvercharge: true,
    showOther: true,
  });

  const isGeoJSONPolygon = (geom: any): geom is GeoJSONPolygon =>
    geom && typeof geom === 'object' && Array.isArray(geom.coordinates);

  const parseWktPolygonToCoords = (wkt: string): { latitude: number; longitude: number }[] | null => {
    if (typeof wkt !== 'string') return null;
    const match = wkt.match(/^POLYGON\s*\(\(\s*(.+?)\s*\)\)$/i);
    if (!match) return null;
    const pairs = match[1].split(',').map((p) => p.trim());
    const coords: { latitude: number; longitude: number }[] = [];
    for (const pair of pairs) {
      const parts = pair.split(/\s+/);
      if (parts.length < 2) continue;
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        coords.push({ latitude: lat, longitude: lng });
      }
    }
    return coords.length ? coords : null;
  };

  const getZoneRingCoords = useCallback((zone: Zone): { latitude: number; longitude: number }[] | null => {
    const geom: any = (zone as any).geom;
    if (isGeoJSONPolygon(geom)) {
      const ring = geom.coordinates?.[0];
      if (!Array.isArray(ring)) return null;
      return ring.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
    }
    if (typeof geom === 'string') {
      return parseWktPolygonToCoords(geom);
    }
    return null;
  }, []);

  const zoomToDeltas = useCallback((zoom: number): { latitudeDelta: number; longitudeDelta: number } => {
    const latitudeDelta = 360 / Math.pow(2, zoom);
    const longitudeDelta = latitudeDelta;
    return { latitudeDelta, longitudeDelta };
  }, []);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number }, duration: number = 1000) => {
      if (!mapRef.current) return;
      const targetRegion: Region = {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta ?? zoomToDeltas(initialZoom).latitudeDelta,
        longitudeDelta: region.longitudeDelta ?? zoomToDeltas(initialZoom).longitudeDelta,
      };
      mapRef.current.animateToRegion(targetRegion, duration);
    },
    animateToCoordinate: (coordinate: [number, number], zoom?: number) => {
      if (!mapRef.current) return;
      const deltas = zoomToDeltas(zoom ?? initialZoom);
      const desiredYPercent = 0.25;
      const offsetLat = (0.5 - desiredYPercent) * deltas.latitudeDelta;
      mapRef.current.animateToRegion(
        {
          latitude: coordinate[1] + offsetLat,
          longitude: coordinate[0],
          latitudeDelta: deltas.latitudeDelta,
          longitudeDelta: deltas.longitudeDelta,
        },
        1000
      );
    },
  }));

  const moveToMyLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocating(false);
        return;
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = current.coords.latitude;
      const longitude = current.coords.longitude;
      const deltas = zoomToDeltas(16);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: deltas.latitudeDelta,
            longitudeDelta: deltas.longitudeDelta,
          },
          800
        );
      }
    } catch (e) {
      // no-op
    } finally {
      setLocating(false);
    }
  };

  const customMapStyle =
    Platform.OS === 'android'
      ? [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ saturation: -10 }, { lightness: 10 }],
          },
        ]
      : undefined;

  const toggleFilter = (filterKey: keyof MapFilters) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  const resetFilters = () => {
    setFilters({
      showZones: true,
      showSafeZones: true,
      showAvoidZones: true,
      showNeutralZones: true,
      showCautionZones: true,
      showScams: true,
      showHarassment: true,
      showOvercharge: true,
      showOther: true,
    });
  };

  // Memoized filtered data for performance
  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      if (!filters.showZones) return false;
      switch (zone.level) {
        case 'recommended':
          return filters.showSafeZones;
        case 'neutral':
          return filters.showNeutralZones;
        case 'caution':
          return filters.showCautionZones;
        case 'avoid':
          return filters.showAvoidZones;
        default:
          return true;
      }
    });
  }, [zones, filters]);

  const filteredPins = useMemo(() => {
    return pins.filter((pin) => {
      switch (pin.type) {
        case 'scam':
          return filters.showScams;
        case 'harassment':
          return filters.showHarassment;
        case 'overcharge':
          return filters.showOvercharge;
        case 'other':
          return filters.showOther;
        default:
          return true;
      }
    });
  }, [pins, filters]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: initialCenter[1],
          longitude: initialCenter[0],
          ...zoomToDeltas(initialZoom),
        }}
        showsUserLocation
        showsBuildings={false}
        showsCompass={false}
        showsMyLocationButton={false}
        customMapStyle={customMapStyle as any}
        loadingEnabled
        loadingIndicatorColor="#667eea"
        loadingBackgroundColor="#f8fafc"
      >
        {/* Render Zones */}
        {filters.showZones &&
          filteredZones.map((zone) => {
            const coords = getZoneRingCoords(zone) || [];
            if (coords.length === 0) return null;
            const fillColor = getZoneColor(zone.level) + '4D';
            const strokeColor = getZoneColor(zone.level);
            return (
              <Polygon
                key={`zone-${zone.id}`}
                coordinates={coords}
                strokeColor={strokeColor}
                fillColor={fillColor}
                strokeWidth={2}
                tappable
                onPress={() => onZonePress && onZonePress(zone)}
              />
            );
          })}

        {/* Render Pins */}
        {filteredPins.map((pin) => {
          const [lng, lat] = pin.location.coordinates;
          return (
            <Marker
              key={`pin-${pin.id}`}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => onPinPress && onPinPress(pin)}
              tracksViewChanges={false}
            >
              <View style={[styles.modernMarker, { backgroundColor: getPinColor(pin.type) }]}>
                <Ionicons name={getPinIcon(pin.type) as any} size={14} color="#fff" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity
        onPress={moveToMyLocation}
        style={[styles.modernLocationButton, { bottom: bottomOffset }]}
        activeOpacity={0.8}
      >
        <Ionicons name={locating ? 'locate' : 'navigate-circle'} size={24} color="#667eea" />
      </TouchableOpacity>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={[styles.modernFilterButton, { bottom: bottomOffset + 60 }]}
        onPress={() => setShowFilters(!showFilters)}
        activeOpacity={0.8}
      >
        <Ionicons name="options" size={22} color="#667eea" />
      </TouchableOpacity>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.modernFilterPanel}>
          <View style={styles.modernFilterHeader}>
            <Text style={styles.modernFilterTitle}>Map Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close-circle" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.modernFilterSection}>
            <Text style={styles.modernFilterSectionTitle}>🗺️ ZONES</Text>

            <TouchableOpacity
              style={styles.modernFilterItem}
              onPress={() => toggleFilter('showSafeZones')}
              activeOpacity={0.7}
            >
              <View style={[styles.modernFilterCheck, filters.showSafeZones && styles.modernFilterCheckActive]}>
                {filters.showSafeZones && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={[styles.modernFilterColorDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.modernFilterText}>Safe Zones</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernFilterItem}
              onPress={() => toggleFilter('showCautionZones')}
              activeOpacity={0.7}
            >
              <View style={[styles.modernFilterCheck, filters.showCautionZones && styles.modernFilterCheckActive]}>
                {filters.showCautionZones && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={[styles.modernFilterColorDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.modernFilterText}>Caution Zones</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernFilterItem}
              onPress={() => toggleFilter('showAvoidZones')}
              activeOpacity={0.7}
            >
              <View style={[styles.modernFilterCheck, filters.showAvoidZones && styles.modernFilterCheckActive]}>
                {filters.showAvoidZones && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={[styles.modernFilterColorDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.modernFilterText}>Avoid Zones</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modernFilterSection}>
            <Text style={styles.modernFilterSectionTitle}>🚨 INCIDENTS</Text>

            <TouchableOpacity
              style={styles.modernFilterItem}
              onPress={() => toggleFilter('showScams')}
              activeOpacity={0.7}
            >
              <View style={[styles.modernFilterCheck, filters.showScams && styles.modernFilterCheckActive]}>
                {filters.showScams && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={[styles.modernFilterMarker, { backgroundColor: '#ef4444' }]}>
                <Ionicons name="warning" size={10} color="#fff" />
              </View>
              <Text style={styles.modernFilterText}>Scams</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernFilterItem}
              onPress={() => toggleFilter('showHarassment')}
              activeOpacity={0.7}
            >
              <View style={[styles.modernFilterCheck, filters.showHarassment && styles.modernFilterCheckActive]}>
                {filters.showHarassment && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={[styles.modernFilterMarker, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="person-remove" size={10} color="#fff" />
              </View>
              <Text style={styles.modernFilterText}>Harassment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modernFilterItem}
              onPress={() => toggleFilter('showOvercharge')}
              activeOpacity={0.7}
            >
              <View style={[styles.modernFilterCheck, filters.showOvercharge && styles.modernFilterCheckActive]}>
                {filters.showOvercharge && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={[styles.modernFilterMarker, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="cash" size={10} color="#fff" />
              </View>
              <Text style={styles.modernFilterText}>Overcharge</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.modernResetButton} onPress={resetFilters} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#667eea" />
            <Text style={styles.modernResetText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});