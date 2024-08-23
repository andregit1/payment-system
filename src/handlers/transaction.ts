import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';
import { TransactionStatus } from '@prisma/client';

const transactionTimeout = parseInt(process.env.TRANSACTION_TIMEOUT_MS || '30000');

async function verifySenderAccount(senderAccountId: number, amount: number) {
	const senderAccount = await prisma.paymentAccount.findUnique({
		where: { id: senderAccountId }
	});

	if (!senderAccount) {
		throw new Error('Sender account not found');
	}

	if (senderAccount.balance.lessThan(amount)) {
		throw new Error('Insufficient balance');
	}

	return senderAccount;
}

async function processTransaction(senderAccount: any, recipientAccount: any | null, transactionType: 'send' | 'withdraw'): Promise<any> {
	return new Promise((resolve, reject) => {
		if (transactionType === 'send' && recipientAccount) {
			console.log(`Transaction processing started for: senderAccountId - ${senderAccount.id} to recipientAccountId - ${recipientAccount.id}`);

			setTimeout(() => {
				console.log(`Transaction processed for: senderAccountId - ${senderAccount.id} to recipientAccountId - ${recipientAccount.id}`);
				resolve({ message: 'Transaction completed' });
			}, transactionTimeout);
		} else if (transactionType === 'withdraw') {
			console.log(`Withdrawal processing started for: ${senderAccount.id}`);

			setTimeout(() => {
				console.log(`Withdrawal processed for: ${senderAccount.id}`);
				resolve({ message: 'Withdrawal completed' });
			}, transactionTimeout);
		} else {
			reject(new Error('Invalid transaction type or missing recipient account'));
		}
	});
}

export async function sendTransactionHandler(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);

	const { amount, remarks, senderAccountId, recipientAccountId } = request.body as {
		amount: number;
		remarks: string;
		senderAccountId: number;
		recipientAccountId: number;
	};

	try {
		await verifySenderAccount(senderAccountId, amount);

		// Create the debit transaction for the sender
		const senderTransaction = await prisma.transaction.create({
			data: {
				amount: -amount, // Debit
				currency: 'SGD',
				remarks,
				senderAccountId,
				recipientAccountId,
				status: TransactionStatus.PROCESSING
			}
		});

		// Create the credit transaction for the recipient
		const recipientTransaction = await prisma.transaction.create({
			data: {
				amount: amount, // Credit
				currency: 'SGD',
				remarks,
				senderAccountId,
				recipientAccountId,
				status: TransactionStatus.PROCESSING
			}
		});

		processTransaction(senderTransaction, recipientTransaction, 'send')
			.then(async () => {
				// Update both transactions to 'COMPLETED'
				await prisma.transaction.updateMany({
					where: { id: { in: [senderTransaction.id, recipientTransaction.id] } },
					data: { status: TransactionStatus.COMPLETED }
				});

				// Adjust balances
				await prisma.paymentAccount.update({
					where: { id: senderAccountId },
					data: { balance: { decrement: amount } }
				});

				await prisma.paymentAccount.update({
					where: { id: recipientAccountId },
					data: { balance: { increment: amount } }
				});
			})
			.catch(async () => {
				await prisma.transaction.updateMany({
					where: { id: { in: [senderTransaction.id, recipientTransaction.id] } },
					data: { status: TransactionStatus.FAILED }
				});
			});

		return reply.send({ message: 'Transaction initiated', transactionId: senderTransaction.id });
	} catch (error) {
		return reply.status(400).send({ message: 'Transaction initiation failed' });
	}
}

export async function withdrawTransactionHandler(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);

	const { amount, senderAccountId } = request.body as {
		amount: number;
		senderAccountId: number;
	};

	try {
		const senderAccount = await verifySenderAccount(senderAccountId, amount);

		if (senderAccount.accountType !== 'DEBIT') {
			return reply.status(400).send({ message: 'Account type must be DEBIT for withdrawal' });
		}

		// Create the withdrawal transaction
		const transaction = await prisma.transaction.create({
			data: {
				amount: -amount, // Debit
				currency: 'SGD',
				remarks: 'WITHDRAWAL',
				senderAccountId: senderAccount.id,
				recipientAccountId: null, // No recipient
				status: TransactionStatus.PROCESSING
			}
		});

		processTransaction(senderAccount, null, 'withdraw')
			.then(async () => {
				await prisma.transaction.update({
					where: { id: transaction.id },
					data: { status: TransactionStatus.COMPLETED }
				});

				// Adjust balance
				await prisma.paymentAccount.update({
					where: { id: senderAccountId },
					data: { balance: { decrement: amount } }
				});
			})
			.catch(async () => {
				await prisma.transaction.update({
					where: { id: transaction.id },
					data: { status: TransactionStatus.FAILED }
				});
			});

		return reply.send({ message: 'Withdrawal initiated', transactionId: transaction.id });
	} catch (error) {
		return reply.status(400).send({ message: 'Withdrawal initiation failed' });
	}
}
