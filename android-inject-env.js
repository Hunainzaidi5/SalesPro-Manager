import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ANDROID_DIR = join(__dirname, 'android');
const ANDROID_APP_DIR = join(ANDROID_DIR, 'app');
const ANDROID_MAIN_DIR = join(ANDROID_APP_DIR, 'src', 'main');
const ANDROID_ASSETS_DIR = join(ANDROID_MAIN_DIR, 'assets');
const ANDROID_RES_DIR = join(ANDROID_MAIN_DIR, 'res', 'values');

// Create necessary directories if they don't exist
[ANDROID_MAIN_DIR, ANDROID_ASSETS_DIR, ANDROID_RES_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Get environment variables with fallbacks
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase URL or Anon Key in environment variables');
  process.exit(1);
}

// Create or update strings.xml with Supabase configuration
const stringsXmlPath = join(ANDROID_RES_DIR, 'strings.xml');
const stringsXml = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<resources>',
  '    <string name="app_name">SalesPro Manager</string>',
  '    <string name="title_activity_main">SalesPro Manager</string>',
  '    <string name="package_name">com.salespro.manager</string>',
  '    <string name="custom_url_scheme">com.salespro.manager</string>',
  `    <string name="supabase_url" translatable="false">${supabaseUrl}</string>`,
  `    <string name="supabase_anon_key" translatable="false">${supabaseAnonKey}</string>`,
  '</resources>'
].join('\n');

writeFileSync(stringsXmlPath, stringsXml);

// Create a JavaScript file that will be injected into the WebView
const configJs = `// This file is auto-generated. Do not edit it manually.
window.CAPACITOR_SUPABASE = window.CAPACITOR_SUPABASE || {};
window.CAPACITOR_SUPABASE.SUPABASE_URL = '${supabaseUrl}';
window.CAPACITOR_SUPABASE.SUPABASE_ANON_KEY = '${supabaseAnonKey}';
`;

writeFileSync(join(ANDROID_ASSETS_DIR, 'supabase-config.js'), configJs);

console.log('✅ Android environment variables injected successfully!');
console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Supabase Key:', supabaseAnonKey ? '✓ Set (first few chars: ' + supabaseAnonKey.substring(0, 10) + '...)' : '✗ Missing');
