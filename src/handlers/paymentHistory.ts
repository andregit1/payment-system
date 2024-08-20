import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';

export async function getPaymentHistory(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);

	const { paymentAccountId } = request.params as { paymentAccountId: number };

	try {
		const history = await prisma.paymentHistory.findMany({
			where: { paymentAccountId },
			include: {
				paymentAccount: {
					include: {
						transactionsReceived: true,
						transactionsSent: true,
						recurringPaymentsReceived: true,
						recurringPaymentsSent: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return reply.send(history);
	} catch (error) {
		return reply.status(400).send({ message: 'Failed to retrieve payment history' });
	}
}

export async function createPaymentHistories(senderAccountId: number, recipientAccountId: number, transactionId: number, amount: number) {
	try {
		await prisma.paymentHistory.createMany({
			data: [
				{
					paymentAccountId: senderAccountId,
					transactionId: transactionId,
					amount: -amount
				},
				{
					paymentAccountId: recipientAccountId,
					transactionId: transactionId,
					amount: amount
				}
			]
		});
	} catch (error) {
		console.error('Error creating payment histories:', error);
		throw error;
	}
}
