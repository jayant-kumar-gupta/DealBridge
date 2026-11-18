export function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function setQueryParam(key, value) {
  const params = new URLSearchParams(window.location.search);
  if (value === null || value === undefined || value === '') {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

export function getAllQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
}

export function navigateTo(url) {
  window.location.href = url;
}
