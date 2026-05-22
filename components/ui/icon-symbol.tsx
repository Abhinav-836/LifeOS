import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

const MAPPING: IconMapping = {
  // Navigation & Basic
  'house.fill': 'home',
  'house': 'home',
  'person.fill': 'person',
  'person': 'person',
  'person.circle.fill': 'account-circle',
  'gear': 'settings',
  'settings': 'settings',
  'plus': 'add',
  'plus.circle': 'add-circle',
  'minus': 'remove',
  'xmark': 'close',
  'checkmark': 'check',
  'checkmark.circle': 'check-circle',
  'checkmark.seal': 'verified',
  'arrow.right': 'arrow-forward',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'expand-more',
  'chevron.up': 'expand-less',
  
  // Task & Productivity
  'checklist': 'assignment',
  'list.bullet': 'format-list-bulleted',
  'timer': 'timer',
  'clock': 'schedule',
  'clock.arrow.circlepath': 'history',
  'calendar': 'calendar-today',
  'bell': 'notifications',
  'bell.slash': 'notifications-off',
  'flag.fill': 'flag',
  'flag': 'outlined-flag',
  'star.fill': 'star',
  'star': 'star-outline',
  'sparkles': 'auto-awesome',
  
  // Habits & Tracking
  'repeat': 'repeat',
  'flame': 'whatshot',
  'flame.fill': 'whatshot',
  'drop': 'water-drop',
  'drop.fill': 'water-drop',
  'leaf': 'eco',
  'leaf.fill': 'eco',
  'moon.stars': 'nightlight',
  'moon': 'bedtime',
  'sun.max': 'wb-sunny',
  'figure.walk': 'directions-walk',
  'figure.run': 'directions-run',
  'heart': 'favorite',
  'heart.fill': 'favorite',
  'brain': 'psychology',
  'book.closed': 'menu-book',
  'book': 'book',
  
  // Focus & Media
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'stop.fill': 'stop',
  'arrow.clockwise': 'refresh',
  'headphones': 'headphones',
  'music.note': 'music-note',
  'speaker.wave.2': 'volume-up',
  
  // Categories
  'briefcase': 'work',
  'cart': 'shopping-cart',
  'bag': 'shopping-bag',
  'gift': 'card-giftcard',
  'rocket': 'rocket',
  'airplane': 'flight',
  'car': 'directions-car',
  'bicycle': 'pedal-bike',
  
  // UI Elements
  'photo': 'photo-camera',
  'camera': 'camera-alt',
  'envelope': 'email',
  'message': 'message',
  'phone': 'phone',
  'video': 'video-call',
  'map': 'map',
  'location': 'location-on',
  'trash': 'delete',
  'trash.fill': 'delete',
  'folder': 'folder',
  'doc': 'description',
  'note.text': 'notes',
  'pencil': 'edit',
  'pencil.circle': 'edit',
  'square.and.pencil': 'create',
  
  // Charts & Analytics
  'chart.bar': 'bar-chart',
  'chart.line.uptrend.xyaxis': 'show-chart',
  'chart.pie': 'pie-chart',
  'chart.bar.fill': 'bar-chart',
  
  // Communication
  'share': 'share',
  'square.and.arrow.up': 'ios-share',
  'link': 'link',
  'lock': 'lock',
  'lock.open': 'lock-open',
  
  // Actions
  'magnifyingglass': 'search',
  'slider.horizontal.3': 'tune',
  'square.grid.2x2': 'apps',
  'square.grid.3x3': 'apps',
  'circle.grid.3x3': 'apps',
  
  // Misc
  'lightbulb': 'lightbulb',
  'lightbulb.fill': 'lightbulb',
  'bolt': 'bolt',
  'bolt.fill': 'bolt',
  'zap': 'flash-on',
  'exclamationmark.triangle': 'warning',
  'info.circle': 'info',
  'questionmark.circle': 'help',
  'wand.and.stars': 'auto-awesome',
  'checklist.unchecked': 'check-box-outline-blank',
  'checklist.checked': 'check-box',
  'arrow.up.doc': 'ios-share',
  'clock.fill': 'schedule',
  
  // Additional mappings for new UI features
  'pencil': 'edit',
  'star.fill': 'star',
  'star': 'star-outline',
  'checkmark': 'check',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'xmark': 'close',
  'plus': 'add',
  'trash': 'delete',
  'clock.arrow.circlepath': 'history',
  'bell.slash': 'notifications-off',
  'headphones': 'headphones',
  'drop': 'water-drop',
  'figure.walk': 'directions-walk',
  'flame.fill': 'whatshot',
  'chart.bar': 'bar-chart',
 // 'arrow.up.doc': 'ios-share',
  //'square.and.arrow.up': 'ios-share',
 // 'checklist': 'assignment',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: keyof typeof MAPPING;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mappedName = MAPPING[name];
  if (!mappedName) {
    console.warn(`Icon mapping missing for: ${name}`);
    return <MaterialIcons color={color} size={size} name="help" style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={mappedName} style={style} />;
}