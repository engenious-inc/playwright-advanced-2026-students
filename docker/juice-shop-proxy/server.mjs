/**
 * Reverse proxy in front of Juice Shop that adds the M06 report-generation
 * endpoints the stock image does not ship. All other traffic forwards upstream.
 *
 * Students still run `npm run juice-shop:up` — port 3000 is this proxy.
 */
import http from 'node:http';
import { request as httpRequest } from 'node:http';

const UPSTREAM = process.env.JUICE_SHOP_UPSTREAM ?? 'http://juice-shop:3000';
const PORT = Number(process.env.PORT ?? 3000);

/** Minimal PDF bytes — enough for pdfjs-dist text extraction in M06 demos. */
const STUB_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 44>>stream\nBT /F1 12 Tf 72 720 Td (Total orders: $123.45) Tj ET\nendstream\nendobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000261 00000 n \n0000000354 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n422\n%%EOF',
);

const jobs = new Map();

function proxy(req, res, body) {
  const url = new URL(req.url ?? '/', UPSTREAM);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: req.method,
    headers: { ...req.headers, host: url.host },
  };

  const upstream = httpRequest(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Juice Shop upstream unavailable');
  });
  if (body?.length) upstream.write(body);
  req.pipe(upstream);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url ?? '/', `http://localhost:${PORT}`).pathname;

  if (req.method === 'POST' && pathname === '/api/reports/orders') {
    const jobId = `job-${Date.now()}`;
    jobs.set(jobId, { state: 'pending', polls: 0 });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jobId }));
    return;
  }

  const jobMatch = pathname.match(/^\/api\/reports\/jobs\/([^/]+)$/);
  if (req.method === 'GET' && jobMatch) {
    const jobId = jobMatch[1];
    const job = jobs.get(jobId) ?? { state: 'complete', polls: 0 };
    job.polls += 1;
    if (job.polls >= 2) job.state = 'complete';
    jobs.set(jobId, job);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ state: job.state }));
    return;
  }

  const downloadMatch = pathname.match(/^\/api\/reports\/jobs\/([^/]+)\/download$/);
  if (req.method === 'GET' && downloadMatch) {
    res.writeHead(200, { 'Content-Type': 'application/pdf' });
    res.end(STUB_PDF);
    return;
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxy(req, res);
    return;
  }

  const body = await readBody(req);
  proxy(req, res, body);
});

server.listen(PORT, () => {
  console.log(`Juice Shop proxy listening on :${PORT} → ${UPSTREAM}`);
});
