import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../app';

export async function verifyAccount(accountId: number, amount: number | Decimal) {
	const account = await prisma.paymentAccount.findUnique({
		where: { id: accountId }
	});

	if (!account) {
		throw new Error('Account not found');
	}

	// Ensure amount is of type Decimal for comparison
	const amountDecimal = new Decimal(amount);

	// Compare account balance with the provided amount
	if (account.balance.lessThan(amountDecimal)) {
		throw new Error('Insufficient balance');
	}

	return account;
}
