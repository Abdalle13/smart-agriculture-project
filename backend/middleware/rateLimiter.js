import rateLimit from 'express-rate-limit'

/**
 * General API Rate Limiter - Dhawrida API-ga Guud
 * Protects all API endpoints from excessive automated requests. 
 * Ka hortagga culeyska guud ee DoS attack-s
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiiqo
  max: 300, // Limit each IP to 300 requests per 15 mins
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
})

/**
 * Auth Rate Limiter
 * Prevents brute-force attacks on Login and Registration endpoints.
 * Ka hortagga brute-force password guessing
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
})

/**
 * IoT Sensor Hardware Rate Limiter
 * Protects POST /api/sensors/readings from DoS attacks and DB overload.
 * ESP32 typically sends 1 reading every 30s (2/min). Limit allows multiple nodes per IP if behind NAT.
 * Dhawridda database-ka iyo hardware ESP32-ka ee data uploads-ka
 */
export const sensorReadingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // Limit each IP to 120 readings per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many sensor readings submitted. Rate limit exceeded.',
  },
})

/**
 * Support / Contact Message Rate Limiter
 * Prevents spamming support tickets.
 * Ka hortagga spam-ka fariimaha support-ka
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 messages per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many support messages sent. Please wait 15 minutes before sending another message.',
  },
})
