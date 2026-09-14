/**
 * fetch wrapper ຮ່ວມ — ໃຊ້ cookie (httpOnly JWT) ອັດຕະໂນມັດຜ່ານ credentials:'include'
 * ໃນ dev, Vite proxy ຈະສົ່ງ /api/* ຕໍ່ໄປຫາ Express (server/) ໂດຍບໍ່ຕິດ CORS
 */
async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, error: 'ຄຳຕອບຈາກເຊີບເວີບໍ່ຖືກຕ້ອງ' };
  }
  if (!res.ok && data.success === undefined) {
    data.success = false;
  }
  return data;
}

async function uploadFile(path, formData) {
  const res = await fetch(`/api${path}`, { method: 'POST', credentials: 'include', body: formData });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, error: 'ຄຳຕອບຈາກເຊີບເວີບໍ່ຖືກຕ້ອງ' };
  }
  if (!res.ok && data.success === undefined) data.success = false;
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path, body) => request(path, { method: 'DELETE', body }),
  upload: (path, formData) => uploadFile(path, formData),
};

export function formatMoney(amount, currency = 'LAK') {
  const n = Number(amount || 0);
  return `${n.toLocaleString('en-US')} ${currency}`;
}
