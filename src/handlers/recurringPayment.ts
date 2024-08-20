import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../app';
import { authenticateUser } from '../middleware';

// Handler for creating a new recurring payment
export async function createRecurringPayment(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);

	const { senderAccountId, recipientAccountId, amount, currency, interval, nextPaymentDate, status } = request.body as {
		senderAccountId: number;
		recipientAccountId: number;
		amount: number;
		currency: string;
		interval: string;
		nextPaymentDate: string;
		status: string;
	};

	// Validate amount
	if (amount <= 0) {
		return reply.status(400).send({ message: 'Amount must be greater than 0' });
	}

	try {
		// Check if sender and recipient accounts exist
		const senderAccount = await prisma.paymentAccount.findUnique({ where: { id: senderAccountId } });
		const recipientAccount = await prisma.paymentAccount.findUnique({ where: { id: recipientAccountId } });

		if (!senderAccount) {
			return reply.status(404).send({ message: 'Sender account not found' });
		}

		if (!recipientAccount) {
			return reply.status(404).send({ message: 'Recipient account not found' });
		}

		// Create the recurring payment
		const recurringPayment = await prisma.recurringPayment.create({
			data: {
				senderAccountId,
				recipientAccountId,
				amount,
				currency,
				interval,
				nextPaymentDate: new Date(nextPaymentDate),
				status
			}
		});

		return reply.status(201).send({
			message: 'Recurring payment created successfully',
			recurringPayment
		});
	} catch (error) {
		console.error('Error creating recurring payment:', error);
		return reply.status(400).send({ message: 'Error creating recurring payment' });
	}
}

// Handler for updating a recurring payment
export async function updateRecurringPayment(request: FastifyRequest, reply: FastifyReply) {
	await authenticateUser(request, reply);

	const { id } = request.params as { id: number };
	const { senderAccountId, recipientAccountId, amount, currency, interval, nextPaymentDate, status } = request.body as {
		senderAccountId?: number;
		recipientAccountId?: number;
		amount?: number;
		currency?: string;
		interval?: string;
		nextPaymentDate?: string;
		status?: string;
	};

	if (amount !== undefined && amount <= 0) {
		return reply.status(400).send({ message: 'Amount must be greater than 0' });
	}

	try {
		// Check if the recurring payment exists
		const recurringPayment = await prisma.recurringPayment.findUnique({ where: { id } });
		if (!recurringPayment) {
			return reply.status(404).send({ message: 'Recurring payment not found' });
		}

		// Check if updated sender and recipient accounts exist
		if (senderAccountId) {
			const senderAccount = await prisma.paymentAccount.findUnique({ where: { id: senderAccountId } });
			if (!senderAccount) {
				return reply.status(404).send({ message: 'Sender account not found' });
			}
		}

		if (recipientAccountId) {
			const recipientAccount = await prisma.paymentAccount.findUnique({ where: { id: recipientAccountId } });
			if (!recipientAccount) {
				return reply.status(404).send({ message: 'Recipient account not found' });
			}
		}

		// Update the recurring payment
		const updatedRecurringPayment = await prisma.recurringPayment.update({
			where: { id },
			data: {
				senderAccountId,
				recipientAccountId,
				amount,
				currency,
				interval,
				nextPaymentDate: nextPaymentDate ? new Date(nextPaymentDate) : undefined,
				status
			}
		});

		return reply.send({
			message: 'Recurring payment updated successfully',
			recurringPayment: updatedRecurringPayment
		});
	} catch (error) {
		console.error('Error updating recurring payment:', error);
		return reply.status(400).send({ message: 'Error updating recurring payment' });
	}
}
