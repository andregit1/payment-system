import { FastifyInstance } from 'fastify';
import { superTokensMiddleware } from '../middleware';
import { getAccountsHandler, createAccountHandler, getAccountHistoryHandler } from '../handlers/account';

export default async function (fastify: FastifyInstance) {
	fastify.get(
		'/accounts',
		{
			schema: {
				description: 'Get all accounts for the authenticated user',
				tags: ['accounts'],
				security: [{ bearerAuth: [] }],
				response: {
					200: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								accountType: { type: 'string' },
								balance: { type: 'number' },
								currency: { type: 'string' },
								accountNumber: { type: 'string' },
								userId: { type: 'string' },
								transactionsSent: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											recipientAccountId: { type: 'string' },
											amount: { type: 'number' },
											currency: { type: 'string' },
											timestamp: { type: 'string', format: 'date-time' },
											status: { type: 'string' },
											remarks: { type: 'string', nullable: true }
										}
									}
								},
								transactionsReceived: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											id: { type: 'string' },
											senderAccountId: { type: 'string' },
											amount: { type: 'number' },
											currency: { type: 'string' },
											timestamp: { type: 'string', format: 'date-time' },
											status: { type: 'string' },
											remarks: { type: 'string', nullable: true }
										}
									}
								}
							}
						}
					}
				}
			},
			preHandler: [superTokensMiddleware]
		},
		getAccountsHandler
	);

	fastify.post(
		'/accounts',
		{
			schema: {
				description: 'Create a new account for the authenticated user',
				tags: ['accounts'],
				security: [{ bearerAuth: [] }],
				body: {
					type: 'object',
					required: ['accountType', 'initialBalance', 'accountNumber'],
					properties: {
						accountType: {
							type: 'string',
							enum: ['DEBIT', 'CREDIT', 'LOAN']
						},
						accountNumber: {
							type: 'string',
							minLength: 10,
							default: '1234567890'
						},
						initialBalance: {
							type: 'number',
							minimum: 10
						},
						availableAmount: {
							type: 'number',
							minimum: 10
						},
						interestRate: {
							type: 'number', // Corrected the typo
							default: 2.5
						},
						startDate: { type: 'string', format: 'date-time' },
						endDate: { type: 'string', format: 'date-time', default: '2030-01-01T12:00:00.000Z' }
					}
				},
				response: {
					200: {
						type: 'object',
						properties: {
							id: { type: 'string' },
							accountType: { type: 'string' },
							balance: { type: 'number' },
							currency: { type: 'string' },
							accountNumber: { type: 'string' },
							userId: { type: 'string' }
						}
					}
				}
			},
			preHandler: [superTokensMiddleware]
		},
		createAccountHandler
	);

	fastify.get(
		'/accounts/:id/history',
		{
			schema: {
				description: 'Get all transaction history for a specific account',
				tags: ['accounts'],
				security: [{ bearerAuth: [] }],
				params: {
					type: 'object',
					properties: {
						id: { type: 'string' }
					},
					required: ['id']
				},
				response: {
					200: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								id: { type: 'string' },
								amount: { type: 'number' },
								type: { type: 'string' },
								senderAccountId: { type: 'string' },
								recipientAccountId: { type: 'string' },
								timestamp: { type: 'string', format: 'date-time' },
								status: { type: 'string' },
								senderAccount: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										accountType: { type: 'string' },
										accountNumber: { type: 'string' },
										balance: { type: 'number' },
										availableAmount: { type: 'number' },
										currency: { type: 'string' }
									}
								},
								recipientAccount: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										accountType: { type: 'string' },
										accountNumber: { type: 'string' },
										balance: { type: 'number' },
										availableAmount: { type: 'number' },
										currency: { type: 'string' }
									}
								}
							}
						}
					}
				}
			},
			preHandler: [superTokensMiddleware]
		},
		getAccountHistoryHandler
	);
}
