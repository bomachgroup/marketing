export interface Lead {
  id: string
  name: string
  phone: string
  div: string
  source: string
  campaign: string
  budget: string
  stage: Stage
  assigned: string
  color: string
  tc: string
  value: string
  overdue?: boolean
  nextAction?: string
  nextFollowup?: string
  activities: Activity[]
}

export interface Activity {
  id?: string
  t: string
  m: string
  note?: string
  nextAction?: string
  nextFollowup?: string
}

export type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'

export const STAGE_COLS: Record<Stage, string> = {
  new: 'p-new', contacted: 'p-contact', qualified: 'p-qual',
  proposal: 'p-prop', negotiation: 'p-neg', won: 'p-won', lost: 'p-lost',
}

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  proposal: 'Proposal sent', negotiation: 'Negotiation',
  won: 'Won', lost: 'Lost',
}

export const DIV_LABELS: Record<string, string> = {
  re: 'Real Estate', eng: 'Engineering', sur: 'Surveying',
  ben: 'Benji', ict: 'ICT', agr: 'Agriculture',
}

export const DIV_COLS: Record<string, string> = {
  re: 'd-re', eng: 'd-eng', sur: 'd-sur', ben: 'd-ben', ict: 'd-ict', agr: 'd-agr',
}

export interface TeamMember {
  n: string
  pct: number
  col: string
  st: string
}

export interface Target {
  label: string
  target: string
  actual: string
  pct: number
  col: string
}

export interface Okr {
  obj: string
  krs: { l: string; pct: number; col: string }[]
}

export interface Campaign {
  id: string | number
  div: string
  name: string
  status: string
  budget: number
  spent: number
  leads: number
  cpl: string
  conv: string
  days: number | null
  channels: string
  owner?: string
  startDate?: string
  endDate?: string
}

export interface ContentItem {
  title: string
  fmt: string
  platform: string
  div: string
  owner: string
  status: string
  due: string
}

export interface Notification {
  icon: string
  bg: string
  col: string
  txt: string
  time: string
  read: boolean
}

export interface WaConversation {
  id: string
  init: string
  bg: string
  tc: string
  name: string
  time: string
  unread: boolean
  thread: WaMessage[]
}

export interface WaMessage {
  out: boolean
  text: string
  time: string
}

export interface DesignTask {
  id: string
  thumb: string
  tbg: string
  ttc: string
  title: string
  brief: string
  platform: string
  due: string
  status: string
  overdue?: boolean
}

export interface SupportTicket {
  id: string
  name: string
  issue: string
  div: string
  priority: string
  time: string
  assigned: string
  resolved: boolean
}

export interface TeamMemberInfo {
  name: string
  role: string
  init: string
  bg: string
  status: string
  phone: string
  stat: string
}

export interface MediaItem {
  title: string
  type: string
  bg: string
  icon: string
  div: string
  size: string
}

export interface Realtor {
  init: string
  bg: string
  tc: string
  name: string
  since: string
  comm: string
  phone: string
  referrals: string
  status: string
}

export interface Influencer {
  init: string
  bg: string
  name: string
  handle: string
  platform: string
  followers: string
  eng: string
  niche: string
  rate: string
  status: string
}

export interface NavItem {
  ic: string
  l: string
  s: string
  b?: string
  bt?: string
}

export interface NavGroup {
  g: string
  items: NavItem[]
}

export interface Role {
  n: string
  i: string
  r: string
  nav: NavGroup[]
}

export interface Roles {
  [key: string]: Role
}

export interface PeriodData {
  leads: string
  conv: string
  pipe: string
  content: string
  al: string
  ar: string
}

export interface Periods {
  [key: string]: PeriodData
}

