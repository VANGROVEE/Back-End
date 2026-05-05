import { ApiError } from "@/common/utils/api-error";

export type PrismaDelegate = {
  findMany: (args?: never) => Promise<unknown>;
  findUnique: (args: never) => Promise<unknown>;
  create: (args: never) => Promise<unknown>;
  update: (args: never) => Promise<unknown>;
  delete: (args: never) => Promise<unknown>;
};

export abstract class BaseService<T, D extends PrismaDelegate> {
  constructor(protected model: D) {}

  async findAll(args?: Parameters<D["findMany"]>[0]): Promise<T[]> {
    return (await this.model.findMany(args as never)) as T[];
  }

  async findById(
    id: string,
    args?: Omit<Parameters<D["findUnique"]>[0], "where">,
  ): Promise<T> {
    const data = await this.model.findUnique({
      where: { id },
      ...args,
    } as never);

    if (!data) throw new ApiError(404, "Data tidak ditemukan!");
    return data as T;
  }

  async create(
    payload: Parameters<D["create"]>[0]["data"],
    args?: Omit<Parameters<D["create"]>[0], "data">,
  ): Promise<T> {
    return (await this.model.create({
      data: payload,
      ...args,
    } as never)) as T;
  }

  async update(
    id: string,
    payload: Parameters<D["update"]>[0]["data"],
    args?: Omit<Parameters<D["update"]>[0], "where" | "data">,
  ): Promise<T> {
    await this.findById(id);

    return (await this.model.update({
      where: { id },
      data: payload,
      ...args,
    } as never)) as T;
  }

  async delete(
    id: string,
    args?: Omit<Parameters<D["delete"]>[0], "where">,
  ): Promise<T> {
    await this.findById(id);
    return (await this.model.delete({
      where: { id },
      ...args,
    } as never)) as T;
  }
}
