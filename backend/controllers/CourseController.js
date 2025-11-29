const CourseService = require('../services/CourseService');
const AiService = require('../services/AiService');

const pdf = require('pdf-parse');

class CourseController {
  async create(req, res) {
    try {
      let { title, content } = req.body;
      
      // Handle File Uploads
      if (req.files && req.files.length > 0) {
        let extractedText = '';
        for (const file of req.files) {
          const data = await pdf(file.buffer);
          extractedText += `\n\n--- File: ${file.originalname} ---\n\n${data.text}`;
        }
        content = extractedText;
      }

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content (or PDF files) are required' });
      }

      const course = await CourseService.processNewCourse(title, content);
      res.status(201).json(course);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  async list(req, res) {
    try {
      const courses = await CourseService.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async get(req, res) {
    try {
      const course = await CourseService.getCourseById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  async updateSummary(req, res) {
    try {
      const { id } = req.params;
      const { style } = req.body;
      const course = await CourseService.getCourseById(id);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      const enhancedSummary = await AiService.generateEnhancedSummary(course.content || course.summary, style);
      
      course.summary = enhancedSummary;
      await course.save();

      res.json(course);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  async ensureQuizCount(req, res) {
    try {
      const { id } = req.params;
      const { count } = req.body;
      
      if (!count) {
        return res.status(400).json({ error: 'Count is required' });
      }

      const course = await CourseService.ensureQuizCount(id, parseInt(count));
      res.json(course);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  async submitQuizResult(req, res) {
    try {
      const { id } = req.params;
      const { questionsAnswered, correctAnswers } = req.body;
      
      console.log('Submit quiz - Course ID:', id);
      console.log('Submit quiz - User:', req.user?._id);
      console.log('Submit quiz - Data:', { questionsAnswered, correctAnswers });

      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userId = req.user._id;

      // Find user and update progress
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const progressIndex = user.quizProgress.findIndex(p => p.courseId.toString() === id);

      if (progressIndex > -1) {
        user.quizProgress[progressIndex].questionsAnswered += questionsAnswered;
        user.quizProgress[progressIndex].correctAnswers += correctAnswers;
        user.quizProgress[progressIndex].lastQuizDate = Date.now();
      } else {
        user.quizProgress.push({
          courseId: id,
          questionsAnswered,
          correctAnswers,
          lastQuizDate: Date.now()
        });
      }

      await user.save();

      console.log('Quiz result saved successfully');
      res.json({ success: true, progress: user.quizProgress });
    } catch (error) {
      console.error('Submit quiz error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async reviewQuiz(req, res) {
    try {
      const { id } = req.params;
      const { questions, userAnswers } = req.body;

      console.log('Review quiz - Course ID:', id);
      console.log('Review quiz - Questions:', questions?.length);
      console.log('Review quiz - Answers:', userAnswers?.length);

      const course = await CourseService.getCourseById(id);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const explanation = await AiService.explainMistakes(questions, userAnswers, course.content);

      res.json({ explanation });
    } catch (error) {
      console.error('Review quiz error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const course = await CourseService.deleteCourse(id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      
      const course = await CourseService.updateCourse(id, { title, content });

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      res.json(course);
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CourseController();
