import { FastifyInstance } from 'fastify';
import { superTokensMiddleware } from '../middleware';
import { getPaymentHistory } from '../handlers/paymentHistory';

export default async function (fastify: FastifyInstance) {
	// Route for retrieving payment history
	fastify.get(
		'/payment-history/:paymentAccountId',
		{
			schema: {
				description: 'Get payment history for a specific account',
				tags: ['payment history'],
				security: [{ bearerAuth: [] }],
				params: {
					type: 'object',
					properties: {
						paymentAccountId: { type: 'integer' }
					},
					required: ['paymentAccountId']
				},
				response: {
					200: {
						description: 'Payment history retrieved',
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: { type: 'integer' },
								paymentAccountId: { type: 'integer' },
								transactionId: { type: 'integer' },
								amount: { type: 'number' },
								createdAt: { type: 'string', format: 'date-time' },
								paymentAccount: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										accountType: { type: 'string' },
										balance: { type: 'number' },
										currency: { type: 'string' },
										accountNumber: { type: 'string' },
										userId: { type: 'string' },
										transactionsReceived: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													id: { type: 'integer' },
													senderAccountId: { type: 'integer' },
													recipientAccountId: { type: 'integer' },
													amount: { type: 'number' },
													currency: { type: 'string' },
													timestamp: { type: 'string', format: 'date-time' },
													status: { type: 'string' },
													toAddress: { type: 'string', nullable: true }
												}
											}
										},
										transactionsSent: {
											type: 'array',
											items: {
												type: 'object',
												properties: {
													id: { type: 'integer' },
													senderAccountId: { type: 'integer' },
													recipientAccountId: { type: 'integer' },
													amount: { type: 'number' },
													currency: { type: 'string' },
													timestamp: { type: 'string', format: 'date-time' },
													status: { type: 'string' },
													toAddress: { type: 'string', nullable: true }
												}
											}
										},
										recurringPaymentsReceived: {
											type: 'array',
											items: {
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
										},
										recurringPaymentsSent: {
											type: 'array',
											items: {
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
									}
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
		getPaymentHistory
	);
}
