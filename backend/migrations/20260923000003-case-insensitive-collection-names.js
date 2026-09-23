"use strict";
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeConstraint(
      "Collections",
      "collections_user_id_name_unique",
    );

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "collections_user_id_lower_name_unique" ON "Collections" ("userId", LOWER("name"));',
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX "collections_user_id_lower_name_unique";',
    );

    await queryInterface.addConstraint("Collections", {
      fields: ["userId", "name"],
      type: "unique",
      name: "collections_user_id_name_unique",
    });
  },
};
