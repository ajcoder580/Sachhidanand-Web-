const Enquiry = require('../models/enquiry/enquiry.model');
const { logger } = require('../config/logger');
const { STATUS, sendResponse } = require('../utils/statusCode');
const { getPaginationOptions, buildPaginationMeta } = require('../utils/paginationHelper');
const { sendContactEnquiry, resolveProvider } = require('../emailService');

const createEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.create(req.body);

    if (resolveProvider()) {
      try {
        await sendContactEnquiry({
          name: enquiry.name,
          phone: enquiry.mobileNumber,
          enquiryType: enquiry.admissionType,
          message: enquiry.message,
        });
      } catch (emailError) {
        logger.warn('Enquiry saved but email failed', { message: emailError.message });
      }
    }

    return sendResponse(res, STATUS.CREATED, {
      message: 'Enquiry submitted successfully',
      data: enquiry,
    });
  } catch (error) {
    logger.error('Create enquiry error', { stack: error.stack });
    return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to submit enquiry',
      error: error.message,
    });
  }
};

const adminGetEnquiries = async (req, res) => {
  try {
    const { status, search, admissionType } = req.query;
    const { page, limit, skip } = getPaginationOptions(req.query);

    const query = {};

    if (status) {
      query.status = status;
    }

    if (admissionType) {
      query.admissionType = admissionType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const [enquiries, total] = await Promise.all([
      Enquiry.find(query)
        .populate('adminRemarks.addedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Enquiry.countDocuments(query),
    ]);

    return sendResponse(res, STATUS.OK, {
      data: enquiries,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    logger.error('Admin get enquiries error', { stack: error.stack });
    return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to fetch enquiries',
      error: error.message,
    });
  }
};

const adminGetEnquiryStats = async (req, res) => {
  try {
    const [total, newCount, contactedCount, closedCount] = await Promise.all([
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.countDocuments({ status: 'contacted' }),
      Enquiry.countDocuments({ status: 'closed' }),
    ]);

    return sendResponse(res, STATUS.OK, {
      data: {
        total,
        counts: {
          new: newCount,
          contacted: contactedCount,
          closed: closedCount,
        },
      },
    });
  } catch (error) {
    logger.error('Admin get enquiry stats error', { stack: error.stack });
    return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to fetch enquiry stats',
      error: error.message,
    });
  }
};

const adminGetEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id).populate(
      'adminRemarks.addedBy',
      'name email role'
    );

    if (!enquiry) {
      return sendResponse(res, STATUS.NOT_FOUND, {
        message: 'Enquiry not found',
      });
    }

    return sendResponse(res, STATUS.OK, { data: enquiry });
  } catch (error) {
    logger.error('Admin get enquiry by ID error', { stack: error.stack });
    return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to fetch enquiry',
      error: error.message,
    });
  }
};

const adminUpdateEnquiryStatus = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('adminRemarks.addedBy', 'name email role');

    if (!enquiry) {
      return sendResponse(res, STATUS.NOT_FOUND, {
        message: 'Enquiry not found',
      });
    }

    return sendResponse(res, STATUS.OK, {
      message: 'Enquiry status updated successfully',
      data: enquiry,
    });
  } catch (error) {
    logger.error('Admin update enquiry status error', { stack: error.stack });
    return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to update enquiry status',
      error: error.message,
    });
  }
};

const adminAddEnquiryRemark = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return sendResponse(res, STATUS.NOT_FOUND, {
        message: 'Enquiry not found',
      });
    }

    enquiry.adminRemarks.push({
      remark: req.body.remark,
      addedBy: req.user.id,
    });

    if (enquiry.status === 'new') {
      enquiry.status = 'contacted';
    }

    await enquiry.save();
    await enquiry.populate('adminRemarks.addedBy', 'name email role');

    return sendResponse(res, STATUS.OK, {
      message: 'Remark added successfully',
      data: enquiry,
    });
  } catch (error) {
    logger.error('Admin add enquiry remark error', { stack: error.stack });
    return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to add remark',
      error: error.message,
    });
  }
};

const adminDeleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return sendResponse(res, STATUS.NOT_FOUND, {
        message: 'Enquiry not found',
      });
    }

    return sendResponse(res, STATUS.OK, {
      message: 'Enquiry deleted successfully',
    });
  } catch (error) {
    logger.error('Admin delete enquiry error', { stack: error.stack });
    return sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, {
      message: 'Failed to delete enquiry',
      error: error.message,
    });
  }
};

module.exports = {
  createEnquiry,
  adminGetEnquiries,
  adminGetEnquiryStats,
  adminGetEnquiryById,
  adminUpdateEnquiryStatus,
  adminAddEnquiryRemark,
  adminDeleteEnquiry,
};
