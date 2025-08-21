const Service = require('../models/Service');
const AppError = require('../utils/appError');

async function listServices(req, res, next) {
  try {
    const items = await Service.find({ isActive: true }).sort({ title: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function listAllServices(req, res, next) {
  try {
    const items = await Service.find().sort({ title: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function createService(req, res, next) {
  try {
    const service = await Service.create(req.body);
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
}

async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndUpdate(id, req.body, { new: true });
    if (!service) throw AppError.notFound('Service not found');
    res.json(service);
  } catch (error) {
    next(error);
  }
}

async function deleteService(req, res, next) {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) throw AppError.notFound('Service not found');
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listServices, listAllServices, createService, updateService, deleteService };

