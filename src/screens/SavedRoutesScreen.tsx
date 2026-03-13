import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Card, Title, Button, Chip, Divider, IconButton } from 'react-native-paper';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useApp } from '../context/AppContext';
import { SavedRoute } from '../context/types';
import ElevationChart from '../components/ElevationChart';

const PRIMARY = '#6200ea';

function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function getMapRegion(route: SavedRoute) {
  if (route.coordinates.length === 0) {
    return { latitude: 37.78, longitude: -122.42, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  }
  const lats = route.coordinates.map((c) => c.latitude);
  const lngs = route.coordinates.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.005;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.01, maxLat - minLat + pad),
    longitudeDelta: Math.max(0.01, maxLng - minLng + pad),
  };
}

function RouteCard({
  route,
  onTap,
  onDelete,
}: {
  route: SavedRoute;
  onTap: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.8}>
      <Card style={styles.routeCard}>
        <Card.Content>
          <View style={styles.routeHeader}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>{route.name}</Text>
              <Text style={styles.routeDate}>{formatDate(route.createdAt)}</Text>
            </View>
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="trash-can-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="map-marker-distance" size={14} color={PRIMARY} />
              <Text style={styles.statValue}>{route.distanceMiles.toFixed(2)} mi</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="image-filter-hdr" size={14} color="#ff9800" />
              <Text style={styles.statValue}>{route.elevationGainFt.toLocaleString()} ft gain</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="map-marker-path" size={14} color="#4caf50" />
              <Text style={styles.statValue}>{route.coordinates.length} pts</Text>
            </View>
          </View>

          {/* Mini map preview */}
          {route.coordinates.length > 1 && (
            <View style={styles.miniMapContainer}>
              <MapView
                style={styles.miniMap}
                region={getMapRegion(route)}
                provider={PROVIDER_DEFAULT}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
              >
                <Polyline
                  coordinates={route.coordinates}
                  strokeColor={PRIMARY}
                  strokeWidth={2.5}
                />
              </MapView>
            </View>
          )}

          {route.notes ? <Text style={styles.routeNotes}>{route.notes}</Text> : null}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

export default function SavedRoutesScreen() {
  const { state, deleteRoute } = useApp();
  const [selectedRoute, setSelectedRoute] = useState<SavedRoute | null>(null);
  const [editingName, setEditingName] = useState('');

  const routes = [...state.savedRoutes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  function confirmDelete(route: SavedRoute) {
    Alert.alert('Delete Route', `Remove "${route.name}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRoute(route.id);
          if (selectedRoute?.id === route.id) setSelectedRoute(null);
        },
      },
    ]);
  }

  function openRoute(route: SavedRoute) {
    setSelectedRoute(route);
    setEditingName(route.name);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="map-marker-path" size={56} color="#ddd" />
            <Text style={styles.emptyTitle}>No Saved Routes</Text>
            <Text style={styles.emptyText}>
              Finish a run and tap "Save Route" to build your route library.
            </Text>
          </View>
        ) : (
          routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onTap={() => openRoute(route)}
              onDelete={() => confirmDelete(route)}
            />
          ))
        )}
      </ScrollView>

      {/* Route Detail Modal */}
      <Modal
        visible={selectedRoute !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedRoute(null)}
      >
        {selectedRoute && (
          <View style={styles.detailContainer}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <TouchableOpacity
                onPress={() => setSelectedRoute(null)}
                style={styles.backButton}
              >
                <Icon name="arrow-left" size={24} color="#333" />
              </TouchableOpacity>
              <TextInput
                style={styles.routeNameInput}
                value={editingName}
                onChangeText={setEditingName}
                placeholder="Route name"
              />
              <TouchableOpacity
                onPress={() => confirmDelete(selectedRoute)}
                style={styles.deleteButton}
              >
                <Icon name="trash-can-outline" size={22} color="#f44336" />
              </TouchableOpacity>
            </View>

            {/* Full-screen map */}
            {selectedRoute.coordinates.length > 1 ? (
              <MapView
                style={styles.fullMap}
                region={getMapRegion(selectedRoute)}
                provider={PROVIDER_DEFAULT}
              >
                <Polyline
                  coordinates={selectedRoute.coordinates}
                  strokeColor={PRIMARY}
                  strokeWidth={4}
                />
              </MapView>
            ) : (
              <View style={[styles.fullMap, styles.noMapData]}>
                <Text style={styles.noMapText}>No GPS coordinates recorded</Text>
              </View>
            )}

            {/* Stats overlay */}
            <ScrollView style={styles.detailStats} contentContainerStyle={styles.detailStatsContent}>
              <View style={styles.detailStatsRow}>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatValue}>
                    {selectedRoute.distanceMiles.toFixed(2)}
                  </Text>
                  <Text style={styles.detailStatLabel}>Miles</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatValue}>
                    {selectedRoute.elevationGainFt.toLocaleString()}
                  </Text>
                  <Text style={styles.detailStatLabel}>Ft Gain</Text>
                </View>
                <View style={styles.detailStat}>
                  <Text style={styles.detailStatValue}>
                    {formatDate(selectedRoute.createdAt)}
                  </Text>
                  <Text style={styles.detailStatLabel}>Saved</Text>
                </View>
              </View>

              {/* Elevation chart */}
              <View style={styles.elevationSection}>
                <Text style={styles.elevationTitle}>Elevation Profile</Text>
                <ElevationChart
                  coordinates={selectedRoute.coordinates}
                  height={130}
                />
              </View>

              {selectedRoute.notes ? (
                <Text style={styles.detailNotes}>{selectedRoute.notes}</Text>
              ) : null}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
    marginTop: 80,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#888' },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  routeCard: { marginBottom: 12, borderRadius: 12, elevation: 2 },
  routeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  routeInfo: { flex: 1 },
  routeName: { fontSize: 17, fontWeight: '700', color: '#222' },
  routeDate: { fontSize: 12, color: '#888', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, color: '#555', fontWeight: '500' },
  miniMapContainer: { borderRadius: 10, overflow: 'hidden', height: 130, marginBottom: 8 },
  miniMap: { flex: 1 },
  routeNotes: { fontSize: 12, color: '#888', marginTop: 4, fontStyle: 'italic' },
  // Detail Modal
  detailContainer: { flex: 1, backgroundColor: '#fff' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 4 },
  routeNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    paddingVertical: 4,
  },
  deleteButton: { padding: 4 },
  fullMap: {
    height: Dimensions.get('window').height * 0.45,
    backgroundColor: '#e8e8e8',
  },
  noMapData: { alignItems: 'center', justifyContent: 'center' },
  noMapText: { color: '#aaa', fontSize: 14 },
  detailStats: { flex: 1, backgroundColor: '#f5f5f5' },
  detailStatsContent: { padding: 16, paddingBottom: 32 },
  detailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
    elevation: 2,
  },
  detailStat: { alignItems: 'center', gap: 4 },
  detailStatValue: { fontSize: 18, fontWeight: '800', color: '#222' },
  detailStatLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  elevationSection: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  elevationTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10 },
  detailNotes: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    elevation: 1,
  },
});
