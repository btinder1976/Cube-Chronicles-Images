/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { SessionUser } from './lib/session';
import type { AppEnv } from './lib/env';

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
      runtime?: {
        env: AppEnv;
        cf?: unknown;
        ctx?: { waitUntil(p: Promise<unknown>): void };
      };
    }
  }
}

export {};
