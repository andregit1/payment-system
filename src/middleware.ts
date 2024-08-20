import { FastifyReply, FastifyRequest } from 'fastify';
import { SessionRequest } from 'supertokens-node/framework/fastify';
import { verifySession } from 'supertokens-node/recipe/session/framework/fastify';
import { prisma } from './app';

// Middleware to check user authentication
export async function authenticateUser(request: SessionRequest, reply: FastifyReply) {
	try {
		const user = await prisma.user.findUnique({
			where: {
				supertokensId: request.session!.getUserId()
			}
		});

		if (!user) {
			return reply.status(401).send({ message: 'Unauthorized' });
		}

		return user;
	} catch (error) {
		console.error('Error checking user:', error);
		throw new Error('User not authorized');
	}
}

export const superTokensMiddleware = verifySession({
	sessionRequired: true // Ensure sessions are required for this middleware
});

export async function checkAuth(request: FastifyRequest, reply: FastifyReply) {
	await superTokensMiddleware(request, reply);
}
