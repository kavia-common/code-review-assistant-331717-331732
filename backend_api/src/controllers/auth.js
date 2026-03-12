'use strict';

const { signupFlow, loginFlow } = require('../flows/authFlows');

class AuthController {
  constructor({ config }) {
    this.config = config;
  }

  /**
   * @swagger
   * /auth/signup:
   *   post:
   *     tags: [Auth]
   *     summary: Create a new user account
   *     description: Creates a user with an email and password and returns a JWT access token.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: "correct horse battery staple"
   *     responses:
   *       201:
   *         description: User created
   *       409:
   *         description: Email already exists
   */
  async signup(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await signupFlow({ email, password }, { config: this.config });
      return res.status(201).json({ status: 'ok', ...result });
    } catch (err) {
      if (err.code === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({ status: 'error', message: 'Email already exists' });
      }
      return next(err);
    }
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login with email/password
   *     description: Returns a JWT access token for subsequent authenticated requests.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: "your password"
   *     responses:
   *       200:
   *         description: Login success
   *       401:
   *         description: Invalid credentials
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await loginFlow({ email, password }, { config: this.config });
      return res.status(200).json({ status: 'ok', ...result });
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
      }
      return next(err);
    }
  }
}

module.exports = {
  AuthController,
};
