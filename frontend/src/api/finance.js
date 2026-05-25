import client from './client';

// ── Partners ──────────────────────────────────────────
export const getPartners = (params) => client.get('/partners', { params });
export const createPartner = (data) => client.post('/partners', data);
export const updatePartner = (id, data) => client.put(`/partners/${id}`, data);
export const deletePartner = (id) => client.delete(`/partners/${id}`);

// ── Investments ───────────────────────────────────────
export const getInvestments = (params) => client.get('/finance/investments', { params });
export const createInvestment = (data) => client.post('/finance/investments', data);
export const updateInvestment = (id, data) => client.put(`/finance/investments/${id}`, data);
export const deleteInvestment = (id) => client.delete(`/finance/investments/${id}`);

// ── Expenses ──────────────────────────────────────────
// Pass a FormData (with a `proof` file) for multipart, or a plain object for JSON.
const maybeMultipart = (data) =>
  data instanceof FormData ? { headers: { 'Content-Type': undefined } } : undefined;

export const getExpenses = (params) => client.get('/finance/expenses', { params });
export const createExpense = (data) => client.post('/finance/expenses', data, maybeMultipart(data));
export const updateExpense = (id, data) => client.put(`/finance/expenses/${id}`, data);
export const deleteExpense = (id) => client.delete(`/finance/expenses/${id}`);

// ── Monthly agreed investment (shared budget per month) ──
export const getMonthlyInvestments = (params) => client.get('/finance/monthly-investments', { params });
export const upsertMonthlyInvestment = (data) => client.post('/finance/monthly-investments', data);
export const deleteMonthlyInvestment = (id) => client.delete(`/finance/monthly-investments/${id}`);

// ── Stock Spent = product purchases (unified with inventory) ──
export const getStockPurchases = (params) => client.get('/finance/stock-purchases', { params });
export const createStockPurchase = (data) => client.post('/finance/stock-purchases', data, maybeMultipart(data));
export const createStockBatch = (formData) => client.post('/finance/stock-purchases/batch', formData, { headers: { 'Content-Type': undefined } });
export const updateStockPurchase = (id, data) => client.post(`/finance/stock-purchases/${id}`, data, maybeMultipart(data));
export const deleteStockPurchase = (id) => client.delete(`/finance/stock-purchases/${id}`);

// ── Partner Ledger (who-owes-whom) + reimbursements ───
export const getLedger = (params) => client.get('/finance/ledger', { params });
export const getReimbursements = (params) => client.get('/finance/reimbursements', { params });
export const createReimbursement = (data) =>
  client.post('/finance/reimbursements', data, maybeMultipart(data));
export const deleteReimbursement = (id) => client.delete(`/finance/reimbursements/${id}`);
export const downloadLedgerCsv = (params) => client.get('/finance/ledger/export/csv', { params, responseType: 'blob' });
export const downloadLedgerPdf = (params) => client.get('/finance/ledger/export/pdf', { params, responseType: 'blob' });

// Build a public URL for a stored proof path (e.g. "proofs/abc.jpg").
export const proofUrl = (path) => {
  if (!path) return null;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
  return `${base}/storage/${path}`;
};

// ── COD ───────────────────────────────────────────────
export const getCod = (params) => client.get('/finance/cod', { params });
export const createCod = (data) => client.post('/finance/cod', data);
export const updateCod = (id, data) => client.put(`/finance/cod/${id}`, data);
export const deleteCod = (id) => client.delete(`/finance/cod/${id}`);
export const markCodReceived = (id, data) => client.patch(`/finance/cod/${id}/received`, data);

// ── Aggregates ────────────────────────────────────────
export const getFinanceOverview = (params) => client.get('/finance/overview', { params });
export const getSettlement = (params) => client.get('/finance/settlement', { params });
export const finalizeSettlement = (data) => client.post('/finance/settlement/finalize', data);
export const getRevenue = (params) => client.get('/finance/revenue', { params });
export const getQuarterly = (params) => client.get('/finance/quarterly', { params });
export const finalizeQuarterly = (data) => client.post('/finance/quarterly/finalize', data);

// ── Exports (blob) ────────────────────────────────────
export const downloadFinancePdf = (type, params) =>
  client.get(`/finance/reports/${type}/pdf`, { params, responseType: 'blob' });
export const downloadFinanceCsv = (type, params) =>
  client.get(`/finance/reports/${type}/csv`, { params, responseType: 'blob' });
