const subjectsService = require('../services/subjectsService');

async function createSubject(req, res, next) {
  try {
    const result = await subjectsService.createSubject(req.body || {}, req.auth?.userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteSubject(req, res, next) {
  try {
    const { subject_id: subjectId } = req.params;
    const result = await subjectsService.softDeleteSubject(subjectId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSubject,
  deleteSubject,
};
