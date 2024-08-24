import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { customErrorHandler } from '../utils/errorHandler';
import { verifyAccount } from '../services/accountService';
import { transactionUpdateStatus, processTransaction } from '../services/transactionService';

const transactionTimeout = parseInt(process.env.TRANSACTION_TIMEOUT_MS || '30000');

export async function sendTransactionHandler(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);

	const { amount, remarks, senderAccountId, recipientAccountId } = request.body as {
		amount: number;
		remarks?: string;
		senderAccountId: number;
		recipientAccountId: number;
	};

	try {
		const senderAccount = await verifyAccount(senderAccountId, amount);
		const recipientAccount = await verifyAccount(recipientAccountId, amount);
		// Create the debit transaction for the sender
		const transaction = await prisma.transaction.create({
			data: {
				amount: -amount,
				currency: 'SGD',
				remarks,
				senderAccountId,
				recipientAccountId,
				status: TransactionStatus.PROCESSING,
				transactionType: TransactionType.TRANSFER
			}
		});

		// Process the transaction
		await processTransaction(transaction, transactionTimeout)
			.then(async () => {
				// Update the transaction to 'COMPLETED'
				await transactionUpdateStatus(transaction.id, TransactionStatus.COMPLETED);

				// Adjust balances based on account types
				await prisma.paymentAccount.update({
					where: { id: senderAccountId },
					data: { balance: { decrement: amount } }
				});

				if (recipientAccount.accountType !== 'DEBIT') {
					await prisma.paymentAccount.update({
						where: { id: recipientAccountId },
						data: { balance: { decrement: amount } }
					});
				} else {
					await prisma.paymentAccount.update({
						where: { id: recipientAccountId },
						data: { balance: { increment: amount } }
					});
				}
			})
			.catch(async () => {
				// Handle transaction failure
				await transactionUpdateStatus(transaction.id, TransactionStatus.FAILED);
			});

		return reply.send({
			message: `Transaction from account ${senderAccount.accountNumber} to ${recipientAccount?.accountNumber}`,
			transactionId: transaction.id
		});
	} catch (error) {
		customErrorHandler(reply, error, 'Transaction initiation failed');
	}
}

export async function withdrawTransactionHandler(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);

	const { amount, senderAccountId } = request.body as {
		amount: number;
		senderAccountId: number;
	};

	try {
		const senderAccount = await verifyAccount(senderAccountId, amount);

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
				status: TransactionStatus.PROCESSING,
				transactionType: TransactionType.WITHDRAWAL
			}
		});

		processTransaction(transaction, transactionTimeout)
			.then(async () => {
				await transactionUpdateStatus(transaction.id, TransactionStatus.COMPLETED);

				// Adjust balance for DEBIT
				await prisma.paymentAccount.update({
					where: { id: senderAccountId },
					data: { balance: { decrement: amount } }
				});
			})
			.catch(async () => {
				await transactionUpdateStatus(transaction.id, TransactionStatus.FAILED);
			});

		return reply.send({
			message: `Withdrawal for account ${senderAccount.accountNumber}`,
			transactionId: transaction.id
		});
	} catch (error) {
		customErrorHandler(reply, error, 'Withdrawal initiation failed');
	}
}
