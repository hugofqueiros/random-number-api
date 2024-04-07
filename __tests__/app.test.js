import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app";

jest.useFakeTimers();

jest.mock('node-fetch');

describe("API GET /average", () => {
    it('should respond with JSON containing average', async () => {
        const response = await request(app).get('/average');
        expect(response.status).toBe(200);

        expect(response.body).toHaveProperty('average');

        console.log('response body', response.body);
    });

    it("should return rate limit exceeded message", async () => {
        const agent = request.agent(app);

        await Promise.all([agent.get("/average"), agent.get("/average")]);

        const response = await agent.get("/average");

        expect(response.status).toBe(429);
        expect(response.body.message).toBe(
            "Rate limit exceeded. Please try again later."
        );
    });
});

describe("Sample Test", () => {
    it("should test that true === true", () => {
        expect(true).toBe(true);
    });
});
