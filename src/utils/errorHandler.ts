import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
	request.log.error(error);

	if (error.validation) {
		return reply.status(400).send({
			statusCode: 400,
			error: 'Bad Request',
			message: error.message
		});
	}

	reply.status(500).send({
		statusCode: 500,
		error: 'Internal Server Error',
		message: 'An unexpected error occurred'
	});
}

// Custom error for unauthorized access
class UnauthorizedError extends Error {
	constructor(message = 'Unauthorized') {
		super(message);
		this.name = 'UnauthorizedError';
	}
}

// Error handler
export function customErrorHandler(reply: FastifyReply, error: any, message: string | undefined) {
	console.error('Error:', error);
	if (error instanceof UnauthorizedError) {
		return reply.status(401).send({ message: error.message });
	}
	return reply.status(500).send({ message: message ?? 'Internal Server Error' });
}
