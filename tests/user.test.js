const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/user");

const userOneId = new mongoose.Types.ObjectId();

const userOne = {
  _id: userOneId,
  name: "Steve Rodgers",
  email: "steve@avengers.com",
  password: "something",
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET),
    },
  ],
};

beforeEach(async () => {
  await User.deleteMany();
  await User.create(userOne);
});

test("should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Anurag",
      email: "arg@brg.com",
      password: "something",
    })
    .expect(201);

  // Assert that the user is saved to the db successfully
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assert about response body
  expect(response.body).toMatchObject({
    user: {
      name: "Anurag",
      email: "arg@brg.com",
    },
    token: user.tokens[0].token,
  });
});

test("should login an existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test("should not login an non-existent user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "anonymous@gmail.com",
      password: "password",
    })
    .expect(400);
});

test("should get the profile for logged in user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test("should not get the profile for unauthenticated user", async () => {
  await request(app).get("/users/me").send().expect(401);
});
