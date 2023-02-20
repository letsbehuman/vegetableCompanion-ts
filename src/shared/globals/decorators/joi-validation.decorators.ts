/* eslint-disable @typescript-eslint/no-explicit-any */

import { JoinRequestValidationError } from '@globals/helpers/error.handler';
import { Request } from 'express';
import { ObjectSchema } from 'joi';
//In Typescript a decorator is a special kind of declaration attached to a method

type IJoiDecorator = (target: any, key: string, descriptor: PropertyDescriptor) => void; // this is a type of a method

export function joiValidation(schema: ObjectSchema): IJoiDecorator {
  return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    //args will be (req, res, next) from signup fuction for example
    descriptor.value = async function (...args: any[]) {
      const req: Request = args[0];
      const { error } = await Promise.resolve(schema.validate(req.body));
      if (error?.details) {
        throw new JoinRequestValidationError(error.details[0].message);
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
}
