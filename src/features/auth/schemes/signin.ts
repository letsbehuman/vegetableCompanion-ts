import Joi, { ObjectSchema } from 'joi';

const signinSchema: ObjectSchema = Joi.object().keys({
  username: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Username must be of type string',
    'string.min': 'Username must be between 4-8 characters',
    'string.max': 'Username must be between 4-8 characters',
    'string.empty': 'Username is a required field'
  }),
  password: Joi.string().required().min(4).max(8).messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Password must be between 4-8 characters',
    'string.max': 'Password must be between 4-8 characters',
    'string.empty': 'Password is a required field'
  })
});
export { signinSchema };
