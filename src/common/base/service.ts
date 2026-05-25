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
  protected autoCachePattern: string;

  constructor(
    protected model: D,
    cachePrefix: string,
  ) {
    this.cachePrefix = cachePrefix;
    this.autoCachePattern = `cache:*${cachePrefix}*`;
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

  protected async invalidateCache(options?: {
    id?: string;
    userId?: string;
    suffixes?: string[];
  }) {
    const promises: Promise<any>[] = [
      // Hapus cache list internal & cache otomatis middleware
      cacheHelper.deletePattern(`${this.cachePrefix}:all:*`),
      cacheHelper.deletePattern(this.autoCachePattern),
    ];

    // Jika ada ID detail
    if (options?.id) {
      promises.push(cacheHelper.delete(this.getDetailKey(options.id)));
    }

    // Jika ada User ID (untuk modul seperti Notifications/Orders)
    if (options?.userId) {
      const suffixes = options.suffixes || ["list", "unread_count"];
      const userKeys = suffixes.map((s) =>
        this.createUserKey(options.userId!, s),
      );
      promises.push(cacheHelper.delete(userKeys));
    }

    await Promise.all(promises);
  }

  /** Implementasi Method Standar */
  async findAll(args?: Parameters<D["findMany"]>[0]): Promise<T[]> {
    return cacheHelper.getOrSet(this.getListKey(args), async () => {
      return (await this.model.findMany(args as never)) as T[];
    });
  }

  async findById(
    id: string,
    args?: Omit<Parameters<D["findUnique"]>[0], "where">,
  ): Promise<T> {
    return cacheHelper.getOrSet(this.getDetailKey(id), async () => {
      const data = await this.model.findUnique({
        where: { id },
        ...args,
      } as never);
      if (!data)
        throw new ApiError(404, `Data ${this.cachePrefix} tidak ditemukan!`);
      return data as T;
    });
  }

  async create(
    payload: Parameters<D["create"]>[0]["data"],
    args?: Omit<Parameters<D["create"]>[0], "data">,
  ): Promise<T> {
    const result = (await this.model.create({
      data: payload,
      ...args,
    } as never)) as T;
    await this.invalidateCache();
    return result;
  }

  async update(
    id: string,
    payload: Parameters<D["update"]>[0]["data"],
    args?: Omit<Parameters<D["update"]>[0], "where" | "data">,
  ): Promise<T> {
    await this.findById(id);
    const result = (await this.model.update({
      where: { id },
      data: payload,
      ...args,
    } as never)) as T;
    await this.invalidateCache({ id });
    return result;
  }

  async delete(
    id: string,
    args?: Omit<Parameters<D["delete"]>[0], "where">,
  ): Promise<T> {
    await this.findById(id);
    const result = (await this.model.delete({
      where: { id },
      ...args,
    } as never)) as T;
    await this.invalidateCache({ id });
    return result;
  }
}
