import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';

class UserService {
  public async addUserData(data: IUserDocument): Promise<void> {
    await UserModel.create(data);
  }

  public async getUserById(userId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } }, //here userId has to be a mongodb object id
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } }, //lookup from another collection
      { $unwind: '$authId' }, //transform an array to an object
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }

  public async getUserByAuthId(authId: string): Promise<IUserDocument> {
    const users: IUserDocument[] = await UserModel.aggregate([
      { $match: { authId: new mongoose.Types.ObjectId(authId) } },
      { $lookup: { from: 'Auth', localField: 'authId', foreignField: '_id', as: 'authId' } },
      { $unwind: '$authId' },
      { $project: this.aggregateProject() }
    ]);
    return users[0];
  }

  private aggregateProject() {
    // for $project operator
    // 1= include
    // 0 = exclude
    return {
      _id: 1,
      username: '$authId.username', // this syntax only works because the $unwind operator
      uId: '$authId.uId',
      email: '$authId.email',
      createdAt: '$authId.createdAt'
    };
  }
}

export const userService: UserService = new UserService();
