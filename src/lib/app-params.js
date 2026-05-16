const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

// Extract appId from subdomain e.g. preview-sandbox--{appId}.base44.app or {appId}.base44.app
// Also handles custom domains by reading VITE_BASE44_APP_ID injected at build time
const getAppIdFromHostname = () => {
	if (isNode) return null;
	const host = window.location.hostname;
	// Standard base44.app subdomains
	const match = host.match(/--([a-f0-9]{24})\.base44\.app/) || host.match(/^([a-f0-9]{24})\.base44\.app/);
	if (match) return match[1];
	// Custom domain: fall back to build-time env var
	return import.meta.env.VITE_BASE44_APP_ID || null;
};

const HARDCODED_APP_ID = import.meta.env.VITE_BASE44_APP_ID || null;

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	const appIdFromHostname = getAppIdFromHostname();
	const appId = getAppParamValue("app_id", { defaultValue: appIdFromHostname || HARDCODED_APP_ID });
	if (!isNode) {
		console.log('[base44] hostname:', window.location.hostname, '| appId resolved:', appId);
	}
	return {
		appId,
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
		serverUrl: getAppParamValue("server_url", { defaultValue: import.meta.env.VITE_BASE44_SERVER_URL || '' }),
	}
}


export const appParams = {
	...getAppParams()
}