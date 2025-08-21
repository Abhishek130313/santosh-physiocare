const Review = require('../models/Review');
const AppError = require('../utils/appError');

async function createReview(req, res, next) {
  try {
    const review = await Review.create(req.body);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

async function listPublicReviews(req, res, next) {
  try {
    const items = await Review.find({ approved: true }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function listAllReviews(req, res, next) {
  try {
    const items = await Review.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function approveReview(req, res, next) {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, { approved: true }, { new: true });
    if (!review) throw AppError.notFound('Review not found');
    res.json(review);
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) throw AppError.notFound('Review not found');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { createReview, listPublicReviews, listAllReviews, approveReview, deleteReview };

