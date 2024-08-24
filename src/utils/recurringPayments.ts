import { prisma } from '../app';
import { TransactionStatus, DurationUnit, RecurringPaymentStatus, TransactionType, PaymentAccountType } from '@prisma/client';
import { processTransaction } from '../services/transactionService';
import { verifyAccount } from '../services/accountService';

const recurringPaymentTimeout = parseInt(process.env.RECURRING_PAYMENT_TIMEOUT_MS || '30000');

function getIntervalMs(value: string, unit: DurationUnit): number {
	switch (unit) {
		case DurationUnit.DAY:
			return parseInt(value) * 24 * 60 * 60 * 1000;
		case DurationUnit.WEEK:
			return parseInt(value) * 7 * 24 * 60 * 60 * 1000;
		case DurationUnit.MONTH:
			return parseInt(value) * 30 * 24 * 60 * 60 * 1000; // Approximation
		case DurationUnit.YEAR:
			return parseInt(value) * 365 * 24 * 60 * 60 * 1000; // Approximation
		default:
			throw new Error('Invalid duration unit');
	}
}

export async function processRecurringPayments() {
	const duePayments = await prisma.recurringPayment.findMany({
		where: {
			nextPaymentDate: {
				lte: new Date()
			},
			status: RecurringPaymentStatus.ACTIVE
		}
	});

	for (const payment of duePayments) {
		try {
			// Verify sender account and ensure sufficient balance
			await verifyAccount(payment.senderAccountId, payment.amount);

			// Create a new transaction
			const transaction = await prisma.transaction.create({
				data: {
					senderAccountId: payment.senderAccountId,
					recipientAccountId: payment.recipientAccountId,
					amount: payment.amount,
					currency: payment.currency,
					type: TransactionType.PAYMENT,
					status: TransactionStatus.PROCESSING,
					remarks: 'RECURRING PAYMENT',
					timestamp: new Date()
				}
			});

			// Process the transaction
			await processTransaction(transaction, recurringPaymentTimeout);

			// Update transaction status to COMPLETED
			await prisma.transaction.update({
				where: { id: transaction.id },
				data: { status: TransactionStatus.COMPLETED }
			});

			// Update sender account balance
			await prisma.paymentAccount.update({
				where: { id: payment.senderAccountId },
				data: { balance: { decrement: payment.amount } }
			});

			// Ensure recipient account is not of type DEBIT and update its balance
			const recipientAccount = await prisma.paymentAccount.update({
				where: {
					id: payment.recipientAccountId,
					accountType: { not: PaymentAccountType.DEBIT }
				},
				data: { balance: { increment: payment.amount } }
			});

			// Determine the next status of the recurring payment
			let nextStatus = RecurringPaymentStatus.ACTIVE;

			if (recipientAccount.balance.isZero()) {
				if (recipientAccount.endDate && recipientAccount.endDate > new Date()) {
					nextStatus = RecurringPaymentStatus.PAUSED;
				} else {
					nextStatus = RecurringPaymentStatus.COMPLETED;
				}
			}

			// Calculate the next payment date
			const nextPaymentDate = new Date(new Date().getTime() + getIntervalMs(payment.intervalValue, payment.intervalUnit));

			// Update the recurring payment status and next payment date
			await prisma.recurringPayment.update({
				where: { id: payment.id },
				data: {
					nextPaymentDate,
					status: nextStatus,
					updatedAt: new Date()
				}
			});
		} catch (error) {
			// Handle errors during processing
			await prisma.recurringPayment.update({
				where: { id: payment.id },
				data: { status: RecurringPaymentStatus.PAUSED }
			});
		}
	}
}
