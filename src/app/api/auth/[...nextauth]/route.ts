/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /api/auth/signin:
 *   get:
 *     summary: Display sign-in page
 *     tags: [Authentication]
 *     description: Displays the sign-in page with configured authentication providers
 *     responses:
 *       200:
 *         description: Sign-in page HTML
 * 
 *   post:
 *     summary: Authenticate user
 *     tags: [Authentication]
 *     description: Authenticates a user with the selected provider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               csrfToken:
 *                 type: string
 *                 description: CSRF token for security
 *               callbackUrl:
 *                 type: string
 *                 description: URL to redirect after successful authentication
 *               provider:
 *                 type: string
 *                 description: The authentication provider to use (e.g., 'clerk')
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /api/auth/signout:
 *   get:
 *     summary: Display sign-out page
 *     tags: [Authentication]
 *     description: Displays the sign-out confirmation page
 *     responses:
 *       200:
 *         description: Sign-out page HTML
 * 
 *   post:
 *     summary: Sign out user
 *     tags: [Authentication]
 *     description: Signs out the currently authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               csrfToken:
 *                 type: string
 *                 description: CSRF token for security
 *               callbackUrl:
 *                 type: string
 *                 description: URL to redirect after successful sign out
 *     responses:
 *       200:
 *         description: Sign out successful
 * 
 * /api/auth/session:
 *   get:
 *     summary: Get current session
 *     tags: [Authentication]
 *     description: Returns information about the current user session
 *     responses:
 *       200:
 *         description: Session information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     image:
 *                       type: string
 *                 expires:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: No active session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: null
 */

// Clerk handles authentication - this is just for API documentation
export { GET, POST } from '@clerk/nextjs/app-beta'; 