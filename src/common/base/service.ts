import { ApiError } from "@/common/utils/api-error";
import { cacheHelper } from "../utils/cache";

export type PrismaDelegate = {
  findMany: (args?: never) => Promise<unknown>;
  findUnique: (args: never) => Promise<unknown>;
  create: (args: never) => Promise<unknown>;
  update: (args: never) => Promise<unknown>;
  delete: (args: never) => Promise<unknown>;
};

export abstract class BaseService<T, D extends PrismaDelegate> {
  protected cachePrefix: string;

  constructor(
    protected model: D,
    cachePrefix: string,
  ) {
    this.cachePrefix = cachePrefix;
  }

  protected getListKey(args?: Parameters<D["findMany"]>[0]) {
    if (!args || Object.keys(args).length === 0) {
      return `${this.cachePrefix}:all:default`;
    }

    const cleanArgs = JSON.parse(JSON.stringify(args));

    const queryString = JSON.stringify(cleanArgs);

    const hash = Bun.hash(queryString).toString();

    const finalKey = `${this.cachePrefix}:all:${hash}`;

    return finalKey;
  }

  protected getDetailKey(id: string) {
    return `${this.cachePrefix}:detail:${id}`;
  }

  protected createUserKey(userId: string, suffix: string) {
    return `${this.cachePrefix}:user:${userId}:${suffix}`;
  }

  protected async invalidateCache(options?: { id?: string; userId?: string }) {
    const patterns = [`${this.cachePrefix}:*`, `cache:*${this.cachePrefix}*`];

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
    const cacheKey = this.getListKey(args);
    return cacheHelper.getOrSet(cacheKey, async () => {
      const result = await this.model.findMany(args);
      return result as T[];
    });
  }

  async findById(
    id: string,
    args?: Omit<Parameters<D["findUnique"]>[0], "where">,
    bypassCache = false,
  ): Promise<T> {
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
    args?: Omit<Parameters<D["create"]>[0], "data">,
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
    payload: Parameters<D["update"]>[0]["data"],
    args?: Omit<Parameters<D["update"]>[0], "where" | "data">,
    userId?: string,
  ): Promise<T> {
    await this.findById(id, {} as any, true);

    const result = (await this.model.update({
      where: { id },
      data: payload,
      ...args,
    } as never)) as T;

    await this.invalidateCache({ id, userId });
    return result;
  }

  async delete(
    id: string,
    args?: Omit<Parameters<D["delete"]>[0], "where">,
    userId?: string,
  ): Promise<T> {
    await this.findById(id, {} as any, true);

    const result = (await this.model.delete({
      where: { id },
      ...args,
    } as never)) as T;

    await this.invalidateCache({ id, userId });
    return result;
  }
}
