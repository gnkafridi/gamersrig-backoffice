/**
 * Maps category names to MUI icon components.
 * Import getCategoryIcon(name) to get the component, then render it.
 */
import {
  Headphones, HeadsetMic, Cable, Usb, AcUnit, Memory, Air,
  SportsEsports, Keyboard, Mouse, Monitor, Router, Wifi,
  SettingsInputHdmi, SettingsInputAntenna, ElectricalServices,
  Lightbulb, Extension, PhoneIphone, DeveloperBoard, Tune,
  Storage as StorageIcon,
} from '@mui/icons-material';

const CATEGORY_ICONS = {
  // ── Parents ──────────────────────────────────────────────────────
  'Accessories':                  Extension,
  'Audio':                        Headphones,
  'Cables':                       Cable,
  'Coolers':                      AcUnit,
  'CPU':                          Memory,
  'FAN':                          Air,
  'Gamepad Controllers':          SportsEsports,
  'Gaming Keyboards':             Keyboard,
  'Gaming Mouse':                 Mouse,
  'Graphics Cards':               DeveloperBoard,
  'Monitors':                     Monitor,
  'Routers':                      Router,
  'Storage':                      StorageIcon,
  'Wifi Card':                    Wifi,
  // ── Audio subs ───────────────────────────────────────────────────
  'Headphones':                   Headphones,
  'Wired earbuds':                Headphones,
  'Wired headset':                HeadsetMic,
  // ── Cables subs ──────────────────────────────────────────────────
  'Display Port':                 SettingsInputHdmi,
  'HDMI':                         SettingsInputHdmi,
  'Power Cable':                  ElectricalServices,
  'Type C to C':                  Usb,
  // ── Coolers subs ─────────────────────────────────────────────────
  'AIO coolers':                  AcUnit,
  'Air Coolers':                  Air,
  // ── CPU subs ─────────────────────────────────────────────────────
  'AMD':                          Memory,
  'Intel':                        Memory,
  // ── Gamepad subs ─────────────────────────────────────────────────
  'RGB Controllers':              Tune,
  'Mobile gamepad controllers':   PhoneIphone,
  'Wired gamepad controller':     SportsEsports,
  'Wireless gamepad controllers': SportsEsports,
  // ── Keyboard subs ────────────────────────────────────────────────
  'Wired keyboards':              Keyboard,
  'Wireless Keyboards':           Keyboard,
  // ── Mouse subs ───────────────────────────────────────────────────
  'Wired Mouse':                  Mouse,
  'Wireless Mouse':               Mouse,
  // ── Router / Wifi subs ───────────────────────────────────────────
  'Premium Routers':              Router,
  'Wifi antenna':                 SettingsInputAntenna,
  'Wifi cards':                   Wifi,
  'Wifi PCIe adapters':           Wifi,
  // ── Fan subs ─────────────────────────────────────────────────────
  'RGB Fans':                     Lightbulb,
};

export default CATEGORY_ICONS;
