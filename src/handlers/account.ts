import { FastifyReply, FastifyRequest } from 'fastify';
import { SessionRequest } from 'supertokens-node/framework/fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';

// Custom error for unauthorized access
class UnauthorizedError extends Error {
	constructor(message = 'Unauthorized') {
		super(message);
		this.name = 'UnauthorizedError';
	}
}

// Error handler
function handleErrors(reply: FastifyReply, error: any) {
	console.error('Error:', error);
	if (error instanceof UnauthorizedError) {
		return reply.status(401).send({ message: error.message });
	}
	return reply.status(500).send({ message: 'Internal Server Error' });
}

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
		handleErrors(reply, error);
	}
}

export async function createAccountHandler(request: SessionRequest, reply: FastifyReply) {
	try {
		const user = await authenticateUser(request, reply);
		const { accountType, initialBalance, currency, accountNumber } = request.body as {
			accountType: string;
			initialBalance: number;
			currency: string;
			accountNumber: string;
		};

		if (!['debit', 'credit', 'loan'].includes(accountType)) {
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
		handleErrors(reply, error);
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
		handleErrors(reply, error);
	}
}
