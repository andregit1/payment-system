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
