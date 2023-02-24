import { IUserDocument } from '@user/interfaces/user.interface';
import { BaseCache } from '@services/redis/base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { Helpers } from '@globals/helpers/helpers';
import { ServerError } from '@globals/helpers/error.handler';

const log: Logger = config.createLogger('userCache');

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }
  //we can not get access of all the properties of a set from Redis, the next lines are the solution for that
  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const { _id, uId, username, email } = createdUser;
    const dataToSave: string[] = [
      '_id',
      `${_id}`,
      'uId',
      `${uId}`,
      'username',
      `${username}`,
      'email',
      `${email}`,
      'createdAt',
      `${createdAt}`
    ];

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      //Sorting set
      await this.client.ZADD('vc-user', { score: parseInt(userUId, 10), value: `${key}` });
      for (let i = 0; i < dataToSave.length; i += 2) {
        await this.client.HSET(`vc-users:${key}`, dataToSave[i], dataToSave[i + 1]);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error, try again.');
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: IUserDocument = (await this.client.HGETALL(`vc-users:${userId}`)) as unknown as IUserDocument;
      response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));

      return response;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error, try again.');
    }
  }
}
