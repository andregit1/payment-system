import { PrismaClient } from '@prisma/client';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import supertokens from 'supertokens-node';

const prisma = new PrismaClient();

async function main() {
	await prisma.user.deleteMany();
	await prisma.paymentAccount.deleteMany();
	await prisma.transaction.deleteMany();
	await prisma.paymentHistory.deleteMany();
	await prisma.recurringPayment.deleteMany();

	// SuperTokens initialization
	supertokens.init({
		framework: 'fastify',
		supertokens: {
			connectionURI: 'http://supertokens:3567' // with docker-compose
		},
		appInfo: {
			appName: 'Payment System',
			apiDomain: 'http://localhost:3001',
			websiteDomain: 'http://localhost:3000',
			apiBasePath: '/auth',
			websiteBasePath: '/auth'
		},
		recipeList: [EmailPassword.init(), Session.init()]
	});

	// Seed users
	const user1Data = { email: 'user1@example.com', password: 'password1', username: 'user1' };
	const user2Data = { email: 'user2@example.com', password: 'password2', username: 'user2' };
	const user3Data = { email: 'user3@example.com', password: 'password3', username: 'user3' };
	const user4Data = { email: 'user4@example.com', password: 'password4', username: 'user4' };
	const user5Data = { email: 'user5@example.com', password: 'password5', username: 'user5' };

	const usersData = [user1Data, user2Data, user3Data, user4Data, user5Data];

	for (const userData of usersData) {
		const supertokensResponse = await EmailPassword.signUp('public', userData.email, userData.password);

		if (supertokensResponse.status !== 'OK') {
			console.error(`Failed to sign up ${userData.email}:`, supertokensResponse.status);
			continue;
		}

		const user = await prisma.user.create({
			data: {
				email: userData.email,
				username: userData.username,
				password: userData.password,
				supertokensId: supertokensResponse.user.id
			}
		});

		console.log(`Created user ${user.email}`);
	}

	// Seed additional data
	const paymentAccounts = await prisma.paymentAccount.createMany({
		data: [
			{ userId: 1, accountNumber: '1234567890', accountType: 'debit', balance: 1000.0, currency: 'USD' },
			{ userId: 2, accountNumber: '2345678901', accountType: 'credit', balance: 5000.0, currency: 'USD' },
			{ userId: 3, accountNumber: '3456789012', accountType: 'loan', balance: -3000.0, currency: 'USD' },
			{ userId: 4, accountNumber: '4567890123', accountType: 'debit', balance: 2000.0, currency: 'USD' },
			{ userId: 5, accountNumber: '5678901234', accountType: 'credit', balance: 7000.0, currency: 'USD' }
		]
	});

	console.log(`Created ${paymentAccounts.count} payment accounts`);

	const transactions = await prisma.transaction.createMany({
		data: [
			{ senderAccountId: 1, recipientAccountId: 2, amount: 150.0, currency: 'USD', status: 'completed' },
			{ senderAccountId: 2, recipientAccountId: 3, amount: 200.0, currency: 'USD', status: 'completed' },
			{ senderAccountId: 3, recipientAccountId: 4, amount: 250.0, currency: 'USD', status: 'pending' },
			{ senderAccountId: 4, recipientAccountId: 5, amount: 300.0, currency: 'USD', status: 'completed' },
			{ senderAccountId: 5, recipientAccountId: 1, amount: 100.0, currency: 'USD', status: 'failed' }
		]
	});

	console.log(`Created ${transactions.count} transactions`);

	const recurringPayments = await prisma.recurringPayment.createMany({
		data: [
			{ senderAccountId: 1, recipientAccountId: 2, amount: 50.0, currency: 'USD', interval: '1m', nextPaymentDate: new Date(), status: 'active' },
			{ senderAccountId: 2, recipientAccountId: 3, amount: 75.0, currency: 'USD', interval: '1w', nextPaymentDate: new Date(), status: 'active' },
			{ senderAccountId: 3, recipientAccountId: 4, amount: 100.0, currency: 'USD', interval: '2m', nextPaymentDate: new Date(), status: 'inactive' },
			{ senderAccountId: 4, recipientAccountId: 5, amount: 125.0, currency: 'USD', interval: '2w', nextPaymentDate: new Date(), status: 'active' },
			{ senderAccountId: 5, recipientAccountId: 1, amount: 150.0, currency: 'USD', interval: '1y', nextPaymentDate: new Date(), status: 'inactive' }
		]
	});

	console.log(`Created ${recurringPayments.count} recurring payments`);

	const paymentHistories = await prisma.paymentHistory.createMany({
		data: [
			{ paymentAccountId: 1, transactionId: 1, amount: 150.0 },
			{ paymentAccountId: 2, transactionId: 2, amount: 200.0 },
			{ paymentAccountId: 3, transactionId: 3, amount: 250.0 },
			{ paymentAccountId: 4, transactionId: 4, amount: 300.0 },
			{ paymentAccountId: 5, transactionId: 5, amount: 100.0 }
		]
	});

	console.log(`Created ${paymentHistories.count} payment histories`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
