const RATE_LIMIT_WINDOW = Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.CONTACT_RATE_LIMIT_MAX || 6);
const requestLog = new Map();

function setSecurityHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function sanitize(value, maxLength = 4000) {
  return String(value ?? "")
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, maxLength);
}

function getClientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const remoteAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress;

  return String(remoteAddress || "anonymous").split(",")[0].trim();
}

function isRateLimited(clientKey) {
  const now = Date.now();
  const recentRequests = (requestLog.get(clientKey) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW,
  );

  if (recentRequests.length >= RATE_LIMIT_MAX) {
    requestLog.set(clientKey, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestLog.set(clientKey, recentRequests);
  return false;
}

function validateBody(body) {
  const data = {
    company: sanitize(body.company, 160),
    email: sanitize(body.email, 160).toLowerCase(),
    message: sanitize(body.message, 2500),
    name: sanitize(body.name, 120),
    website: sanitize(body.website, 160),
  };

  const errors = [];

  if (data.name.length < 2) {
    errors.push("Please provide your full name.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Please use a valid email address.");
  }

  if (data.message.length < 20) {
    errors.push("Please include a little more context in your message.");
  }

  return {
    data,
    errors,
  };
}

export default function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      message: "Method not allowed.",
      ok: false,
    });
  }

  const clientKey = getClientKey(req);

  if (isRateLimited(clientKey)) {
    return res.status(429).json({
      message: "Too many requests. Please wait a moment before sending again.",
      ok: false,
    });
  }

  const { data, errors } = validateBody(req.body || {});

  if (data.website) {
    return res.status(200).json({
      message: "Message received.",
      ok: true,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: errors[0],
      ok: false,
    });
  }

  console.info("[contact-submission]", {
    company: data.company,
    email: data.email,
    name: data.name,
  });

  return res.status(200).json({
    message: "Message accepted. I will get back to you soon.",
    ok: true,
  });
}
