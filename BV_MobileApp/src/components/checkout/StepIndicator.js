import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';

/**
 * Numbered step progress bar for multi-step flows.
 *
 * Props:
 *   steps   {string[]} – Step labels e.g. ['Delivery', 'Payment']
 *   current {number}   – 1-based active step index
 */
export default function StepIndicator({ steps = [], current }) {
  return (
    <View style={s.container}>
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <View style={s.item}>
            <View style={[
              s.circle,
              current > i     && s.circleDone,
              current === i+1 && s.circleActive,
            ]}>
              <Text style={[s.num, (current > i || current === i+1) && { color: '#fff' }]}>
                {current > i + 1 ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[s.label, current === i+1 && s.labelActive]}>{label}</Text>
          </View>
          {i < steps.length - 1 && (
            <View style={[s.line, current > i + 1 && { backgroundColor: Colors.rose }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  item:        { alignItems: 'center', gap: 6 },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: Colors.border2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  circleActive:{ borderColor: Colors.rose, backgroundColor: Colors.rose },
  circleDone:  { borderColor: Colors.success, backgroundColor: Colors.success },
  num:         { fontSize: 14, fontWeight: '700', color: Colors.muted },
  label:       { fontSize: 12, color: Colors.muted },
  labelActive: { color: Colors.rose, fontWeight: '700' },
  line:        { width: 60, height: 2, backgroundColor: Colors.border2, marginBottom: 20 },
});
