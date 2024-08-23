import { FastifyReply, FastifyRequest } from 'fastify';
import { SessionRequest } from 'supertokens-node/framework/fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';
import { PaymentAccountType } from '@prisma/client';
import { customErrorHandler } from '../utils/errorHandler';

export async function getAccountsHandler(request: SessionRequest, reply: FastifyReply) {
	try {
		const user = await authenticateUser(request, reply);
		const accounts = await prisma.paymentAccount.findMany({
			where: { userId: user.id },
			include: {
				transactionsSent: true,
				transactionsReceived: true
			}
		});
		return reply.send(accounts);
	} catch (error) {
		customErrorHandler(reply, error, 'Failed to retrieve accounts');
	}
}

export async function createAccountHandler(request: SessionRequest, reply: FastifyReply) {
	try {
		const user = await authenticateUser(request, reply);
		const { accountType, initialBalance, currency, accountNumber } = request.body as {
			accountType: PaymentAccountType;
			initialBalance: number;
			currency: string;
			accountNumber: string;
		};

		// Validate account type using the enum
		if (!Object.values(PaymentAccountType).includes(accountType.toUpperCase() as PaymentAccountType)) {
			return reply.status(400).send({ error: 'Invalid account type' });
		}

		if (initialBalance < 10) {
			return reply.status(400).send({ error: 'Initial balance must be at least 10' });
		}

		if (accountNumber.length < 10) {
			return reply.status(400).send({ error: 'Account number must be at least 10 digits long' });
		}

		const account = await prisma.paymentAccount.create({
			data: {
				accountType,
				balance: initialBalance,
				currency,
				accountNumber,
				userId: user.id
			}
		});

		return reply.send(account);
	} catch (error) {
		customErrorHandler(reply, error, 'Failed to create account');
	}
}

export async function getTransactionsHandler(request: any, reply: FastifyReply) {
	try {
		const user = await authenticateUser(request as SessionRequest, reply);
		const accountId = Number(request.params.id);
		const transactions = await prisma.transaction.findMany({
			where: {
				OR: [{ senderAccountId: accountId }, { recipientAccountId: accountId }],
				AND: [
					{
						OR: [{ senderAccount: { userId: user.id } }, { recipientAccount: { userId: user.id } }]
					}
				]
			},
			include: {
				senderAccount: true,
				recipientAccount: true
			}
		});
		return reply.send(transactions);
	} catch (error) {
		customErrorHandler(reply, error, 'Failed to retrieve transactions');
	}
}
