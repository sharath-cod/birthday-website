const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { DEPARTMENTS, USN_REGEX, PASSWORD_REGEX } = require('../utils/constants');

// Per-IP limit. Generous on purpose: a whole class on one college Wi-Fi shares ONE public IP,
// so a small limit would lock out students who all log in at the start of a lab session.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

// Password-guessing protection is per ACCOUNT instead: 10 wrong passwords per email per 15 minutes.
// Successful logins are not counted, so students never block each other.
const failedLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String((req.body && req.body.email) || 'no-email').trim().toLowerCase().slice(0, 200),
  message: { success: false, message: 'Too many failed attempts for this account. Please try again in 15 minutes.' },
});

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name is too long'),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('usn')
    .trim()
    .customSanitizer((v) => String(v || '').toUpperCase())
    .notEmpty()
    .withMessage('USN is required')
    .matches(USN_REGEX)
    .withMessage('USN should be 6-15 letters/digits with no spaces'),
  body('department').optional({ values: 'falsy' }).isIn(DEPARTMENTS).withMessage('Choose a department from the list'),
  body('password').matches(PASSWORD_REGEX).withMessage('Password needs 8+ characters with at least one letter and one number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty().withMessage('Password is required'),
  body('expectedRole').optional().isIn(['student', 'admin']),
];

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, failedLoginLimiter, loginRules, validate, login);
router.get('/me', protect, me);

module.exports = router;
