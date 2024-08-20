import { FastifyRequest, FastifyReply } from 'fastify';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import supertokens from 'supertokens-node';
import { prisma } from '../app';
import { SessionRequest } from 'supertokens-node/framework/fastify';

export async function signupHandler(request: FastifyRequest, reply: FastifyReply) {
	const { email, password, username } = request.body as { email: string; password: string; username: string };

	try {
		// Sign up with SuperTokens
		const supertokensResponse = await EmailPassword.signUp('public', email, password);

		if (supertokensResponse.status !== 'OK') {
			return reply.status(400).send({ message: supertokensResponse.status });
		}

		// If SuperTokens signup is successful, create user in your database
		const user = await prisma.user.create({
			data: {
				email,
				username,
				password,
				supertokensId: supertokensResponse.user.id // Store SuperTokens user ID
			}
		});

		return reply.send({
			message: 'User created successfully',
			user: {
				id: user.id,
				email: user.email,
				username: user.username
			}
		});
	} catch (error) {
		console.error('Signup error:', error);
		return reply.status(400).send({ message: 'Error creating user' });
	}
}

export async function signinHandler(request: FastifyRequest, reply: FastifyReply) {
	const { email, password } = request.body as { email: string; password: string };
	const response = await EmailPassword.signIn('public', email, password);

	if (response.status === 'OK') {
		let userId = response.user.id;

		await Session.createNewSession(request, reply, 'public', supertokens.convertToRecipeUserId(userId));

		return reply.send({ message: 'User signed in successfully' });
	} else {
		return reply.status(400).send({ message: response.status });
	}
}

export async function signoutHandler(request: SessionRequest, reply: FastifyReply) {
	try {
		await request.session!.revokeSession();

		return reply.send({ message: 'User signed out successfully' });
	} catch (error) {
		console.error('Signout error:', error);
		return reply.status(401).send({ message: 'Error signing out user' });
	}
}
