const BASE_URL = '/api/v1';

/**
 * Core fetch wrapper.
 * - Automatically sets Content-Type for JSON bodies
 * - Throws on non-OK responses with the server's error message
 * - Returns null for 204 No Content responses
 */
async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const headers = {
        ...options.headers,
    };

    // If sending a JSON body, set Content-Type and stringify
    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, { ...options, headers });

    // Handle non-OK responses (4xx, 5xx)
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed: ${response.status}`);
    }

    // 204 No Content has no body to parse
    if (response.status === 204) return null;

    return response.json();
}

// Convenience methods
export const api = {
    get:    (endpoint)        => request(endpoint),
    post:   (endpoint, body)  => request(endpoint, { method: 'POST', body }),
    put:    (endpoint, body)  => request(endpoint, { method: 'PUT', body }),
    delete: (endpoint)        => request(endpoint, { method: 'DELETE' }),
};