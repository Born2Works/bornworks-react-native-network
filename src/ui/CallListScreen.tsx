import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Davina } from '../core/DavinaCore';
import { useDavinaCalls } from './hooks';
import { formatDuration, formatSize } from '../utils/format';
import type { HttpCall } from '../types';

export function statusColor(call: HttpCall): string {
  if (call.state === 'pending') return '#9e9e9e';
  if (call.state === 'error') return '#e53935';
  const s = call.response?.status ?? 0;
  if (s >= 500) return '#e53935';
  if (s >= 400) return '#fb8c00';
  if (s >= 300) return '#8e24aa';
  return '#43a047';
}

function pathOf(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

interface Props {
  onSelect: (call: HttpCall) => void;
  onClose: () => void;
}

export function CallListScreen({ onSelect, onClose }: Props) {
  const calls = useDavinaCalls();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Davina — HTTP Inspector</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => Davina.clear()} hitSlop={8}>
            <Text style={styles.headerAction}>Clear</Text>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.headerAction}>Close</Text>
          </Pressable>
        </View>
      </View>
      {calls.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No HTTP calls captured yet</Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => onSelect(item)}>
              <View style={[styles.statusPill, { backgroundColor: statusColor(item) }]}>
                <Text style={styles.statusText}>
                  {item.state === 'pending' ? '…' : item.state === 'error' ? 'ERR' : item.response?.status}
                </Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLine} numberOfLines={1}>
                  <Text style={styles.method}>{item.method}</Text> {pathOf(item.url)}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {hostOf(item.url)} · {formatDuration(item.durationMs)} ·{' '}
                  {formatSize(item.response?.size)} · {item.client}
                </Text>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#222' },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerAction: { fontSize: 14, color: '#1565c0', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  statusPill: {
    minWidth: 44,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  rowBody: { flex: 1 },
  rowLine: { fontSize: 13, color: '#222' },
  method: { fontWeight: '700' },
  rowMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#eee' },
});
