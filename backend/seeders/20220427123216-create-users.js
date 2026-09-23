"use strict";

const { bcryptHash } = require("../helper/bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await Promise.all(
      Array(5)
        .fill(null)
        .map(async (_, index) => ({
          username: `exampleUser${index + 1}`,
          email: `example${index + 1}@mail.com`,
          password: await bcryptHash(`examplePwd${index + 1}`),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
    );

    await queryInterface.bulkInsert("Users", users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
