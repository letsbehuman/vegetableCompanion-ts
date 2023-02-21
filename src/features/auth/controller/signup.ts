// import { UserCache } from '@services/redis/user.cache';
// import { IUserDocument } from '@user/interfaces/user.interface';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { joiValidation } from '@globals/decorators/joi-validation.decorators';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';

import { Helpers } from '@globals/helpers/helpers';
import HTTP_STATUS from 'http-status-codes';
import { omit } from 'lodash';
import JWT from 'jsonwebtoken';
// import { authQueue } from '@services/queues/auth.queue';
// import { userQueue } from '@services/queues/user.queue';
import { config } from '@root/config';
import { signupSchema } from '@auth/schemas/signup';
import { authService } from '@services/db/auth.service';
import { BadRequestError } from '@globals/helpers/error.handler';

// const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, password, email } = req.body;
    const checkIfUserExist: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials');
    }
    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId(); //public id
    const uId = `${Helpers.generateRandomIntegers(12)}`;
    const authData: IAuthDocument = SignUp.prototype.singupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password
    });

    //add to database

    // omit(userDataForCache, ['uId', 'username', 'email', 'password']);
    // authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });
    // userQueue.addUserJob('addUserToDB', { value: userDataForCache });

    // const userJwt: string = SignUp.prototype.signupToken(authData, userObjectId);
    // req.session = { jwt: userJwt };

    res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully', authData });
  }

  // private signupToken(data: IAuthDocument, userObjectId: ObjectId): string {
  //   return JWT.sign(
  //     {
  //       userId: userObjectId,
  //       uId: data.uId,
  //       email: data.email,
  //       username: data.username
  //     },
  //     config.JWT_TOKEN!
  //   );
  // }
  private singupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      createdAt: new Date()
    } as unknown as IAuthDocument;
  }
  // private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
  //   const { _id, username, email, uId, password } = data;
  //   return {
  //     _id: userObjectId,
  //     authId: _id,
  //     uId,
  //     username: Helpers.firstLetterUppercase(username),
  //     email,
  //     password
  //   } as unknown as IUserDocument;
  // }
}
