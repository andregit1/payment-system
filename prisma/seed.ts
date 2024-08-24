import { PrismaClient } from '@prisma/client';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import supertokens from 'supertokens-node';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
	await prisma.recurringPayment.deleteMany();
	await prisma.transaction.deleteMany();
	await prisma.paymentAccount.deleteMany();
	await prisma.user.deleteMany();

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
	const userData = [
		{ email: 'user1@example.com', password: 'password1', username: 'user1' },
		{ email: 'user2@example.com', password: 'password2', username: 'user2' },
		{ email: 'user3@example.com', password: 'password3', username: 'user3' },
		{ email: 'user4@example.com', password: 'password4', username: 'user4' },
		{ email: 'user5@example.com', password: 'password5', username: 'user5' }
	];

	const users: Array<{
		id: number;
		username: string;
		email: string;
		createdAt: Date;
		updatedAt: Date;
		supertokensId: string;
		password: string;
	}> = [];

	for (const data of userData) {
		const supertokensResponse = await EmailPassword.signUp('public', data.email, data.password);
		if (supertokensResponse.status !== 'OK') {
			console.error(`Failed to sign up ${data.email}:`, supertokensResponse.status);
			continue;
		}

		const user = await prisma.user.create({
			data: {
				email: data.email,
				username: data.username,
				password: data.password,
				supertokensId: supertokensResponse.user.id
			}
		});

		users.push(user);
		console.log(`Created user ${user.email}`);
	}

	// Seed payment accounts
	const paymentAccounts = await prisma.paymentAccount.createMany({
		data: [
			{ userId: users[0].id, accountNumber: '1234567890', accountType: 'DEBIT', balance: new Decimal(1000.0), currency: 'USD' },
			{ userId: users[1].id, accountNumber: '2345678901', accountType: 'CREDIT', balance: new Decimal(5000.0), currency: 'USD' },
			{ userId: users[2].id, accountNumber: '3456789012', accountType: 'LOAN', balance: new Decimal(-3000.0), currency: 'USD' },
			{ userId: users[3].id, accountNumber: '4567890123', accountType: 'DEBIT', balance: new Decimal(2000.0), currency: 'USD' },
			{ userId: users[4].id, accountNumber: '5678901234', accountType: 'CREDIT', balance: new Decimal(7000.0), currency: 'USD' }
		]
	});

	console.log(`Created ${paymentAccounts.count} payment accounts`);

	// Seed transactions
	const transactions = await prisma.transaction.createMany({
		data: [
			{ senderAccountId: 1, recipientAccountId: 2, amount: new Decimal(150.0), currency: 'USD', status: 'COMPLETED', transactionType: 'TRANSFER' },
			{ senderAccountId: 2, recipientAccountId: 3, amount: new Decimal(200.0), currency: 'USD', status: 'COMPLETED', transactionType: 'TRANSFER' },
			{ senderAccountId: 3, recipientAccountId: 4, amount: new Decimal(250.0), currency: 'USD', status: 'PROCESSING', transactionType: 'TRANSFER' },
			{ senderAccountId: 4, recipientAccountId: 5, amount: new Decimal(300.0), currency: 'USD', status: 'COMPLETED', transactionType: 'TRANSFER' },
			{ senderAccountId: 5, recipientAccountId: 1, amount: new Decimal(100.0), currency: 'USD', status: 'FAILED', transactionType: 'TRANSFER' }
		]
	});

	console.log(`Created ${transactions.count} transactions`);

	// Seed recurring payments
	const recurringPayments = await prisma.recurringPayment.createMany({
		data: [
			{ senderAccountId: 1, recipientAccountId: 2, amount: new Decimal(50.0), currency: 'USD', intervalValue: '1', intervalUnit: 'MONTH', nextPaymentDate: new Date(), status: 'ACTIVE' },
			{ senderAccountId: 2, recipientAccountId: 3, amount: new Decimal(75.0), currency: 'USD', intervalValue: '1', intervalUnit: 'WEEK', nextPaymentDate: new Date(), status: 'ACTIVE' },
			{ senderAccountId: 3, recipientAccountId: 4, amount: new Decimal(100.0), currency: 'USD', intervalValue: '2', intervalUnit: 'MONTH', nextPaymentDate: new Date(), status: 'PAUSED' },
			{ senderAccountId: 4, recipientAccountId: 5, amount: new Decimal(125.0), currency: 'USD', intervalValue: '2', intervalUnit: 'WEEK', nextPaymentDate: new Date(), status: 'ACTIVE' },
			{ senderAccountId: 5, recipientAccountId: 1, amount: new Decimal(150.0), currency: 'USD', intervalValue: '1', intervalUnit: 'YEAR', nextPaymentDate: new Date(), status: 'PAUSED' }
		]
	});

	console.log(`Created ${recurringPayments.count} recurring payments`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
