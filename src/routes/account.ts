import { FastifyInstance } from 'fastify';
import { superTokensMiddleware } from '../middleware';
import { getAccountsHandler, createAccountHandler, getTransactionsHandler } from '../handlers/account';

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
							enum: ['debit', 'credit', 'loan']
						},
						initialBalance: {
							type: 'number',
							minimum: 10
						},
						currency: { type: 'string', enum: ['USD', 'EUR', 'SGD'] },
						accountNumber: {
							type: 'string',
							minLength: 10,
							default: '1234567890'
						}
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
		'/accounts/:id/transactions',
		{
			schema: {
				description: 'Get all transactions for a specific account',
				tags: ['accounts'],
				security: [{ bearerAuth: [] }],
				params: {
					type: 'object',
					properties: {
						id: { type: 'string' }
					}
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
								senderAccount: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										accountType: { type: 'string' },
										balance: { type: 'number' },
										currency: { type: 'string' },
										accountNumber: { type: 'string' }
									}
								},
								recipientAccount: {
									type: 'object',
									properties: {
										id: { type: 'string' },
										accountType: { type: 'string' },
										balance: { type: 'number' },
										currency: { type: 'string' },
										accountNumber: { type: 'string' }
									}
								}
							}
						}
					}
				}
			},
			preHandler: [superTokensMiddleware]
		},
		getTransactionsHandler
	);
}
