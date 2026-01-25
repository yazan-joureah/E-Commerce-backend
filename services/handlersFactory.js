const ApiError = require('@utils/ApiError');
const ApiFeatures = require('@utils/ApiFeatures');
const asyncHandler = require('express-async-handler');
<<<<<<< HEAD
=======
const { Model } = require('mongoose');
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

exports.deleteOne = Model => asyncHandler(async (req, res, next) => {
  const document = await Model.findByIdAndDelete(req.params.id);

  if (!document) {
    return next(new ApiError(`No document found with id: ${req.params.id}`, 404));
  }

  res.status(204).send();
});

exports.updateOne = Model => asyncHandler(async (req, res, next) => {
  const document = await Model.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!document) {
    return next(new ApiError(`No document found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: document
  });
});

exports.createOne = Model => asyncHandler(async (req, res) => {
  const document = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    data: document
  });
});

exports.getOne = Model =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findById(req.params.id);
    if (!document) {
      return next(new ApiError(`No document found with id: ${req.params.id}`, 404));
    }
  
    res.status(200).json({
      status: 'success',
      data: document
    });
  });

  exports.getAll = Model => asyncHandler(async (req, res) => {
  const filter = req.params.categoryId ? { category: req.params.categoryId } : {};
  const countDocuments = await Model.countDocuments(filter);

  const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .search()
    .limitFields()
    .paginate(countDocuments);

  const { mongooseQuery, paginationResult } = apiFeatures;
  const documents = await mongooseQuery;

  res.status(200).json({
    status: 'success',
    results: documents.length,
    paginationResult,
    data: documents
  });
});