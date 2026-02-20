const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body || {});
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function findId(req, res, next) {
  try {
    const result = await authService.findId(req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function findPassword(req, res, next) {
  try {
    const result = await authService.findPassword(req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function withdrawMe(req, res, next) {
  try {
    const result = await authService.withdrawMe(req.auth?.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  signup,
  findId,
  findPassword,
  withdrawMe,
};
