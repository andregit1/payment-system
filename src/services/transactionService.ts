import { prisma } from '../app';
import { TransactionStatus } from '@prisma/client';

export async function processTransaction(transaction: any, timeout: number): Promise<any> {
	return new Promise((resolve, reject) => {
		if (!transaction || !transaction.type || !transaction.senderAccountId) {
			return reject(new Error('Invalid transaction or missing sender account'));
		}

		const message = (state: string) => `Transaction ${state} for: ${transaction.type} - senderAccountId: ${transaction.senderAccountId}${transaction.recipientAccountId ? ` to recipientAccountId: ${transaction.recipientAccountId}` : ''}`;

		console.log(message('started'));

		setTimeout(() => {
			console.log(message('completed'));
			resolve({ message: message('completed') });
		}, timeout);
	});
}

export async function transactionUpdateStatus(id: number, status: TransactionStatus) {
	await prisma.transaction.update({
		where: { id },
		data: { status }
	});
}
