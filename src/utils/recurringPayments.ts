import { prisma } from '../app'; // Ensure the PrismaClient instance is correctly imported

export async function processRecurringPayments() {
	const duePayments = await prisma.recurringPayment.findMany({
		where: {
			nextPaymentDate: {
				lte: new Date()
			}
		}
	});

	for (const payment of duePayments) {
		const transaction = await prisma.transaction.create({
			data: {
				senderAccountId: payment.senderAccountId,
				recipientAccountId: payment.recipientAccountId,
				amount: payment.amount,
				currency: payment.currency,
				status: 'PROCESSING',
				toAddress: '', // Add the appropriate value if required
				timestamp: new Date()
			}
		});

		try {
			await processTransaction(transaction);
			await prisma.transaction.update({
				where: { id: transaction.id },
				data: { status: 'COMPLETED' }
			});
			await prisma.paymentAccount.update({
				where: { id: payment.senderAccountId },
				data: { balance: { decrement: payment.amount } }
			});
			await prisma.paymentAccount.update({
				where: { id: payment.recipientAccountId },
				data: { balance: { increment: payment.amount } }
			});
			await prisma.recurringPayment.update({
				where: { id: payment.id },
				data: {
					nextPaymentDate: new Date(new Date().getTime() + getIntervalMs(payment.interval))
				}
			});
		} catch (error) {
			await prisma.transaction.update({
				where: { id: transaction.id },
				data: { status: 'FAILED' }
			});
		}
	}
}

function getIntervalMs(interval: string): number {
	const [value, unit] = [parseInt(interval.slice(0, -1)), interval.slice(-1)];

	switch (unit) {
		case 'd': // days
			return value * 24 * 60 * 60 * 1000;
		case 'w': // weeks
			return value * 7 * 24 * 60 * 60 * 1000;
		case 'm': // months (approximation)
			return value * 30 * 24 * 60 * 60 * 1000;
		case 'y': // years (approximation)
			return value * 365 * 24 * 60 * 60 * 1000;
		default:
			return 0;
	}
}

async function processTransaction(transaction: any): Promise<any> {
	return new Promise((resolve, reject) => {
		console.log('Transaction processing started for:', transaction);
		setTimeout(() => {
			console.log('Transaction processed for:', transaction);
			resolve(transaction);
		}, 30000); // Simulate processing time
	});
}
