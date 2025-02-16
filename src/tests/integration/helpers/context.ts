import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

export const createMockContext = ({
  user = null,
  body = {},
  params = {},
  query = {}
} = {}) => {
  const req = mock<Request>();
  const res = mock<Response>();

  req.user = user;
  req.body = body;
  req.params = params;
  req.query = query;

  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();

  return { req, res };
};