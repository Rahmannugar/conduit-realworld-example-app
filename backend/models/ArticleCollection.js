"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ArticleCollection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({ Collection, Article }) {
      this.belongsTo(Collection, { foreignKey: "collectionId" });
      this.belongsTo(Article, { foreignKey: "articleId" });
    }
  }
  ArticleCollection.init(
    {
      collectionId: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      articleId: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "ArticleCollection",
      timestamps: true,
      updatedAt: false,
      id: false,
    },
  );
  return ArticleCollection;
};
