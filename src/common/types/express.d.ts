import { JWTPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface User extends JWTPayload {}

    interface Request {
      user: User;
    }
  }
}
