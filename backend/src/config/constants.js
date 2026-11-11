export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden'
};

export const REPORT_STATUS = {
  PENDING: 'pending',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
};

export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  REPLY: 'reply',
  SYSTEM: 'system',
  PAYMENT: 'payment'
};

export const TARGET_TYPES = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user'
};

export const PACKAGES = {
  ai_5credits: {
    amount: 50000,
    credits: 5,
    description: 'VIP 5 luot AI Trip Generator - TravelShare'
  }
};

export default {
  ROLES,
  POST_STATUS,
  REPORT_STATUS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  TARGET_TYPES,
  PACKAGES
};
