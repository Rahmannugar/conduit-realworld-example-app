"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Collections", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addConstraint("Collections", {
      fields: ["userId", "name"],
      type: "unique",
      name: "collections_user_id_name_unique",
    });

    await queryInterface.addIndex("Collections", ["userId", "createdAt", "id"], {
      name: "collections_user_id_created_at_id_index",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Collections");
  },
};
