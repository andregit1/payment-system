import { FastifyInstance } from 'fastify';
import { signinHandler, signoutHandler, signupHandler } from '../handlers/auth';
import { superTokensMiddleware } from '../middleware';

export default async function (fastify: FastifyInstance) {
	fastify.post(
		'/auth/signup',
		{
			schema: {
				description: 'Sign up a new user',
				tags: ['authentication'],
				body: {
					type: 'object',
					required: ['email', 'password', 'username'], // Added username
					properties: {
						username: { type: 'string', default: 'userexmaple1' },
						email: { type: 'string', format: 'email' },
						password: { type: 'string', minLength: 8, default: '123123123' }
					}
				},
				response: {
					200: {
						description: 'Successful response',
						type: 'object',
						properties: {
							message: { type: 'string' },
							user: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									email: { type: 'string' },
									username: { type: 'string' }
								}
							}
						}
					},
					400: {
						description: 'Bad request',
						type: 'object',
						properties: {
							message: { type: 'string' }
						}
					}
				}
			}
		},
		signupHandler
	);

	fastify.post(
		'/auth/signin',
		{
			schema: {
				description: 'Sign in a user',
				tags: ['authentication'],
				body: {
					type: 'object',
					required: ['email', 'password'],
					properties: {
						email: { type: 'string', format: 'email' },
						password: { type: 'string', default: '123123123' }
					}
				},
				response: {
					200: {
						description: 'Successful response',
						type: 'object',
						properties: {
							message: { type: 'string' }
						}
					},
					400: {
						description: 'Bad request',
						type: 'object',
						properties: {
							message: { type: 'string' }
						}
					}
				}
			}
		},
		signinHandler
	);

	fastify.post(
		'/auth/signout',
		{
			schema: {
				description: 'Sign out the current user',
				tags: ['authentication'],
				security: [{ bearerAuth: [] }],
				response: {
					200: {
						description: 'Successful response',
						type: 'object',
						properties: {
							message: { type: 'string' }
						}
					},
					401: {
						description: 'Unauthorized',
						type: 'object',
						properties: {
							message: { type: 'string' }
						}
					}
				}
			},
			preHandler: [superTokensMiddleware]
		},
		signoutHandler
	);
}
