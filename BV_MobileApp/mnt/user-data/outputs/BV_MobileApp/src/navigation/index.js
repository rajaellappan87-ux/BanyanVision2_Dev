import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../constants/theme';
import { useCart } from '../context/CartContext';

// Screens
import HomeScreen        from '../screens/HomeScreen';
import ShopScreen        from '../screens/ShopScreen';
import CartScreen        from '../screens/CartScreen';
import WishlistScreen    from '../screens/WishlistScreen';
import ProfileScreen     from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CheckoutScreen    from '../screens/CheckoutScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import OrdersScreen      from '../screens/OrdersScreen';
import LoginScreen       from '../screens/LoginScreen';
import RegisterScreen    from '../screens/RegisterScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Tab bar icon component ────────────────────────────────────────────────────
function TabIcon({ emoji, label, focused, cartCount }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <View style={{ position: 'relative' }}>
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
        {cartCount > 0 && (
          <View style={{
            position: 'absolute', top: -4, right: -8,
            backgroundColor: Colors.rose, borderRadius: 9,
            minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
            paddingHorizontal: 3,
          }}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
              {cartCount > 99 ? '99+' : cartCount}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 10, fontWeight: focused ? '700' : '500', color: focused ? Colors.rose : Colors.muted, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
function MainTabs() {
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 4,
          elevation: 8,
          shadowColor: '#1A0A00',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👗" label="Shop" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛍" label="Cart" focused={focused} cartCount={cartCount} />
          ),
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="❤️" label="Wishlist" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Auth Stack ────────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── Root Stack ────────────────────────────────────────────────────────────────
function RootStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.ivory },
      }}
    >
      {/* Main tabs */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Full screens pushed over tabs */}
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: Colors.ivory2 },
          headerTintColor: Colors.dark,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: true,
          headerTitle: 'Checkout',
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: Colors.dark,
        }}
      />
      <Stack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          headerShown: true,
          headerTitle: 'My Orders',
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: Colors.ivory },
          headerTintColor: Colors.dark,
        }}
      />
      {/* Auth screens */}
      <Stack.Screen
        name="Auth"
        component={AuthStack}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Navigation() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}