export const IconsMap: Record<string, string> = {
  'ti-layout-dashboard': 'Element3',
  'ti-target': 'Radar2',
  'ti-file-analytics': 'DocumentText',
  'ti-users': 'People',
  'ti-speakerphone': 'Speaker',
  'ti-calendar': 'Calendar',
  'ti-photo-video': 'Gallery',
  'ti-brand-whatsapp': 'Whatsapp',
  'ti-handshake': 'Kanban',
  'ti-chart-bar': 'Chart',
  'ti-headset': 'Headphones',
  'ti-address-book': 'Profile2User',
  'ti-user-plus': 'UserAdd',
  'ti-palette': 'ColorSwatch',
  'ti-plus': 'Add',
  'ti-search': 'SearchNormal',
  'ti-bell': 'Notification',
  'ti-menu-2': 'HambergerMenu',
  'ti-login-2': 'Login',
  'ti-check': 'Tick',
  'ti-x': 'Close',
  'ti-arrow-left': 'ArrowLeft',
  'ti-arrow-right': 'ArrowRight',
  'ti-chevron-down': 'ArrowDown2',
  'ti-edit': 'Edit',
  'ti-trash': 'Trash',
  'ti-download': 'Download',
  'ti-upload': 'Upload',
  'ti-copy': 'Copy',
  'ti-send': 'Send',
  'ti-mail': 'Sms',
  'ti-phone': 'Call',
  'ti-clock': 'Clock',
  'ti-calendar-plus': 'CalendarAdd',
  'ti-info-circle': 'InfoCircle',
  'ti-alert-triangle': 'Danger',
  'ti-check-circle': 'TickCircle',
  'ti-settings': 'Setting2',
  'ti-refresh': 'Refresh',
  'ti-eye': 'Eye',
  'ti-star': 'Star',
  'ti-flame': 'Flash',
  'ti-bolt': 'Flash',
  'ti-command': 'Command',
  'ti-radar-2': 'Radar',
  'ti-filter-search': 'SearchNormal1',
  'ti-chart-arrows-vertical': 'Chart2',
  'ti-shield-check': 'ShieldTick',
  'ti-book-2': 'Book1',
  'ti-school': 'Teacher',
  'ti-layout-kanban': 'Kanban',
  'ti-repeat': 'Repeat',
  'ti-road': 'Map',
  'ti-user-screen': 'User',
  'ti-plug-connected': 'Link',
  'ti-mail-forward': 'DirectboxSend',
  'ti-ad': 'Gallery',
  'ti-transfer': 'Routing',
  'ti-user-star': 'User',
  'ti-brand-instagram': 'Instagram',
  'ti-lock-access': 'Lock',
  'ti-checkup-list': 'ClipboardTick',
  'ti-history': 'Timer',
  'ti-calendar-event': 'CalendarTick',
  'ti-filter-check': 'Filter',
  'ti-clock-check': 'Timer1',
  'ti-clock-exclamation': 'Timer',
  'ti-calendar-due': 'Calendar',
  'ti-checklist': 'Clipboard',
  'ti-user-exclamation': 'UserOctagon',
  'ti-hourglass-empty': 'Timer',
  'ti-progress-check': 'Task',
  'ti-shield-bolt': 'ShieldCross',
  'ti-user-share': 'UserAdd',
  'ti-moon': 'Moon',
  'ti-player-play': 'Play',
  'ti-player-pause': 'Pause',
  'ti-rocket': 'Rocket',
  'ti-heart-handshake': 'Heart',
  'ti-building-estate': 'Building',
  'ti-broadcast': 'Broadcast',
  'ti-tent': 'Location',
  'ti-truck-delivery': 'Truck',
  'ti-scale': 'Scale',
  'ti-gavel': 'Judge',
  'ti-flask': 'Glass',
  'ti-adjustments': 'Setting',
  'ti-notes': 'Note',
  'ti-alarm': 'Alarm',
  'ti-wand': 'MagicStar',
  'ti-list-check': 'TaskSquare',
  'ti-microphone': 'Microphone2',
  'ti-microphone-2': 'Microphone',
  'ti-certificate': 'Award',
  'ti-cash': 'Money',
  'ti-receipt': 'Receipt',
  'ti-gap': 'ArrowRight',
  'ti-clipboard-check': 'ClipboardTick',
  'ti-clipboard-list': 'Clipboard',
  'ti-target-arrow': 'Focus',
  'ti-photo-check': 'GalleryTick',
  'ti-mail-check': 'Sms',
  'ti-mail-opened': 'SmsEdit',
  'ti-click': 'Mouse',
  'ti-stack-2': 'Element',
  'ti-chart-dots-3': 'Chart',
  'ti-chart-histogram': 'Chart',
  'ti-currency-naira': 'Money',
  'ti-message': 'Message',
  'ti-message-plus': 'MessageAdd',
  'ti-location': 'Location',
  'ti-map-pin-check': 'LocationTick',
  'ti-files': 'Document',
  'ti-file-text': 'DocumentText',
  'ti-file-check': 'DocumentTick',
  'ti-users-group': 'People',
  'ti-brand-google': 'Google',
  'ti-brand-facebook': 'Facebook',
  'ti-arrows-exchange': 'Routing',
  'ti-credit-card': 'Card',
  'ti-user-check': 'UserTick',
  'ti-user-edit': 'UserEdit',
  'ti-user-minus': 'UserMinus',
  'ti-video': 'Video',
  'ti-video-circle': 'VideoCircle',
  'ti-image': 'Image',
  'ti-photo': 'Gallery',
  'ti-wifi-off': 'Slash',
  'ti-bulb': 'Bulb',
  'ti-sun': 'Sun1',
  'ti-sun-high': 'Sun',
  'ti-moon-stars': 'Moon',
  'ti-ti': 'EmptyWallet',
  'ti-route': 'Routing',
  'ti-paperclip': 'AttachSquare',
  'ti-pin': 'Location',
  'ti-tag': 'Tag',
  'ti-flag': 'Flag',
  'ti-archive': 'Archive',
  'ti-attach': 'AttachSquare',
  'ti-link': 'Link',
  'ti-unlink': 'Link',
  'ti-external-link': 'Export',
  'ti-maximize': 'Maximize',
  'ti-minimize': 'Minimize',
  'ti-move': 'Arrows',
  'ti-crop': 'Crop',
  'ti-scissors': 'Scissors',
  'ti-bold': 'Bold',
  'ti-italic': 'Italic',
  'ti-underline': 'Underline',
  'ti-list': 'Menu',
  'ti-ordered-list': 'NumberList',
  'ti-quote': 'QuoteDown',
  'ti-code': 'Code',
  'ti-table': 'Table',
  'ti-columns': 'Rows',
  'ti-rows': 'Rows',
  'ti-grid': 'Grid',
  'ti-grid-4': 'Grid4',
  'ti-grid-3': 'Grid3',
  'ti-grid-2': 'Grid2',
  'ti-layout': 'Element',
  'ti-layout-2': 'Element',
  'ti-layout-grid': 'Grid',
  'ti-layout-columns': 'Column',
  'ti-layout-rows': 'Row',
  'ti-layout-navbar': 'Element',
  'ti-layout-sidebar': 'Element',
  'ti-layout-footer': 'Element',
  'ti-layout-header': 'Element',
  'ti-layout-distribute-horizontal': 'ArrangeHorizontal',
  'ti-layout-distribute-vertical': 'ArrangeVertical',
  'ti-ban': 'Ban',
  'ti-circle': 'Circle',
  'ti-square': 'Square',
  'ti-triangle': 'Triangle',
  'ti-diamond': 'Diamond',
  'ti-activity': 'Activity',
  'ti-loader': 'Progress',
  'ti-loader-2': 'Progress',
  'ti-loader-3': 'Progress',
  'ti-alert-circle': 'Danger',
  'ti-alert-octagon': 'Danger',
  'ti-alert-small': 'Danger',
  'ti-help': 'InfoCircle',
  'ti-help-circle': 'InfoCircle',
  'ti-help-octagon': 'InfoCircle',
  'ti-info': 'InfoCircle',
  'ti-warning': 'Warning2',
  'ti-error': 'CloseCircle',
  'ti-success': 'TickCircle',
  'ti-checkbox': 'TickSquare',
  'ti-checkbox-checked': 'TickSquare',
  'ti-radio': 'Radio',
  'ti-radio-checked': 'Radio',
  'ti-toggle': 'ToggleOn',
  'ti-toggle-off': 'ToggleOff',
  'ti-slider': 'Slider',
  'ti-slider-horizontal': 'SliderHorizontal',
  'ti-slider-vertical': 'SliderVertical',
  'ti-switch': 'ToggleOn',
  'ti-switch-off': 'ToggleOff',
  'ti-progress': 'Progress',
  'ti-percent': 'Percentage',
  'ti-plus-minus': 'Add',
  'ti-hash': 'Hashtag',
  'ti-at': 'Message',
  'ti-dollar': 'DollarCircle',
  'ti-euro': 'EuroCircle',
  'ti-pound': 'Money',
  'ti-yen': 'Money',
  'ti-credit-card-off': 'CardSlash',
  'ti-discount': 'DiscountCircle',
  'ti-gift': 'Gift',
  'ti-receipt-off': 'Receipt',
  'ti-shopping-cart': 'ShoppingCart',
  'ti-shopping-bag': 'Bag',
  'ti-shopping-basket': 'Basket',
  'ti-truck': 'Truck',
  'ti-delivery': 'TruckFast',
  'ti-package': 'Box',
  'ti-box': 'Box',
  'ti-archive-off': 'ArchiveSlash',
  'ti-container': 'Box',
  'ti-stack': 'Element',
  'ti-layers': 'Layers',
  'ti-layers-intersect': 'Layers',
  'ti-layers-subtract': 'Layers',
  'ti-layers-union': 'Layers',
  'ti-layers-difference': 'Layers',
  'ti-zoom-in': 'Zoom',
  'ti-zoom-out': 'Zoom',
  'ti-zoom-code': 'Code',
  'ti-zoom-question': 'QuestionMark',
  'ti-zoom-replace': 'Refresh',
  'ti-zoom-reset': 'Refresh',
  'ti-zoom-cancel': 'CloseCircle',
  'ti-zoom-check': 'TickCircle',
  'ti-zoom-scan': 'Scan',
  'ti-focus': 'Focus',
  'ti-focus-2': 'Focus',
  'ti-aperture': 'Aperture',
  'ti-aperture-off': 'Slash',
  'ti-camera': 'Camera',
  'ti-camera-off': 'CameraSlash',
  'ti-camera-plus': 'Camera',
  'ti-camera-selfie': 'Camera',
  'ti-video-off': 'VideoSlash',
  'ti-video-plus': 'VideoAdd',
  'ti-music': 'Music',
  'ti-music-off': 'Music',
  'ti-music-plus': 'Music',
  'ti-disc': 'Music',
  'ti-headphones': 'Headphones',
  'ti-volume': 'VolumeHigh',
  'ti-volume-2': 'VolumeHigh',
  'ti-volume-3': 'VolumeLow',
  'ti-volume-off': 'VolumeSlash',
  'ti-mic': 'Microphone',
  'ti-mic-off': 'MicrophoneSlash',
  'ti-voice': 'Voice',
  'ti-voice-off': 'VoiceSlash',
  'ti-voice-cricle': 'VoiceCircle',
  'ti-voice-square': 'VoiceSquare',
  'ti-antenna': 'Antenna',
  'ti-antenna-off': 'AntennaSlash',
  'ti-signal': 'Signal',
  'ti-wifi': 'Wifi',
  'ti-bluetooth': 'Bluetooth',
  'ti-bluetooth-off': 'BluetoothSlash',
  'ti-cast': 'Cast',
  'ti-cast-off': 'CastSlash',
  'ti-screen-share': 'Monitor',
  'ti-screen-share-off': 'MonitorSlash',
  'ti-devices': 'Devices',
  'ti-devices-off': 'DevicesSlash',
  'ti-device-desktop': 'Monitor',
  'ti-device-desktop-analytics': 'Monitor',
  'ti-device-desktop-bolt': 'Monitor',
  'ti-device-desktop-cancel': 'Monitor',
  'ti-device-desktop-check': 'Monitor',
  'ti-device-desktop-code': 'Monitor',
  'ti-device-desktop-cog': 'Monitor',
  'ti-device-desktop-dollar': 'Monitor',
  'ti-device-desktop-down': 'Monitor',
  'ti-device-desktop-exclamation': 'Monitor',
  'ti-device-desktop-heart': 'Monitor',
  'ti-device-desktop-minus': 'Monitor',
  'ti-device-desktop-off': 'MonitorSlash',
  'ti-device-desktop-pause': 'Monitor',
  'ti-device-desktop-pin': 'Monitor',
  'ti-device-desktop-plus': 'Monitor',
  'ti-device-desktop-question': 'Monitor',
  'ti-device-desktop-search': 'Monitor',
  'ti-device-desktop-share': 'Monitor',
  'ti-device-desktop-star': 'Monitor',
  'ti-device-desktop-up': 'Monitor',
  'ti-device-desktop-x': 'Monitor',
  'ti-device-floppy': 'Save2',
  'ti-device-gamepad': 'Gameboy',
  'ti-device-gamepad-2': 'Gameboy',
  'ti-device-ipad': 'Tablet',
  'ti-device-ipad-horizontal': 'Tablet',
  'ti-device-laptop': 'Laptop',
  'ti-device-mobile': 'Mobile',
  'ti-device-mobile-bolt': 'Mobile',
  'ti-device-mobile-cancel': 'Mobile',
  'ti-device-mobile-check': 'Mobile',
  'ti-device-mobile-code': 'Mobile',
  'ti-device-mobile-cog': 'Mobile',
  'ti-device-mobile-dollar': 'Mobile',
  'ti-device-mobile-down': 'Mobile',
  'ti-device-mobile-exclamation': 'Mobile',
  'ti-device-mobile-heart': 'Mobile',
  'ti-device-mobile-message': 'Mobile',
  'ti-device-mobile-minus': 'Mobile',
  'ti-device-mobile-off': 'MobileSlash',
  'ti-device-mobile-pause': 'Mobile',
  'ti-device-mobile-pin': 'Mobile',
  'ti-device-mobile-plus': 'Mobile',
  'ti-device-mobile-question': 'Mobile',
  'ti-device-mobile-search': 'Mobile',
  'ti-device-mobile-share': 'Mobile',
  'ti-device-mobile-star': 'Mobile',
  'ti-device-mobile-up': 'Mobile',
  'ti-device-mobile-vibration': 'Mobile',
  'ti-device-mobile-x': 'Mobile',
  'ti-device-sd-card': 'SdCard',
  'ti-device-sim': 'Simcard',
  'ti-device-sim-1': 'Simcard',
  'ti-device-sim-2': 'Simcard',
  'ti-device-sim-3': 'Simcard',
  'ti-device-speaker': 'Speaker',
  'ti-device-tablet': 'Tablet',
  'ti-device-tablet-bolt': 'Tablet',
  'ti-device-tablet-cancel': 'Tablet',
  'ti-device-tablet-check': 'Tablet',
  'ti-device-tablet-code': 'Tablet',
  'ti-device-tablet-cog': 'Tablet',
  'ti-device-tablet-dollar': 'Tablet',
  'ti-device-tablet-down': 'Tablet',
  'ti-device-tablet-exclamation': 'Tablet',
  'ti-device-tablet-heart': 'Tablet',
  'ti-device-tablet-minus': 'Tablet',
  'ti-device-tablet-off': 'TabletSlash',
  'ti-device-tablet-pause': 'Tablet',
  'ti-device-tablet-pin': 'Tablet',
  'ti-device-tablet-plus': 'Tablet',
  'ti-device-tablet-question': 'Tablet',
  'ti-device-tablet-search': 'Tablet',
  'ti-device-tablet-share': 'Tablet',
  'ti-device-tablet-star': 'Tablet',
  'ti-device-tablet-up': 'Tablet',
  'ti-device-tablet-x': 'Tablet',
  'ti-device-tv': 'DeviceMessage',
  'ti-device-tv-off': 'DeviceMessage',
  'ti-device-usb': 'Usb',
  'ti-device-watch': 'Watch',
  'ti-device-watch-bolt': 'Watch',
  'ti-device-watch-cancel': 'Watch',
  'ti-device-watch-check': 'Watch',
  'ti-device-watch-code': 'Watch',
  'ti-device-watch-cog': 'Watch',
  'ti-device-watch-dollar': 'Watch',
  'ti-device-watch-down': 'Watch',
  'ti-device-watch-exclamation': 'Watch',
  'ti-device-watch-heart': 'Watch',
  'ti-device-watch-minus': 'Watch',
  'ti-device-watch-off': 'WatchSlash',
  'ti-device-watch-pause': 'Watch',
  'ti-device-watch-pin': 'Watch',
  'ti-device-watch-plus': 'Watch',
  'ti-device-watch-question': 'Watch',
  'ti-device-watch-search': 'Watch',
  'ti-device-watch-share': 'Watch',
  'ti-device-watch-star': 'Watch',
  'ti-device-watch-up': 'Watch',
  'ti-device-watch-x': 'Watch',
  'ti-eye-off': 'EyeSlash',
  'ti-eye-table': 'Eye',
  'ti-globe': 'Global',
  'ti-globe-off': 'Global',
  'ti-heart': 'Heart',
  'ti-heart-off': 'HeartSlash',
  'ti-heart-plus': 'HeartAdd',
  'ti-heart-minus': 'Heart',
  'ti-heart-cancel': 'Heart',
  'ti-heart-check': 'Heart',
  'ti-heart-code': 'Heart',
  'ti-heart-cog': 'Heart',
  'ti-heart-dollar': 'Heart',
  'ti-heart-down': 'Heart',
  'ti-heart-exclamation': 'Heart',
  'ti-heart-pin': 'Heart',
  'ti-heart-question': 'Heart',
  'ti-heart-search': 'Heart',
  'ti-heart-share': 'Heart',
  'ti-heart-star': 'Heart',
  'ti-heart-up': 'Heart',
  'ti-heart-x': 'HeartSlash',
  'ti-infinity': 'Infinity',
  'ti-key': 'Key',
  'ti-key-off': 'KeySlash',
  'ti-lamp': 'Lamp',
  'ti-lamp-2': 'Lamp',
  'ti-lamp-off': 'LampSlash',
  'ti-language': 'LanguageSquare',
  'ti-language-hiragana': 'LanguageSquare',
  'ti-language-katakana': 'LanguageSquare',
  'ti-language-off': 'LanguageSquare',
  'ti-leaf': 'Leaf',
  'ti-leaf-off': 'LeafSlash',
  'ti-lego': 'Brick',
  'ti-lemon': 'Lemon',
  'ti-lemon-2': 'Lemon',
  'ti-letter-a': 'Text',
  'ti-letter-b': 'Text',
  'ti-letter-c': 'Text',
  'ti-letter-case': 'Text',
  'ti-letter-case-toggle': 'Text',
  'ti-letter-d': 'Text',
  'ti-letter-e': 'Text',
  'ti-letter-f': 'Text',
  'ti-letter-g': 'Text',
  'ti-letter-h': 'Text',
  'ti-letter-i': 'Text',
  'ti-letter-j': 'Text',
  'ti-letter-k': 'Text',
  'ti-letter-l': 'Text',
  'ti-letter-m': 'Text',
  'ti-letter-n': 'Text',
  'ti-letter-o': 'Text',
  'ti-letter-p': 'Text',
  'ti-letter-q': 'Text',
  'ti-letter-r': 'Text',
  'ti-letter-s': 'Text',
  'ti-letter-spacing': 'Text',
  'ti-letter-t': 'Text',
  'ti-letter-u': 'Text',
  'ti-letter-v': 'Text',
  'ti-letter-w': 'Text',
  'ti-letter-x': 'Text',
  'ti-letter-y': 'Text',
  'ti-letter-z': 'Text',
  'ti-lifebuoy': 'Lifebuoy',
  'ti-light-bulb': 'Bulb',
  'ti-light-bulb-off': 'BulbSlash',
  'ti-light-emitting-diode': 'Lamp',
  'ti-line': 'Line',
  'ti-list-details': 'Menu',
  'ti-list-numbers': 'NumberList',
  'ti-list-search': 'Menu',
  'li': 'EmptyWallet',
  'ti': 'EmptyWallet',
  '': 'EmptyWallet',
}

export function getIconName(tiClass: string): string {
  return IconsMap[tiClass] || 'EmptyWallet'
}
