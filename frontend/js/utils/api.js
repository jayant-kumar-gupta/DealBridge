const BASE_URL = '/api/v1';

/**
 * Core fetch wrapper.
 * - Injects stored JWT Authorization header if available
 * - Handles JSON objects, FormData, and URLSearchParams
 * - Normalizes endpoint URLs to prevent double-prefixing
 * - Throws on non-OK responses with the server's error message
 * - Returns null for 204 No Content responses
 */
async function request(endpoint, options = {}) {
    const { _returnMeta = false, ...fetchOptions } = options;
    const cleanEndpoint = endpoint.startsWith(BASE_URL)
        ? endpoint.slice(BASE_URL.length)
        : endpoint;
    const url = `${BASE_URL}${cleanEndpoint.startsWith('/') ? '' : '/'}${cleanEndpoint}`;

    const headers = {
        ...fetchOptions.headers,
    };

    // Attach JWT token if available and not explicitly provided
    const token = localStorage.getItem('dealbridge_token');
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Process body based on type
    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
        if (fetchOptions.body instanceof FormData) {
            // Let the browser set Content-Type with multipart boundary
            delete headers['Content-Type'];
        } else if (fetchOptions.body instanceof URLSearchParams) {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            fetchOptions.body = fetchOptions.body.toString();
        } else {
            headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(fetchOptions.body);
        }
    }

    const response = await fetch(url, { ...fetchOptions, headers });

    // Handle non-OK responses (4xx, 5xx)
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('dealbridge_token');
            localStorage.removeItem('dealbridge_auth');
        }
        const errorData = await response.json().catch(() => ({}));
        let message = `Request failed: ${response.status}`;
        if (typeof errorData.detail === 'string') {
            message = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
            message = errorData.detail.map(e => e.msg || e.detail).join(', ');
        } else if (errorData.message) {
            message = errorData.message;
        }
        throw new Error(message);
    }

    // 204 No Content has no body to parse
    const data = response.status === 204 ? null : await response.json();

    if (_returnMeta) {
        const rawTotal = response.headers.get('X-Total-Count');
        const totalCount = rawTotal !== null && !Number.isNaN(Number(rawTotal))
            ? Number(rawTotal)
            : null;
        return { data, totalCount };
    }

    return data;
}

// Convenience methods
export const api = {
    get:         (endpoint, options)        => request(endpoint, { ...options, method: 'GET' }),
    getWithMeta: (endpoint, options)        => request(endpoint, { ...options, method: 'GET', _returnMeta: true }),
    post:        (endpoint, body, options)  => request(endpoint, { ...options, method: 'POST', body }),
    put:         (endpoint, body, options)  => request(endpoint, { ...options, method: 'PUT', body }),
    delete:      (endpoint, options)        => request(endpoint, { ...options, method: 'DELETE' }),
};