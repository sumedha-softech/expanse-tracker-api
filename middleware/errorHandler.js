const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err.statusCode || 500;
    const errorResponse = {
        success: false,
        message: err.message || 'Something went wrong!',
    };
    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;