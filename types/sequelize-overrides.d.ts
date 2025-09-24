import { Sequelize, ModelStatic, Model, ModelAttributes, InitOptions } from 'sequelize';

declare module 'sequelize' {
    interface ModelStatic<M extends Model = Model> {
        init(sequelize: Sequelize): ModelStatic<Model>;
    }
}

export {};