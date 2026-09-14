import crypto from 'crypto';

export const PACKAGE_STATUS_LABELS = {
  ordered: 'ສັ່ງແລ້ວ (ລໍຖ້າຮ້ານຈີນຈັດສົ່ງ)',
  arrived_cn_warehouse: 'ຮອດສາງຈີນແລ້ວ',
  shipped: 'ກຳລັງຂົນສົ່ງມາລາວ',
  arrived_la_warehouse: 'ຮອດສາງລາວແລ້ວ',
  out_for_delivery: 'ກຳລັງຈັດສົ່ງໃຫ້ລູກຄ້າ',
  delivered: 'ສົ່ງເຄື່ອງແລ້ວ',
  cancelled: 'ຍົກເລີກ',
};

export const STATUS_FLOW = [
  'ordered',
  'arrived_cn_warehouse',
  'shipped',
  'arrived_la_warehouse',
  'out_for_delivery',
  'delivered',
];

export function statusLabel(status) {
  return PACKAGE_STATUS_LABELS[status] || status;
}

/** ລະຫັດຕິດຕາມແບບ ASB-YYMMDD-XXXX (ບໍ່ຊ້ຳ) */
export async function generateTrackingCode(pool, prefix = 'ASB') {
  const date = new Date();
  const ymd = String(date.getFullYear()).slice(2) + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    const code = `${prefix}-${ymd}-${rand}`;
    const [rows] = await pool.query('SELECT COUNT(*) AS c FROM packages WHERE tracking_code = ?', [code]);
    if (rows[0].c === 0) return code;
  }
}

/** ລະຫັດລູກຄ້າແບບ ASB0001 */
export async function generateCustomerCode(pool) {
  const [rows] = await pool.query('SELECT code FROM customers ORDER BY id DESC LIMIT 1');
  let n = 1;
  if (rows.length) {
    const m = /(\d+)$/.exec(rows[0].code);
    if (m) n = parseInt(m[1], 10) + 1;
  }
  return 'ASB' + String(n).padStart(4, '0');
}

export function toNumberOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
