import { RequestHandler } from "express";

export const catchAsync = (
  fn: (req: any, res: any, next: any) => Promise<any>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
