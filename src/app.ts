import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import formDataPlugin from '@fastify/formbody';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import autoload from '@fastify/autoload';
import { PrismaClient } from '@prisma/client';
import supertokens from 'supertokens-node';
import { plugin as supertokensPlugin } from 'supertokens-node/framework/fastify';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import { processRecurringPaymentsTask } from './utils/cronJob';
import { errorHandler } from './utils/errorHandler';
import { join } from 'path';

export const prisma = new PrismaClient();

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

const fastify = Fastify({ logger: true });

// CORS
fastify.register(cors, {
	origin: 'http://localhost:3001',
	allowedHeaders: ['Content-Type', ...supertokens.getAllCORSHeaders()],
	methods: ['GET', 'PUT', 'POST', 'DELETE'],
	credentials: true
});

// Swagger
fastify.register(fastifySwagger, {
	openapi: {
		info: {
			title: 'Payment System API',
			description: 'API documentation for the Payment System',
			version: '1.0.0'
		},
		servers: [
			{
				url: 'http://localhost:3001',
				description: 'Development server'
			}
		],
		tags: [
			{ name: 'authentication', description: 'Authentication related endpoints' },
			{ name: 'accounts', description: 'Account related endpoints' },
			{ name: 'transactions', description: 'Transaction related endpoints' }
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			}
		}
	}
});

fastify.register(fastifySwaggerUi, {
	routePrefix: '/documentation',
	uiConfig: {
		docExpansion: 'list',
		deepLinking: false
	},
	staticCSP: true
});

// Autoload routes
fastify.register(autoload, {
	dir: join(__dirname, 'routes'),
	options: { prefix: '/api' }
});

// Schedule recurring payments processing
const cronSchedule = process.env.RECURRING_PAYMENTS_CRON_SCHEDULE || '0 0 * * *'; // Daily at midnight
processRecurringPaymentsTask(cronSchedule);

// Start server
const start = async () => {
	try {
		await fastify.register(formDataPlugin);
		await fastify.register(supertokensPlugin);

		fastify.setErrorHandler(errorHandler);

		await fastify.ready();
		fastify.swagger();

		await fastify.listen({ port: 3001, host: '0.0.0.0' });
		console.log('Server started on http://localhost:3001');
		console.log('API documentation available at http://localhost:3001/documentation');
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
