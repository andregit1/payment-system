import { FastifyInstance } from 'fastify';
import { superTokensMiddleware } from '../middleware';
import { createRecurringPayment, updateRecurringPayment } from '../handlers/recurringPayment';

export default async function (fastify: FastifyInstance) {
	// Route for creating a recurring payment
	fastify.post(
		'/recurring-payments',
		{
			schema: {
				description: 'Create a new recurring payment',
				tags: ['recurring payments'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['recipientAccountId', 'amount', 'currency', 'interval', 'nextPaymentDate'],
					properties: {
						senderAccountId: { type: 'integer' },
						recipientAccountId: { type: 'integer' },
						amount: { type: 'number', minimum: 1 },
						currency: { type: 'string', enum: ['USD', 'EUR', 'SGD'] },
						interval: { type: 'string', default: '1w' },
						nextPaymentDate: { type: 'string', format: 'date-time' },
						status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }
					}
				},
				response: {
					201: {
						description: 'Recurring payment created',
						type: 'object',
						properties: {
							message: { type: 'string' },
							recurringPayment: {
								type: 'object',
								properties: {
									id: { type: 'integer' },
									senderAccountId: { type: 'integer' },
									recipientAccountId: { type: 'integer' },
									amount: { type: 'number' },
									currency: { type: 'string' },
									interval: { type: 'string' },
									nextPaymentDate: { type: 'string', format: 'date-time' },
									status: { type: 'string' },
									createdAt: { type: 'string', format: 'date-time' },
									updatedAt: { type: 'string', format: 'date-time' }
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
			},
			preHandler: [superTokensMiddleware]
		},
		createRecurringPayment
	);

	// Route for updating a recurring payment
	fastify.put(
		'/recurring-payments/:id',
		{
			schema: {
				description: 'Update a recurring payment',
				tags: ['recurring payments'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['recipientAccountId', 'amount', 'currency', 'interval', 'nextPaymentDate'],
					properties: {
						senderAccountId: { type: 'integer' },
						recipientAccountId: { type: 'integer' },
						amount: { type: 'number', minimum: 1 },
						currency: { type: 'string', enum: ['USD', 'EUR', 'SGD'] },
						interval: { type: 'string', default: '1w' },
						nextPaymentDate: { type: 'string', format: 'date-time' },
						status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }
					}
				},
				params: {
					type: 'object',
					properties: {
						id: { type: 'integer' }
					},
					required: ['id']
				},
				response: {
					200: {
						description: 'Recurring payment updated',
						type: 'object',
						properties: {
							message: { type: 'string' },
							recurringPayment: {
								type: 'object',
								properties: {
									id: { type: 'integer' },
									senderAccountId: { type: 'integer' },
									recipientAccountId: { type: 'integer' },
									amount: { type: 'number' },
									currency: { type: 'string' },
									interval: { type: 'string' },
									nextPaymentDate: { type: 'string', format: 'date-time' },
									status: { type: 'string' },
									createdAt: { type: 'string', format: 'date-time' },
									updatedAt: { type: 'string', format: 'date-time' }
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
			},
			preHandler: [superTokensMiddleware]
		},
		updateRecurringPayment
	);
}
