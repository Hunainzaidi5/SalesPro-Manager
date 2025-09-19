import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.salesmanager.app',
	appName: 'Sales Manager',
	webDir: 'dist',
	server: {
		androidScheme: 'https',
		url: 'https://sales-pro-manager.vercel.app',
		cleartext: false
	}
};

export default config;
