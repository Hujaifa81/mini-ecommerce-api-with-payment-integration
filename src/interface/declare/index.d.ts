import { JwtPayload } from "jsonwebtoken";
import { Role } from "../../../generated/prisma/enums";

export interface IJWTPayload extends JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user: IJWTPayload;
    }
  }
}
