const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/CourseController');

const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/', upload.array('files', 10), CourseController.create);
router.get('/', CourseController.list);
router.get('/:id', CourseController.get);
router.put('/:id/summary', CourseController.updateSummary);
router.post('/:id/quiz/ensure', CourseController.ensureQuizCount);
router.post('/:id/quiz/submit', protect, CourseController.submitQuizResult);
router.post('/:id/quiz/review', CourseController.reviewQuiz);
router.delete('/:id', CourseController.delete);
router.put('/:id', CourseController.update);

module.exports = router;
