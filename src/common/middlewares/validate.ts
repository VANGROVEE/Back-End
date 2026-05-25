import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";

export const validate =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.query);

      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        file: req.file,
      });
      return next();
    } catch (error) {
      return next(error);
    }
  };
