export function invalidRequest(): object {
    return {statusCode: 400, body: 'Invalid request'};
}

export function notFound(): object {
    return {statusCode: 401, body: 'Not found'};
}