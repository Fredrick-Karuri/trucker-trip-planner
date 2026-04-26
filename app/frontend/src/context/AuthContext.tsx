import {
  createContext,
} from "react";
import { AuthContextValue } from "./type";


export const AuthContext = createContext<AuthContextValue | null>(null);

