import { Context } from 'hono';

// Extend Hono's context type to include our custom variables
export type AppContext = Context & {
  Variables: {
    userId: string;
  };
};
