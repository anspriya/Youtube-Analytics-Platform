const Joi = require('joi');

const validateRegister = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });
  
  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });
  
  return schema.validate(data);
};

const validateChannel = (data) => {
  const schema = Joi.object({
    channelId: Joi.string().required()
  });
  
  return schema.validate(data);
};

module.exports = {
  validateRegister,
  validateLogin,
  validateChannel
};