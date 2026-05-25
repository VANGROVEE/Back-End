import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "../utils/cache";

export type PrismaDelegate = {
  findMany: (args?: any) => Promise<unknown>;
  findUnique: (args: any) => Promise<unknown>;
  create: (args: any) => Promise<unknown>;
  update: (args: any) => Promise<unknown>;
  delete: (args: any) => Promise<unknown>;
};

export abstract class BaseService<T, D extends PrismaDelegate> {
  protected cachePrefix: string;

  constructor(
    protected model: D,
    cachePrefix: string,
  ) {
    this.cachePrefix = cachePrefix;
  }

  protected getListKey(args?: any) {
    return `${this.cachePrefix}:all:${JSON.stringify(args || {})}`;
  }

  protected getDetailKey(id: string) {
    return `${this.cachePrefix}:detail:${id}`;
  }

  protected createUserKey(userId: string, suffix: string) {
    return `${this.cachePrefix}:user:${userId}:${suffix}`;
  }

  protected async invalidateCache(options?: { id?: string; userId?: string }) {
    const patterns = [
      `${this.cachePrefix}:all:*`,
      `cache:*${this.cachePrefix}*`,
    ];

    const promises: Promise<any>[] = patterns.map((p) =>
      cacheHelper.deletePattern(p),
    );

    if (options?.id) {
      promises.push(cacheHelper.delete(this.getDetailKey(options.id)));
      promises.push(cacheHelper.deletePattern(`cache:*${options.id}*`));
    }

    if (options?.userId) {
      promises.push(
        cacheHelper.deletePattern(
          `${this.cachePrefix}:user:${options.userId}:*`,
        ),
      );
      promises.push(cacheHelper.deletePattern(`cache:*${options.userId}*`));
    }

    await Promise.all(promises);
  }

  async findAll(args?: Parameters<D["findMany"]>[0]): Promise<T[]> {
    return cacheHelper.getOrSet(this.getListKey(args), async () => {
      return (await this.model.findMany(args as never)) as T[];
    });
  }

  async findById(id: string, args?: any, bypassCache = false): Promise<T> {
    if (bypassCache) {
      const data = (await this.model.findUnique({
        where: { id },
        ...args,
      } as never)) as T;
      if (!data) throw new ApiError(404, "Data tidak ditemukan!");
      return data;
    }

    return cacheHelper.getOrSet(this.getDetailKey(id), async () => {
      const data = (await this.model.findUnique({
        where: { id },
        ...args,
      } as never)) as T;
      if (!data) throw new ApiError(404, "Data tidak ditemukan!");
      return data;
    });
  }

  async create(
    payload: Parameters<D["create"]>[0]["data"],
    args?: any,
    userId?: string,
  ): Promise<T> {
    const result = (await this.model.create({
      data: payload,
      ...args,
    } as never)) as T;

    await this.invalidateCache({ userId });
    return result;
  }

  async update(
    id: string,
    payload: any,
    args?: any,
    userId?: string,
  ): Promise<T> {
    await this.findById(id, {}, true);

    const result = (await this.model.update({
      where: { id },
      data: payload,
      ...args,
    } as never)) as T;

    await this.invalidateCache({ id, userId });
    return result;
  }

  async delete(id: string, args?: any, userId?: string): Promise<T> {
    await this.findById(id, {}, true);

    const result = (await this.model.delete({
      where: { id },
      ...args,
    } as never)) as T;

    await this.invalidateCache({ id, userId });
    return result;
  }
}
