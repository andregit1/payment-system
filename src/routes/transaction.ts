import { FastifyInstance } from 'fastify';
import { superTokensMiddleware } from '../middleware';
import { sendTransactionHandler, withdrawTransactionHandler } from '../handlers/transaction';

export default async function (fastify: FastifyInstance) {
	// Send transaction route
	fastify.post(
		'/send',
		{
			preHandler: [superTokensMiddleware],
			schema: {
				description: 'Send transaction to an address',
				tags: ['transactions'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['amount', 'currency', 'toAddress', 'senderAccountId', 'recipientAccountId'],
					properties: {
						amount: { type: 'number', minimum: 1 },
						currency: { type: 'string', enum: ['USD', 'EUR', 'SGD'] },
						toAddress: { type: 'string' },
						senderAccountId: { type: 'number' },
						recipientAccountId: { type: 'number' }
					}
				},
				response: {
					200: {
						description: 'Transaction initiated successfully',
						type: 'object',
						properties: {
							message: { type: 'string' },
							transactionId: { type: 'number' }
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
		sendTransactionHandler
	);

	// Withdraw transaction route
	fastify.post(
		'/withdraw',
		{
			preHandler: [superTokensMiddleware],
			schema: {
				description: 'Withdraw funds from an account',
				tags: ['transactions'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['amount', 'currency', 'senderAccountId', 'recipientAccountId'],
					properties: {
						amount: { type: 'number', minimum: 1 },
						currency: { type: 'string', enum: ['USD', 'EUR', 'SGD'] },
						senderAccountId: { type: 'number' },
						recipientAccountId: { type: 'number' }
					}
				},
				response: {
					200: {
						description: 'Withdrawal initiated successfully',
						type: 'object',
						properties: {
							message: { type: 'string' },
							transactionId: { type: 'number' }
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
		withdrawTransactionHandler
	);
}
