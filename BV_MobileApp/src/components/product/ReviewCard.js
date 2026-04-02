import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';

/**
 * Single customer review card.
 *
 * Props:
 *   review  { userName, rating, comment }
 */
export default function ReviewCard({ review }) {
  const { userName, rating, comment } = review;
  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.user}>{userName}</Text>
        <Text style={s.stars}>{'★'.repeat(rating)}</Text>
      </View>
      <Text style={s.comment}>{comment}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:    { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 14, marginTop: 10, ...Shadow.sm },
  header:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  user:    { fontSize: 13, fontWeight: '700', color: Colors.dark },
  stars:   { color: Colors.gold, fontSize: 13 },
  comment: { fontSize: 13, color: Colors.text2, lineHeight: 20 },
});
