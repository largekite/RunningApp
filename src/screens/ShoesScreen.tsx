import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, HelperText, Divider, ProgressBar } from 'react-native-paper';
import uuid from 'react-native-uuid';
import { useApp } from '../context/AppContext';
import { RunningShoe } from '../context/types';

const uuidv4 = uuid.v4;

const DEFAULT_MAX_MILES = 500;

export function ShoesScreen({ navigation }: any) {
  const { state, addShoe, updateShoe } = useApp();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [startingMiles, setStartingMiles] = useState('0');
  const [maxMiles, setMaxMiles] = useState(DEFAULT_MAX_MILES.toString());
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Compute miles per shoe from check-ins
  const shoeMilesMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const checkIn of Object.values(state.checkIns)) {
      if (checkIn.shoeId && checkIn.actualDistance) {
        map[checkIn.shoeId] = (map[checkIn.shoeId] || 0) + checkIn.actualDistance;
      }
    }
    return map;
  }, [state.checkIns]);

  const getTotalMiles = (shoe: RunningShoe) =>
    shoe.startingMiles + (shoeMilesMap[shoe.id] || 0);

  const getMileageColor = (miles: number, maxMiles: number) => {
    const ratio = miles / maxMiles;
    if (ratio >= 0.9) return '#c62828'; // red
    if (ratio >= 0.7) return '#e65100'; // orange
    return '#2e7d32'; // green
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setStartingMiles('0');
    setMaxMiles(DEFAULT_MAX_MILES.toString());
    setNotes('');
    setErrors({});
  };

  const startAdd = () => {
    resetForm();
    setEditingId(null);
    setAdding(true);
  };

  const startEdit = (shoe: RunningShoe) => {
    setName(shoe.name);
    setBrand(shoe.brand || '');
    setStartingMiles(shoe.startingMiles.toString());
    setMaxMiles(shoe.maxMiles.toString());
    setNotes(shoe.notes || '');
    setErrors({});
    setEditingId(shoe.id);
    setAdding(true);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Shoe name is required';
    if (isNaN(parseFloat(startingMiles)) || parseFloat(startingMiles) < 0)
      newErrors.startingMiles = 'Enter a valid mileage';
    if (isNaN(parseFloat(maxMiles)) || parseFloat(maxMiles) <= 0)
      newErrors.maxMiles = 'Enter a valid retirement mileage';
    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingId) {
      const existing = state.shoes.find(s => s.id === editingId);
      if (existing) {
        await updateShoe({
          ...existing,
          name: name.trim(),
          brand: brand.trim() || undefined,
          startingMiles: parseFloat(startingMiles),
          maxMiles: parseFloat(maxMiles),
          notes: notes.trim() || undefined,
        });
      }
    } else {
      const newShoe: RunningShoe = {
        id: uuidv4() as string,
        name: name.trim(),
        brand: brand.trim() || undefined,
        startingMiles: parseFloat(startingMiles),
        maxMiles: parseFloat(maxMiles),
        retired: false,
        notes: notes.trim() || undefined,
      };
      await addShoe(newShoe);
    }
    setAdding(false);
    resetForm();
  };

  const handleRetire = (shoe: RunningShoe) => {
    Alert.alert(
      'Retire Shoe',
      `Mark "${shoe.name}" as retired? It will no longer appear in the shoe selector when logging runs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retire',
          style: 'destructive',
          onPress: async () => {
            await updateShoe({ ...shoe, retired: true });
          },
        },
      ]
    );
  };

  const handleUnretire = async (shoe: RunningShoe) => {
    await updateShoe({ ...shoe, retired: false });
  };

  const activeShoes = state.shoes.filter(s => !s.retired);
  const retiredShoes = state.shoes.filter(s => s.retired);

  return (
    <ScrollView style={styles.container}>
      {/* Active Shoes */}
      {activeShoes.length === 0 && !adding && (
        <Card style={styles.card}>
          <Card.Content>
            <Paragraph style={styles.emptyText}>
              No shoes added yet. Add your running shoes to track mileage and get retirement alerts.
            </Paragraph>
          </Card.Content>
        </Card>
      )}

      {activeShoes.map(shoe => {
        const totalMiles = getTotalMiles(shoe);
        const ratio = Math.min(totalMiles / shoe.maxMiles, 1);
        const color = getMileageColor(totalMiles, shoe.maxMiles);
        const milesLeft = Math.max(shoe.maxMiles - totalMiles, 0);

        return (
          <Card key={shoe.id} style={styles.card}>
            <Card.Content>
              <View style={styles.shoeHeader}>
                <View>
                  <Title style={styles.shoeName}>{shoe.name}</Title>
                  {shoe.brand && (
                    <Paragraph style={styles.shoeBrand}>{shoe.brand}</Paragraph>
                  )}
                </View>
                <View style={styles.milesBadge}>
                  <Paragraph style={[styles.milesNumber, { color }]}>
                    {totalMiles.toFixed(0)}
                  </Paragraph>
                  <Paragraph style={styles.milesUnit}>mi</Paragraph>
                </View>
              </View>

              <View style={styles.progressRow}>
                <ProgressBar
                  progress={ratio}
                  color={color}
                  style={styles.progressBar}
                />
                <Paragraph style={styles.progressLabel}>
                  {milesLeft.toFixed(0)} mi left
                </Paragraph>
              </View>

              {totalMiles >= shoe.maxMiles * 0.9 && (
                <View style={[styles.alertBanner, { backgroundColor: color + '22' }]}>
                  <Paragraph style={[styles.alertText, { color }]}>
                    {totalMiles >= shoe.maxMiles
                      ? '⚠️ Retirement recommended — mileage limit reached!'
                      : '⚠️ Approaching retirement mileage — consider replacing soon.'}
                  </Paragraph>
                </View>
              )}

              {shoe.notes ? (
                <Paragraph style={styles.shoeNotes}>{shoe.notes}</Paragraph>
              ) : null}
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
              <Button compact mode="outlined" onPress={() => startEdit(shoe)}>
                Edit
              </Button>
              <Button compact mode="outlined" textColor="#c62828" onPress={() => handleRetire(shoe)}>
                Retire
              </Button>
            </Card.Actions>
          </Card>
        );
      })}

      {/* Add / Edit Form */}
      {adding && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>{editingId ? 'Edit Shoe' : 'Add Shoe'}</Title>

            <TextInput
              label="Shoe Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
              placeholder="e.g. Nike Pegasus 40"
            />
            <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>

            <TextInput
              label="Brand (optional)"
              value={brand}
              onChangeText={setBrand}
              mode="outlined"
              style={styles.input}
              placeholder="e.g. Nike"
            />

            <TextInput
              label="Starting Mileage (miles already on shoe)"
              value={startingMiles}
              onChangeText={setStartingMiles}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              error={!!errors.startingMiles}
            />
            <HelperText type="error" visible={!!errors.startingMiles}>{errors.startingMiles}</HelperText>

            <TextInput
              label="Retirement Mileage"
              value={maxMiles}
              onChangeText={setMaxMiles}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              error={!!errors.maxMiles}
            />
            <HelperText type="info" visible={!errors.maxMiles}>
              Most shoes last 300–500 miles
            </HelperText>
            <HelperText type="error" visible={!!errors.maxMiles}>{errors.maxMiles}</HelperText>

            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />

            <View style={styles.formActions}>
              <Button mode="contained" onPress={handleSave} style={styles.saveBtn}>
                Save
              </Button>
              <Button mode="outlined" onPress={() => { setAdding(false); resetForm(); }}>
                Cancel
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {!adding && (
        <Button
          mode="contained"
          icon="plus"
          onPress={startAdd}
          style={styles.addBtn}
        >
          Add Shoe
        </Button>
      )}

      {/* Retired Shoes */}
      {retiredShoes.length > 0 && (
        <>
          <Divider style={styles.divider} />
          <Paragraph style={styles.sectionLabel}>Retired Shoes</Paragraph>
          {retiredShoes.map(shoe => {
            const totalMiles = getTotalMiles(shoe);
            return (
              <Card key={shoe.id} style={[styles.card, styles.retiredCard]}>
                <Card.Content>
                  <View style={styles.shoeHeader}>
                    <View>
                      <Title style={styles.retiredShoeName}>{shoe.name}</Title>
                      {shoe.brand && (
                        <Paragraph style={styles.shoeBrand}>{shoe.brand}</Paragraph>
                      )}
                    </View>
                    <Paragraph style={styles.retiredMiles}>{totalMiles.toFixed(0)} mi</Paragraph>
                  </View>
                </Card.Content>
                <Card.Actions>
                  <Button compact mode="outlined" onPress={() => handleUnretire(shoe)}>
                    Unretire
                  </Button>
                </Card.Actions>
              </Card>
            );
          })}
        </>
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  retiredCard: {
    opacity: 0.6,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 8,
  },
  shoeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shoeName: {
    fontSize: 18,
    lineHeight: 22,
  },
  retiredShoeName: {
    fontSize: 16,
    color: '#888',
  },
  shoeBrand: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  milesBadge: {
    alignItems: 'center',
  },
  milesNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  milesUnit: {
    fontSize: 12,
    color: '#666',
  },
  retiredMiles: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    width: 68,
    textAlign: 'right',
  },
  alertBanner: {
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  shoeNotes: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardActions: {
    gap: 8,
  },
  input: {
    marginBottom: 0,
    marginTop: 8,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveBtn: {
    flex: 1,
  },
  addBtn: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionLabel: {
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 8,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  bottomPad: {
    height: 32,
  },
});
