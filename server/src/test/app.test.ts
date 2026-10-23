import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { app } from "../app.js";

describe("PrepForge API foundation", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = app.listen(0);
    await once(server, "listening");
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    server.close();
    await once(server, "close");
  });

  it("reports service health using the standard success envelope", async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: { status: "ok", service: "prepforge-api" },
    });
  });

  it("returns a consistent error envelope for unknown routes", async () => {
    const response = await fetch(`${baseUrl}/api/v1/not-a-route`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "The requested resource was not found." },
    });
  });

  it("protects question-practice routes behind a verified session", async () => {
    const response = await fetch(`${baseUrl}/api/v1/practice/topics`);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: "UNAUTHENTICATED", message: "Please sign in to continue." },
    });
  });
});
