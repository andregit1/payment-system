import cron from 'node-cron';
import { processRecurringPayments } from './recurringPayments';

export function processRecurringPaymentsTask(cronExpression: string) {
	cron.schedule(cronExpression, () => {
		console.log('Processing recurring payments');
		processRecurringPayments();
		console.log('Cron job executed at:', new Date().toLocaleString());
	});
}
