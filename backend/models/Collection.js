"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ User, Article, ArticleCollection }) {
      // Owner
      this.belongsTo(User, { foreignKey: "userId", as: "owner" });

      // Articles saved in this collection
      this.belongsToMany(Article, {
        through: ArticleCollection,
        as: "articles",
        foreignKey: "collectionId",
        otherKey: "articleId",
      });
    }

    toJSON() {
      return {
        ...this.get(),
        userId: undefined,
      };
    }
  }
  Collection.init(
    {
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: "Collection",
    },
  );
  return Collection;
};
