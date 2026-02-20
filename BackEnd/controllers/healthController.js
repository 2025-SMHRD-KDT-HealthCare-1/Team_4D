const healthService = require('../services/healthService');

async function getHealth(req, res, next) {
  try {
    const result = await healthService.check();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getHealth,
};
