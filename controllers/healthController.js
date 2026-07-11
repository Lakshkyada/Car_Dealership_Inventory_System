export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString(),
  });
};
