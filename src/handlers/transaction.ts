import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';
import { createPaymentHistories } from './paymentHistory';

function processTransaction(transaction: any): Promise<any> {
	return new Promise((resolve, reject) => {
		console.log('Transaction processing started for:', transaction);
		setTimeout(() => {
			console.log('Transaction processed for:', transaction);
			resolve(transaction);
		}, 30000);
	});
}

export async function sendTransactionHandler(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);
	const { amount, currency, toAddress, senderAccountId, recipientAccountId } = request.body as {
		amount: number;
		currency: string;
		toAddress: string;
		senderAccountId: number;
		recipientAccountId: number;
	};

	try {
		const transaction = await prisma.transaction.create({
			data: {
				amount,
				currency,
				toAddress,
				senderAccountId,
				recipientAccountId,
				status: 'PROCESSING'
			}
		});

		processTransaction(transaction)
			.then(async (processedTransaction) => {
				await prisma.transaction.update({
					where: { id: transaction.id },
					data: { status: 'COMPLETED' }
				});

				// Deduct amount from sender's account
				await prisma.paymentAccount.update({
					where: { id: senderAccountId },
					data: { balance: { decrement: amount } }
				});

				// Add amount to recipient's account
				await prisma.paymentAccount.update({
					where: { id: recipientAccountId },
					data: { balance: { increment: amount } }
				});

				// create paymentHistory records
				await createPaymentHistories(senderAccountId, recipientAccountId, transaction.id, amount);
			})
			.catch(async (error) => {
				await prisma.transaction.update({
					where: { id: transaction.id },
					data: { status: 'FAILED' }
				});
			});

		return reply.send({ message: 'Transaction initiated', transactionId: transaction.id });
	} catch (error) {
		return reply.status(400).send({ message: 'Transaction initiation failed' });
	}
}

export async function withdrawTransactionHandler(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);
	const { amount, currency, senderAccountId, recipientAccountId } = request.body as {
		amount: number;
		currency: string;
		senderAccountId: number;
		recipientAccountId: number;
	};

	try {
		// Ensure the sender account exists
		const senderAccount = await prisma.paymentAccount.findUnique({
			where: { id: senderAccountId }
		});

		if (!senderAccount) {
			return reply.status(400).send({ message: 'Sender account not found' });
		}

		// Create the withdrawal transaction
		const transaction = await prisma.transaction.create({
			data: {
				amount,
				currency,
				toAddress: 'SELF',
				senderAccountId,
				recipientAccountId,
				status: 'PROCESSING'
			}
		});

		// Process the transaction
		processTransaction(transaction)
			.then(async (processedTransaction) => {
				await prisma.transaction.update({
					where: { id: transaction.id },
					data: { status: 'COMPLETED' }
				});

				await prisma.paymentAccount.update({
					where: { id: senderAccountId },
					data: { balance: { decrement: amount } }
				});

				// Add amount to recipient's account if it's different from the sender
				if (senderAccountId !== recipientAccountId) {
					await prisma.paymentAccount.update({
						where: { id: recipientAccountId },
						data: { balance: { increment: amount } }
					});
				}

				// create paymentHistory records
				await createPaymentHistories(senderAccountId, recipientAccountId, transaction.id, amount);
			})
			.catch(async (error) => {
				await prisma.transaction.update({
					where: { id: transaction.id },
					data: { status: 'FAILED' }
				});
			});

		return reply.send({ message: 'Withdrawal initiated', transactionId: transaction.id });
	} catch (error) {
		return reply.status(400).send({ message: 'Withdrawal initiation failed' });
	}
}
