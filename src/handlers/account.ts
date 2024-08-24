import { FastifyReply, FastifyRequest } from 'fastify';
import { SessionRequest } from 'supertokens-node/framework/fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';
import { Prisma, PaymentAccountType } from '@prisma/client';
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

		const { accountType, accountNumber, initialBalance, availableAmount, interestRate, startDate, endDate } = request.body as {
			accountType: PaymentAccountType;
			accountNumber: string;
			initialBalance: number;
			availableAmount?: number; // for non-DEBIT accounts
			interestRate?: number; // for non-DEBIT accounts
			startDate?: Date;
			endDate?: Date;
		};

		// Convert accountType to uppercase to avoid case-sensitivity issues
		const normalizedAccountType = accountType.toUpperCase() as PaymentAccountType;

		// Validate account type using the enum
		if (!Object.values(PaymentAccountType).includes(normalizedAccountType)) {
			return reply.status(400).send({ error: 'Invalid account type' });
		}

		// Validate initial balance
		if (initialBalance < 10) {
			return reply.status(400).send({ error: 'Initial balance must be at least 10' });
		}

		// Validate account number length
		if (accountNumber.length < 10) {
			return reply.status(400).send({ error: 'Account number must be at least 10 digits long' });
		}

		const accountData: Prisma.PaymentAccountCreateInput = {
			accountType: normalizedAccountType,
			accountNumber,
			balance: new Prisma.Decimal(initialBalance),
			currency: 'SGD',
			user: { connect: { id: user.id } }
		};

		// Add interestRate if applicable
		if (normalizedAccountType !== 'DEBIT' && interestRate !== undefined) {
			accountData.interestRate = new Prisma.Decimal(interestRate);
		}

		// Add availableAmount, startDate, and endDate if applicable
		if (normalizedAccountType !== 'DEBIT' && availableAmount !== undefined) {
			accountData.availableAmount = new Prisma.Decimal(availableAmount);

			// Validate and set startDate and endDate
			if (startDate) {
				accountData.startDate = startDate;
			}

			if (endDate) {
				accountData.endDate = endDate;
			}
		}

		const account = await prisma.paymentAccount.create({
			data: accountData
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
